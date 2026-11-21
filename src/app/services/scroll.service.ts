import { isPlatformBrowser, ViewportScroller } from '@angular/common';
import { inject, Service, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/**
 * Browser-like scrolling for the SPA: a new page starts at the top, Back and Forward return to the
 * position the page was left at, and re-navigating to the same URL (for example after a language
 * switch) keeps the current position.
 */
@Service()
export class ScrollService {
	private readonly _router = inject(Router);
	private readonly _viewportScroller = inject(ViewportScroller);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _positions = new Map<string, [number, number]>();
	private _initialized = false;
	private _restore = false;
	private _currentPath = '';

	initialize() {
		if (!this._isBrowser || this._initialized) {
			return;
		}

		this._initialized = true;
		this._currentPath = this._path(this._router.url);

		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}

		this._router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				this._positions.set(
					this._path(this._router.url),
					this._viewportScroller.getScrollPosition(),
				);
				this._restore = event.navigationTrigger === 'popstate';
				return;
			}

			if (event instanceof NavigationEnd) {
				this._applyPosition(event.urlAfterRedirects);
			}
		});
	}

	private _applyPosition(url: string) {
		const path = this._path(url);
		const samePage = path === this._currentPath;
		const restore = this._restore;

		this._currentPath = path;

		if (samePage || url.includes('#')) {
			return;
		}

		requestAnimationFrame(() => {
			const saved = restore ? this._positions.get(path) : undefined;

			this._viewportScroller.scrollToPosition(saved ?? [0, 0]);
		});
	}

	private _path(url: string) {
		return url.split(/[?#]/)[0] || '/';
	}
}
