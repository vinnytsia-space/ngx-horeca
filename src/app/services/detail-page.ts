import { computed, effect, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MetaService } from '@wawjs/ngx-core';
import { LanguageService, TranslateService } from '@wawjs/ngx-translate';
import { companyProfile } from '../feature/company/company.data';
import { CanonicalService } from './canonical.service';
import { buildPageImage } from './seo.utils';

export interface DetailPageMeta {
	/** Route path of the page, for example `/article/<slug>`. */
	path: string;
	/** Source-language title; translated before it is written to the head. */
	title: string;
	/** Source-language description; translated before it is written to the head. */
	description: string;
	/** The item's own photo, used when no page SEO override exists. */
	image?: string;
}

/**
 * The detail item for the route `:slug`: the service list first, then the bundled data, then the
 * first bundled item (route `canMatch` already sends unknown slugs to the 404 page). Call it from a
 * field initializer or constructor.
 */
export function injectDetailItem<T extends { slug: string }>(
	serviceItems: () => T[],
	findFallback: (slug: string) => T | null,
	fallbackItems: T[],
): Signal<T> {
	const route = inject(ActivatedRoute);
	const params = toSignal(route.paramMap, { initialValue: route.snapshot.paramMap });
	const firstItem = fallbackItems[0];

	if (!firstItem) {
		throw new Error('No items available in the bundled detail page data.');
	}

	return computed(() => {
		const slug = params().get('slug');
		const fromService = serviceItems().find((item) => item.slug === slug);

		return fromService ?? (slug ? findFallback(slug) : null) ?? firstItem;
	});
}

/**
 * Keeps the document title, meta tags and canonical URL in sync with a detail item and the
 * current language. Call it from a field initializer or constructor.
 */
export function useDetailPageMeta(meta: () => DetailPageMeta): void {
	const canonicalService = inject(CanonicalService);
	const languageService = inject(LanguageService);
	const metaService = inject(MetaService);
	const title = inject(Title);
	const translateService = inject(TranslateService);

	effect(() => {
		languageService.language();
		const { path, title: titleKey, description, image } = meta();
		const translatedTitle = translateService.translate(titleKey)();
		const translatedDescription = translateService.translate(description)();

		title.setTitle(`${translatedTitle} | ${companyProfile.name}`);
		metaService.applyMeta({
			title: translatedTitle,
			description: translatedDescription,
			image: buildPageImage(path, image),
		});
		canonicalService.setCanonicalUrl(path);
	});
}
