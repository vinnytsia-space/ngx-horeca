import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, UrlTree } from '@angular/router';

const _externalHrefPattern = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Adds `/` to the path of a non-root internal URL and keeps its query and fragment:
 * `/menu?x=1#top` becomes `/menu/?x=1#top`. Prerendered pages are served from `<path>/index.html`,
 * and static hosts such as GitHub Pages answer `/menu` with a 301 to `/menu/`, so links, canonical
 * URLs and the sitemap all use the slash form. External URLs (`https:`, `tel:`, `//host`) and
 * relative or fragment-only values are returned unchanged.
 */
export function withTrailingSlash(url: string): string {
	if (!url.startsWith('/') || _externalHrefPattern.test(url)) {
		return url;
	}

	const index = url.search(/[?#]/);
	const path = index === -1 ? url : url.slice(0, index);
	const rest = index === -1 ? '' : url.slice(index);

	if (path === '/' || path.endsWith('/') || path.endsWith(')')) {
		return url;
	}

	return `${path}/${rest}`;
}

/** Removes the trailing `/` from a non-root path, keeping the query and fragment. */
export function withoutTrailingSlash(url: string): string {
	const index = url.search(/[?#]/);
	const path = index === -1 ? url : url.slice(0, index);
	const rest = index === -1 ? '' : url.slice(index);
	const trimmed = path.replace(/\/+$/, '');

	return `${trimmed || (path.startsWith('/') ? '/' : '')}${rest}`;
}

/**
 * Router URLs with a trailing slash (`/menu/`), so `routerLink` hrefs, `router.url` and the address
 * bar match the canonical URLs. Both `/menu` and `/menu/` parse to the same tree, so routes,
 * `routerLinkActive`, query params and fragments behave as before. Provided in app.config.ts for the
 * server and the browser alike, so prerendered and hydrated hrefs are identical.
 */
@Injectable()
export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
	override parse(url: string): UrlTree {
		return super.parse(withoutTrailingSlash(url));
	}

	override serialize(tree: UrlTree): string {
		return withTrailingSlash(super.serialize(tree));
	}
}
