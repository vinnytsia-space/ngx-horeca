import { Component, inject, input, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseAuthService } from '../../feature/firebase/firebase-auth.service';
import { firebaseErrorText } from '../../feature/firebase/firebase-errors';

/**
 * "Sign in with Google". The Firebase SDK is loaded when the button is hovered, focused or touched, so
 * the popup opens right on the click (browsers block popups opened too long after it).
 */
@Component({
	selector: 'app-sign-in-button',
	imports: [TranslateDirective],
	host: { class: 'relative inline-flex flex-col' },
	template: `
		@if (variant() === 'icon') {
			<button
				class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-bg-primary)] text-[var(--c-text-secondary)] transition-colors duration-200 hover:bg-[var(--c-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg-secondary)] disabled:opacity-60"
				type="button"
				[disabled]="busy()"
				[attr.aria-busy]="busy()"
				aria-label="Увійти через Google"
				title="Увійти через Google"
				translate
				[translate]="{ ariaLabel: 'Увійти через Google', title: 'Увійти через Google' }"
				(mouseenter)="preload()"
				(focus)="preload()"
				(touchstart)="preload()"
				(click)="signIn()"
			>
				<span class="material-symbols-outlined text-[22px]" aria-hidden="true">account_circle</span>
			</button>
		} @else {
			<button
				class="ui-btn ui-btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
				type="button"
				[disabled]="busy()"
				[attr.aria-busy]="busy()"
				(mouseenter)="preload()"
				(focus)="preload()"
				(touchstart)="preload()"
				(click)="signIn()"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">login</span>
				<span [translate]="'Увійти через Google'">{{ 'Увійти через Google' }}</span>
			</button>
		}

		@if (error()) {
			<p
				class="text-xs font-semibold text-[var(--c-secondary)]"
				[class]="
					variant() === 'icon'
						? 'absolute right-0 top-[calc(100%+0.5rem)] z-10 w-56 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg-primary)] p-3 shadow-[var(--shadow-md)]'
						: 'mt-2'
				"
				role="alert"
			>
				<span [translate]="error()">{{ error() }}</span>
			</p>
		}
	`,
})
export class SignInButtonComponent {
	private readonly _auth = inject(FirebaseAuthService);

	/** `icon`: a round topbar button; `button`: a full primary button with text. */
	readonly variant = input<'icon' | 'button'>('button');

	protected readonly busy = signal(false);
	protected readonly error = signal('');

	protected preload(): void {
		this._auth.preload();
	}

	protected async signIn(): Promise<void> {
		if (this.busy()) return;

		this.busy.set(true);
		this.error.set('');

		try {
			await this._auth.signIn();
		} catch (error) {
			console.error('[sign-in]', error);
			this.error.set(
				(error as { code?: string }).code === 'auth/popup-blocked'
					? 'Браузер заблокував вікно входу. Дозвольте спливаючі вікна та спробуйте ще раз.'
					: firebaseErrorText(error),
			);
		} finally {
			this.busy.set(false);
		}
	}
}
