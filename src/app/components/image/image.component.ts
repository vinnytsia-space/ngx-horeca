import { DOCUMENT, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
	afterNextRender,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	inject,
	Injector,
	input,
	PLATFORM_ID,
	signal,
	viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective, TranslateService } from '@wawjs/ngx-translate';

@Component({
	selector: 'app-image',
	imports: [NgOptimizedImage, RouterLink, TranslateDirective],
	templateUrl: './image.component.html',
	styleUrl: './image.component.scss',
})
export class ImageComponent {
	readonly src = input.required<string>();
	readonly alt = input('');
	readonly mode = input<'fullscreen' | 'navigate'>('fullscreen');
	readonly link = input<string | unknown[] | null>(null);
	readonly imageClass = input('');
	readonly buttonClass = input('');
	readonly fullscreenImageClass = input('max-h-full max-w-full rounded-[1rem] object-contain');
	readonly width = input(640);
	readonly height = input(480);
	private readonly _translateService = inject(TranslateService);
	private readonly _document = inject(DOCUMENT);
	private readonly _injector = inject(Injector);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _trigger = viewChild<ElementRef<HTMLElement>>('trigger');
	private readonly _closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
	private _previousBodyOverflow: string | null = null;

	readonly openLabel = input('Відкрити зображення на весь екран');
	readonly closeLabel = input('Закрити повноекранне зображення');
	readonly loading = input<'eager' | 'lazy'>('lazy');

	protected readonly isFullscreen = signal(false);
	protected readonly isNavigation = computed(() => this.mode() === 'navigate' && !!this.link());
	protected readonly thumbnailClass = computed(() =>
		['image-photo', this.imageClass()].filter(Boolean).join(' '),
	);
	protected readonly triggerClass = computed(() =>
		[
			'image-trigger block w-full',
			this.isNavigation() ? 'cursor-pointer' : 'cursor-zoom-in',
			this.buttonClass(),
		]
			.filter(Boolean)
			.join(' '),
	);
	protected readonly expandedImageClass = computed(() =>
		['fullscreen-photo', this.fullscreenImageClass()].filter(Boolean).join(' '),
	);
	/** Translated piece by piece: the joined "label: alt" text is not a translation key. */
	protected readonly openAriaLabel = computed(() => {
		const translate = (key: string) => this._translateService.translate(key)();
		const alt = this.alt() ? translate(this.alt()) : '';
		const openLabel = translate(this.openLabel());

		if (this.isNavigation()) {
			return alt || openLabel;
		}

		return alt ? `${openLabel}: ${alt}` : openLabel;
	});

	protected readonly dialogLabel = computed(() =>
		this._translateService.translate(this.alt() || this.openLabel())(),
	);

	constructor() {
		inject(DestroyRef).onDestroy(() => this._unlockScroll());
	}

	protected open() {
		this.isFullscreen.set(true);
		this._lockScroll();
		afterNextRender(() => this._closeButton()?.nativeElement.focus(), {
			injector: this._injector,
		});
	}

	protected close() {
		if (!this.isFullscreen()) {
			return;
		}

		this.isFullscreen.set(false);
		this._unlockScroll();
		this._trigger()?.nativeElement.focus();
	}

	private _lockScroll() {
		if (!this._isBrowser || this._previousBodyOverflow !== null) {
			return;
		}

		this._previousBodyOverflow = this._document.body.style.overflow;
		this._document.body.style.overflow = 'hidden';
	}

	private _unlockScroll() {
		if (!this._isBrowser || this._previousBodyOverflow === null) {
			return;
		}

		this._document.body.style.overflow = this._previousBodyOverflow;
		this._previousBodyOverflow = null;
	}
}
