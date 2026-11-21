import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Service, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Firebase error codes that mean the person closed or replaced the popup, not a real failure. */
const CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

/**
 * Remembers that this browser signed in, so the SDK is loaded at startup only for returning guests who
 * have a saved Firebase session; everyone else downloads it only on demand.
 */
const SIGNED_IN_STORAGE_KEY = 'horeca.firebase.signedIn';

export interface FirebaseUser {
	uid: string;
	email: string | null;
	emailVerified: boolean;
	name: string | null;
}

type FirebaseSdk = {
	app: import('firebase/app').FirebaseApp;
	auth: import('firebase/auth').Auth;
	provider: import('firebase/auth').GoogleAuthProvider;
	signInWithPopup: typeof import('firebase/auth').signInWithPopup;
};

/**
 * Google sign-in through Firebase Authentication. Browser-only: on the server (prerender) every method
 * is a no-op and `user` stays null. The Firebase SDK is loaded with dynamic imports on first use, so
 * normal visitors never download it.
 */
@Service()
export class FirebaseAuthService {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	/** The signed-in Firebase account, or null. Filled in once `watch()` has run. */
	readonly user = signal<FirebaseUser | null>(null);

	/** True once `watch()` knows whether someone is signed in. */
	readonly ready = signal(false);

	/**
	 * True when the signed-in account is listed in `environment.admins` (verified email or uid). This only
	 * decides what the app shows; the real protection is the admin list in firestore.rules.
	 */
	readonly isAdmin = computed(() => {
		const user = this.user();

		if (!user) return false;

		const email = user.emailVerified ? (user.email?.trim().toLowerCase() ?? '') : '';

		return environment.admins.some(
			(admin) => admin.uid === user.uid || (!!email && admin.email.toLowerCase() === email),
		);
	});

	private _sdk?: Promise<FirebaseSdk>;
	private _watching?: Promise<void>;

	/** True when this browser signed in before (see `SIGNED_IN_STORAGE_KEY`). */
	hasSavedSession(): boolean {
		if (!this._isBrowser) return false;

		try {
			return localStorage.getItem(SIGNED_IN_STORAGE_KEY) === '1';
		} catch {
			return false;
		}
	}

	/**
	 * Loads the SDK ahead of a click (hover, focus, opening the cart). Browsers block a popup that opens
	 * too long after the click, so the SDK must already be there when `signIn()` runs.
	 */
	preload(): void {
		if (!this._isBrowser) return;

		void this.watch().catch((error) => console.error('[firebase]', error));
	}

	/** Loads Firebase and keeps `user` in step with the sign-in. Safe to call more than once. */
	watch(): Promise<void> {
		if (!this._isBrowser) return Promise.resolve();

		return (this._watching ??= this._load()
			.then(async ({ auth }) => {
				const { onAuthStateChanged } = await import('firebase/auth');

				await auth.authStateReady();
				this._setUser(auth.currentUser);
				onAuthStateChanged(auth, (account) => this._setUser(account));
			})
			.catch((error) => {
				// Let a later call try again (for example after the connection comes back).
				this._watching = undefined;
				throw error;
			})
			.finally(() => this.ready.set(true)));
	}

	/** Opens the Google popup. Resolves true when signed in, false when the person closed the popup. */
	async signIn(): Promise<boolean> {
		if (!this._isBrowser) return false;

		const { auth, provider, signInWithPopup } = await this._load();

		try {
			const result = await signInWithPopup(auth, provider);

			this._setUser(result.user);
			void this.watch();

			return true;
		} catch (error) {
			if (CANCELLED.includes((error as { code?: string }).code ?? '')) return false;

			throw error;
		}
	}

	async signOut(): Promise<void> {
		if (!this._isBrowser || !this._sdk) return;

		const { auth } = await this._sdk;

		await auth.signOut();
		this._setUser(null);
	}

	/** Firestore, loaded on first use. */
	async firestore() {
		const { app } = await this._load();
		const fs = await import('firebase/firestore');

		return {
			db: fs.getFirestore(app),
			doc: fs.doc,
			collection: fs.collection,
			addDoc: fs.addDoc,
			updateDoc: fs.updateDoc,
			query: fs.query,
			where: fs.where,
			orderBy: fs.orderBy,
			limit: fs.limit,
			onSnapshot: fs.onSnapshot,
		};
	}

	private _setUser(
		account: { uid: string; email: string | null; emailVerified: boolean; displayName: string | null } | null,
	): void {
		this.user.set(
			account
				? {
						uid: account.uid,
						email: account.email,
						emailVerified: account.emailVerified,
						name: account.displayName,
					}
				: null,
		);

		try {
			if (account) localStorage.setItem(SIGNED_IN_STORAGE_KEY, '1');
			else localStorage.removeItem(SIGNED_IN_STORAGE_KEY);
		} catch {
			// Storage can be blocked; the session then just is not restored at startup.
		}
	}

	private _load(): Promise<FirebaseSdk> {
		if (!this._isBrowser) return Promise.reject(new Error('firebase-browser-only'));

		return (this._sdk ??= (async () => {
			const [{ getApp, getApps, initializeApp }, { getAuth, GoogleAuthProvider, signInWithPopup }] =
				await Promise.all([import('firebase/app'), import('firebase/auth')]);

			const app = getApps().length ? getApp() : initializeApp(environment.firebase);
			const provider = new GoogleAuthProvider();

			// Always show the account chooser, so a shared computer does not sign in silently.
			provider.setCustomParameters({ prompt: 'select_account' });

			return { app, auth: getAuth(app), provider, signInWithPopup };
		})().catch((error) => {
			this._sdk = undefined;
			throw error;
		}));
	}
}
