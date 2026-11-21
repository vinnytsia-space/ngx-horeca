import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Service, PLATFORM_ID } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { MetaService } from '@wawjs/ngx-core';
import { filter } from 'rxjs';
import { buildCanonicalUrl } from './seo.utils';

@Service()
export class CanonicalService {
	private readonly _document = inject(DOCUMENT);
	private readonly _metaService = inject(MetaService);
	private readonly _meta = inject(Meta);
	private readonly _router = inject(Router);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private _initialized = false;

	initialize() {
		if (this._initialized) {
			return;
		}

		this._initialized = true;
		this.setCanonicalUrl(this._router.url);

		this._router.events
			.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
			.subscribe((event) => this.setCanonicalUrl(event.urlAfterRedirects));
	}

	setCanonicalUrl(url: string) {
		// A canonical URL on a page that asks not to be indexed (the 404 page, unknown URLs) sends
		// search engines mixed signals, so those routes get neither the link nor og:url.
		if (this._isNoindexRoute()) {
			this._removeCanonical();
			return;
		}

		const canonical = buildCanonicalUrl(url);

		this._meta.updateTag({ property: 'og:url', content: canonical });

		if (this._isBrowser) {
			this._metaService.setLink({ canonical });
			return;
		}

		this._setCanonicalOnDocument(canonical);
	}

	/** True when the deepest active route sets a `data.meta.robots` value containing `noindex`. */
	private _isNoindexRoute(): boolean {
		let route: ActivatedRouteSnapshot | null = this._router.routerState.snapshot.root;
		let robots: unknown;

		while (route) {
			robots = route.data?.['meta']?.robots ?? robots;
			route = route.firstChild;
		}

		return typeof robots === 'string' && /\bnoindex\b/i.test(robots);
	}

	private _removeCanonical() {
		this._meta.removeTag('property="og:url"');

		for (const link of Array.from(
			this._document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
		)) {
			link.remove();
		}
	}

	private _setCanonicalOnDocument(canonical: string) {
		const existingLinks = Array.from(
			this._document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
		);
		const link = existingLinks[0] ?? this._document.createElement('link');

		if (!existingLinks.length) {
			link.setAttribute('rel', 'canonical');
			this._document.head.appendChild(link);
		} else if (existingLinks.length > 1) {
			for (let index = 1; index < existingLinks.length; index++) {
				existingLinks[index].remove();
			}
		}

		link.setAttribute('href', canonical);
	}
}
