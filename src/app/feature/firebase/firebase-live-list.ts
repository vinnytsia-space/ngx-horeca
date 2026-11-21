import { signal } from '@angular/core';
import type { DocumentData, Query } from 'firebase/firestore';
import { firebaseErrorText } from './firebase-errors';
import { FirebaseAuthService } from './firebase-auth.service';

type Firestore = Awaited<ReturnType<FirebaseAuthService['firestore']>>;

/**
 * A Firestore query kept live with `onSnapshot`. `start()` (re)starts the listener, `stop()` ends it;
 * a page calls `stop()` when it is destroyed. Only used from client-rendered pages.
 */
export class FirebaseLiveList<T extends { id: string }> {
	readonly items = signal<T[]>([]);
	readonly loading = signal(false);

	/** A translatable error text, or '' when the last read worked. */
	readonly error = signal('');

	private _run = 0;
	private _unsubscribe: (() => void) | null = null;

	constructor(
		private readonly _auth: FirebaseAuthService,
		private readonly _fromDoc: (id: string, data: DocumentData) => T,
	) {}

	async start(build: (fs: Firestore) => Query<DocumentData>): Promise<void> {
		const run = ++this._run;

		this._unsubscribe?.();
		this._unsubscribe = null;
		this.loading.set(true);
		this.error.set('');

		try {
			const fs = await this._auth.firestore();

			if (run !== this._run) return;

			this._unsubscribe = fs.onSnapshot(
				build(fs),
				(snapshot) => {
					if (run !== this._run) return;

					this.items.set(snapshot.docs.map((item) => this._fromDoc(item.id, item.data())));
					this.loading.set(false);
				},
				(error) => {
					if (run !== this._run) return;

					console.error('[firestore]', error);
					this.error.set(firebaseErrorText(error));
					this.loading.set(false);
				},
			);
		} catch (error) {
			if (run !== this._run) return;

			console.error('[firestore]', error);
			this.error.set(firebaseErrorText(error));
			this.loading.set(false);
		}
	}

	stop(): void {
		this._run++;
		this._unsubscribe?.();
		this._unsubscribe = null;
		this.loading.set(false);
	}
}
