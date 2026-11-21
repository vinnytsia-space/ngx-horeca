import type { MetaPage } from '@wawjs/ngx-core';
import { companyProfile } from '../feature/company/company.data';
import { withTrailingSlash } from './trailing-slash';

const _absoluteUrlPattern = /^https?:\/\//i;

export const seoTitleSuffix = ` | ${companyProfile.name}`;

export function buildAbsoluteUrl(value: string | null | undefined): string | undefined {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return undefined;
	}

	if (_absoluteUrlPattern.test(value)) {
		return value.trim();
	}

	return `${companyProfile.siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

/**
 * Absolute canonical URL for a router URL. Non-root paths end with `/` because prerendered pages are
 * served from `<path>/index.html`, and static hosts such as GitHub Pages redirect `/menu` to `/menu/`.
 * Router links use the same form (TrailingSlashUrlSerializer in trailing-slash.ts).
 */
export function buildCanonicalUrl(url: string): string {
	const path = url.split(/[?#]/)[0] || '/';
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;

	if (normalizedPath === '/') {
		return companyProfile.siteUrl;
	}

	return `${companyProfile.siteUrl}${withTrailingSlash(normalizedPath)}`;
}

export function buildRouteMeta(path: string): MetaPage {
	const pageSeo = companyProfile.pageSeo[path];

	return {
		title: stripTitleSuffix(
			pageSeo?.title ?? (path === '/' ? companyProfile.defaultSeo.title : undefined),
		),
		description:
			pageSeo?.description ?? (path === '/' ? companyProfile.defaultSeo.description : undefined),
		image: buildAbsoluteUrl(pageSeo?.image ?? companyProfile.defaultSeo.image),
		robots: pageSeo?.robots,
	};
}

const _detailCollections: Record<string, string> = {
	article: '/articles',
	discount: '/discounts',
	dish: '/menu',
	event: '/events',
	job: '/jobs',
	product: '/products',
	profile: '/team',
	quest: '/quests',
	review: '/reviews',
	room: '/rooms',
};

/** A page override wins, then the item's photo, its collection photo, and the venue fallback. */
export function buildPageImage(path: string, itemImage?: string): string | undefined {
	const collection = _detailCollections[path.split('/')[1]];
	return buildAbsoluteUrl(
		companyProfile.pageSeo[path]?.image ||
			itemImage?.trim() ||
			(collection ? companyProfile.pageSeo[collection]?.image : undefined) ||
			companyProfile.defaultSeo.image,
	);
}

export function stripTitleSuffix(title: string | null | undefined): string | undefined {
	if (typeof title !== 'string' || title.trim().length === 0) {
		return undefined;
	}

	const normalizedTitle = title.trim();
	const leadingTitlePrefix = `${companyProfile.name} | `;

	if (normalizedTitle.endsWith(seoTitleSuffix)) {
		return normalizedTitle.slice(0, -seoTitleSuffix.length);
	}

	if (normalizedTitle.startsWith(leadingTitlePrefix)) {
		return normalizedTitle.slice(leadingTitlePrefix.length);
	}

	return normalizedTitle;
}
