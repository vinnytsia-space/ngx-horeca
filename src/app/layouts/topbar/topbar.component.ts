import { NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService, TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import type { Language } from '@wawjs/ngx-translate';
import type { AppLanguage } from '../../../environments/environment.prod';
import { SignInButtonComponent } from '../../components/sign-in-button/sign-in-button.component';
import { CartService } from '../../feature/cart/cart.service';
import { companyProfile } from '../../feature/company/company.data';
import { FirebaseAuthService } from '../../feature/firebase/firebase-auth.service';

@Component({
	selector: 'app-topbar',
	imports: [NgOptimizedImage, RouterLink, SignInButtonComponent, TranslateDirective],
	host: {
		'(document:keydown.escape)': 'closeMenus(true)',
		'(document:click)': 'onDocumentClick($event)',
	},
	templateUrl: './topbar.component.html',
	styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
	private readonly _languageService = inject(LanguageService);
	private readonly _translateService = inject(TranslateService);
	private readonly _themeService = inject(ThemeService);
	private readonly _router = inject(Router);

	protected readonly mode = computed(() => this._themeService.mode() ?? 'light');
	protected readonly company = companyProfile;
	protected readonly languageMenuOpen = signal(false);
	protected readonly accountMenuOpen = signal(false);
	protected readonly auth = inject(FirebaseAuthService);
	protected readonly cart = inject(CartService);
	protected readonly cartLabel = computed(() => {
		this.activeLanguage();
		const label = this._translateService.translate('Кошик')();
		const count = this.cart.count();

		return count ? `${label}: ${count}` : label;
	});
	protected readonly accountMenuLabel = computed(() => {
		this.activeLanguage();
		return this._translateService.translate('Меню акаунта')();
	});
	private readonly _languageMenu = viewChild<ElementRef<HTMLElement>>('languageMenu');
	private readonly _languageToggle = viewChild<ElementRef<HTMLElement>>('languageToggle');
	private readonly _accountMenu = viewChild<ElementRef<HTMLElement>>('accountMenu');
	private readonly _accountToggle = viewChild<ElementRef<HTMLElement>>('accountToggle');
	// The default language comes first, then the rest by number of speakers (environment
	// `population`, in millions); ties keep the environment order.
	protected readonly languages = computed(() => {
		const defaultLanguage = this._languageService.defaultLanguage();

		return this._languageService
			.languages()
			.map((language) => _toAppLanguage(language))
			.sort(
				(a, b) =>
					Number(b.code === defaultLanguage) - Number(a.code === defaultLanguage) ||
					b.population - a.population,
			);
	});
	protected readonly activeLanguage = this._languageService.language;
	protected readonly currentLanguage = computed(() =>
		_toAppLanguage(this._languageService.getLanguage(this.activeLanguage())),
	);
	protected readonly toggleLabel = computed(() => {
		this.activeLanguage();
		return this.mode() === 'dark'
			? this._translateService.translate('Увімкнути світлий режим')()
			: this._translateService.translate('Увімкнути темний режим')();
	});
	protected readonly languageMenuLabel = computed(() => {
		this.activeLanguage();
		return this._translateService.translate('Відкрити меню мов')();
	});
	protected readonly languageCycleLabel = computed(
		() => {
			this.activeLanguage();
			return `${this._translateService.translate('Перемкнути мову на')()} ${this.getNextLanguage().nativeName}`;
		},
	);

	constructor() {
		this._themeService.init();

		// Browser only, after hydration: the saved cart, and the Firebase session of a guest who signed in
		// before. Everyone else downloads Firebase only when they reach for sign-in or the cart.
		afterNextRender(() => {
			this.cart.restore();

			if (this.auth.hasSavedSession()) this.auth.preload();
		});
	}

	protected toggleAccountMenu() {
		this.languageMenuOpen.set(false);
		this.accountMenuOpen.update((open) => !open);
	}

	protected async signOut() {
		this.accountMenuOpen.set(false);
		await this.auth.signOut();
	}

	/** Escape closes an open menu and returns focus to its button. */
	protected closeMenus(restoreFocus = false) {
		if (restoreFocus && this.languageMenuOpen()) this._languageToggle()?.nativeElement.focus();
		if (restoreFocus && this.accountMenuOpen()) this._accountToggle()?.nativeElement.focus();

		this.languageMenuOpen.set(false);
		this.accountMenuOpen.set(false);
	}

	/** A click outside an open menu (and outside its button) closes it. */
	protected onDocumentClick(event: Event) {
		const target = event.target as Node | null;
		const inside = (ref: ElementRef<HTMLElement> | undefined) =>
			!!target && !!ref?.nativeElement.contains(target);

		if (this.languageMenuOpen() && !inside(this._languageMenu()) && !inside(this._languageToggle())) {
			this.languageMenuOpen.set(false);
		}

		if (this.accountMenuOpen() && !inside(this._accountMenu()) && !inside(this._accountToggle())) {
			this.accountMenuOpen.set(false);
		}
	}

	protected toggleMode() {
		const nextMode = this.mode() === 'dark' ? 'light' : 'dark';
		this._themeService.setMode(nextMode);
	}

	protected async nextLanguage() {
		const nextLanguage = this.getNextLanguage();
		await this._translateService.setLanguage(nextLanguage.code);
		await this._router.navigateByUrl(this._router.url);
		this.languageMenuOpen.set(false);
	}

	protected toggleLanguageMenu() {
		this.accountMenuOpen.set(false);
		this.languageMenuOpen.update((open) => !open);
	}

	protected async setLanguage(language: AppLanguage) {
		await this._translateService.setLanguage(language.code);
		await this._router.navigateByUrl(this._router.url);
		this.languageMenuOpen.set(false);
	}

	protected getNextLanguage() {
		const languages = this.languages();
		const currentCode = this.currentLanguage().code;
		const currentIndex = languages.findIndex((language) => language.code === currentCode);

		return languages[(currentIndex + 1) % languages.length] ?? languages[0]!;
	}
}

function _toAppLanguage(language: Language | undefined): AppLanguage {
	const fallback: AppLanguage = {
		code: 'en',
		name: 'Англійська',
		nativeName: 'Англійська',
		flagSrc: 'flags/united-kingdom.svg',
		htmlLang: 'en',
		population: 0,
	};

	return { ...fallback, ...(language as Partial<AppLanguage> | undefined) };
}
