import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, PLATFORM_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LanguageService, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { CompanySeoService } from './feature/company/company-seo.service';
import { companyProfile } from './feature/company/company.data';
import { FooterComponent } from './layouts/footer/footer.component';
import { TopbarComponent } from './layouts/topbar/topbar.component';
import { CanonicalService } from './services/canonical.service';
import { ScrollService } from './services/scroll.service';
import { seoTitleSuffix, stripTitleSuffix } from './services/seo.utils';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, TopbarComponent, FooterComponent],
	template: '<app-topbar /><div class="pb-24"><router-outlet /></div><app-footer />',
})
export class App {
	private readonly _canonicalService = inject(CanonicalService);
	private readonly _companySeoService = inject(CompanySeoService);
	private readonly _document = inject(DOCUMENT);
	private readonly _languageService = inject(LanguageService);
	private readonly _router = inject(Router);
	private readonly _scrollService = inject(ScrollService);
	private readonly _title = inject(Title);
	private readonly _themeService = inject(ThemeService);
	private readonly _translateService = inject(TranslateService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _navigationEnd = toSignal(
		this._router.events.pipe(filter((event) => event instanceof NavigationEnd)),
		{ initialValue: null },
	);

	constructor() {
		this._canonicalService.initialize();
		this._scrollService.initialize();
		this._companySeoService.apply();

		// Browser chrome color follows the active mode (not the OS), using the page background.
		effect(() => {
			this._themeService.mode();

			if (!this._isBrowser) {
				return;
			}

			const color = getComputedStyle(this._document.documentElement)
				.getPropertyValue('--c-bg-primary')
				.trim();
			const meta = this._document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

			if (color && meta) {
				meta.content = color;
			}
		});

		effect(() => {
			const language = this._languageService.language();
			const htmlLang =
				environment.languages.find((item) => item.code === language)?.htmlLang ?? language;

			if (htmlLang) {
				this._document.documentElement.lang = htmlLang;
			}
		});

		effect(() => {
			this._navigationEnd();
			this._languageService.language();

			let route = this._router.routerState.snapshot.root;
			while (route.firstChild) {
				route = route.firstChild;
			}

			// Detail pages (`article/:slug`, `dish/:slug`, ...) set their own title from their item.
			if (route.routeConfig?.path?.includes(':')) {
				return;
			}

			// The SEO title from company.json `pageSeo` (the same one MetaService puts in og:title).
			// The prerendered HTML and the default language use it as is. Other languages use its
			// translation, or the translated short nav label while the SEO title has none.
			const seoTitle: string = route.data['meta']?.title ?? _defaultTitle;
			const translatedSeoTitle = this._translateService.translate(seoTitle)();
			const navLabel = _pageTitleKeys[_normalizeTitlePath(this._router.url)];
			const title =
				translatedSeoTitle === seoTitle &&
				navLabel &&
				this._languageService.language() !== environment.defaultLanguage
					? this._translateService.translate(navLabel)()
					: translatedSeoTitle;

			const suffix: string = route.data['meta']?.titleSuffix ?? seoTitleSuffix;

			this._title.setTitle(`${title}${suffix}`);
		});
	}
}

const _defaultTitle = stripTitleSuffix(companyProfile.defaultSeo.title) ?? companyProfile.name;

/** Short nav labels, used as the tab title in languages that have no SEO title translation. */

const _pageTitleKeys: Record<string, string> = {
	'/': companyProfile.name,
	'/menu': 'Меню',
	'/book': 'Бронювання',
	'/loyalty': 'Програма лояльності',
	'/questions': 'Поширені запитання',
	'/rules': 'Правила закладу',
	'/about': 'Про нас',
	'/spa': 'SPA',
	'/favorites': 'Обране',
	'/seasonal': 'Сезонні пропозиції',
	'/daily': "Меню дня",
	'/rooms': 'Номери',
	'/navigation': 'Навігація',
	'/gallery': 'Галерея',
	'/discounts': 'Знижки',
	'/articles': 'Статті',
	'/quests': 'Квести',
	'/reviews': 'Відгуки',
	'/events': 'Події',
	'/products': 'Товари',
	'/jobs': 'Вакансії',
	'/team': 'Команда',
	'/socials': 'Соцмережі',
	'/takeaway': 'З собою',
	'/catering': 'Кейтеринг',
};

function _normalizeTitlePath(url: string): string {
	return (url.split(/[?#]/)[0] || '/').replace(/\/+$/, '') || '/';
}
