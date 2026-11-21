import {
	ApplicationConfig,
	inject,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, UrlSerializer, withRouterConfig } from '@angular/router';
import { provideNgxCore } from '@wawjs/ngx-core';
import { provideNgxHttp } from '@wawjs/ngx-http';
import { provideTranslate } from '@wawjs/ngx-translate';
import { provideNgxUi, provideStartup } from '@wawjs/ngx-ui';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { ContentService } from './feature/content/content.service';
import { companyProfile } from './feature/company/company.data';
import { buildAbsoluteUrl, seoTitleSuffix, stripTitleSuffix } from './services/seo.utils';
import { TrailingSlashUrlSerializer } from './services/trailing-slash';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(
			routes,
			withRouterConfig({
				onSameUrlNavigation: 'reload',
			}),
		),
		// Internal links render as `/menu/`, the same as canonical URLs and the sitemap.
		{ provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
		provideHttpClient(withFetch()),
		provideNgxHttp({
			http: {
				url: environment.apiUrl,
			},
		}),
		provideClientHydration(withEventReplay()),
		provideNgxCore({
			meta: {
				applyFromRoutes: true,
				useTitleSuffix: true,
				defaults: {
					title: stripTitleSuffix(companyProfile.defaultSeo.title),
					titleSuffix: seoTitleSuffix,
					description: companyProfile.defaultSeo.description,
					image: buildAbsoluteUrl(companyProfile.defaultSeo.image),
					robots: companyProfile.defaultSeo.robots,
				},
			},
		}),
		provideTranslate({
			defaultLanguage: environment.defaultLanguage,
			languages: environment.languages,
			folder: '/i18n/',
		}),
		provideNgxUi({
			mode: 'light',
			modes: ['light', 'dark'],
			density: 'comfortable',
			densities: ['comfortable', 'compact'],
			radius: 'rounded',
			radiuses: ['rounded', 'square'],
			// Token values live in src/styles/_theme.scss, which org branches replace. Passing tokens
			// here would write them inline on <html> and override the org theme.
		}),
		provideAppInitializer(() => inject(ContentService).initialize()),
		// Startup screen: shown only when the saved language differs from the prerendered one (see
		// index.html). It is released after the first render, which already waits for the language
		// (provideTranslate loads it in an app initializer). The saved
		// theme is applied before first paint in index.html. Add more waits with
		// provideStartupTask('name', () => promise).
		provideStartup(),
	],
};
