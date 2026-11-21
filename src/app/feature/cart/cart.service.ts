import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Service, computed, inject, signal } from '@angular/core';
import { fallbackDishes } from '../content/content.data';
import { companyProfile } from '../company/company.data';

const CART_STORAGE_KEY = 'horeca.cart';

/** The most of one dish, and the most different dishes, a cart holds (the rules allow 50 lines). */
export const CART_MAX_QTY = 99;
export const CART_MAX_ITEMS = 50;

/** What the cart stores: only the slug and the quantity; names and prices come from the menu data. */
export interface CartItem {
	slug: string;
	qty: number;
}

/** A cart line resolved against the bundled menu data. */
export interface CartLine {
	slug: string;
	name: string;
	image: string;
	price: number;
	qty: number;
	sum: number;
}

const _dishesBySlug = new Map(fallbackDishes.map((dish) => [dish.slug, dish]));

/** True when a dish can be ordered: it exists in the menu and has a price. */
export function isOrderableDish(slug: string): boolean {
	const price = _dishesBySlug.get(slug)?.price;

	return typeof price === 'number' && Number.isFinite(price) && price >= 0;
}

/**
 * The order cart, kept in localStorage. The saved cart is read by `restore()` after the first render
 * (never on the server), so prerendered HTML and hydration always start from an empty cart.
 */
@Service()
export class CartService {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private _restored = false;

	readonly currency = companyProfile.currency;
	readonly items = signal<CartItem[]>([]);

	/** Lines with names and prices from the menu; dishes no longer orderable are left out. */
	readonly lines = computed<CartLine[]>(() =>
		this.items()
			.filter((item) => isOrderableDish(item.slug))
			.map((item) => {
				const dish = _dishesBySlug.get(item.slug)!;

				return {
					slug: item.slug,
					name: dish.name,
					image: dish.image,
					price: dish.price,
					qty: item.qty,
					sum: _round(dish.price * item.qty),
				};
			}),
	);

	readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.qty, 0));
	readonly total = computed(() => _round(this.lines().reduce((sum, line) => sum + line.sum, 0)));

	/** Reads the saved cart once. Call it after render (topbar) or from client-rendered pages. */
	restore(): void {
		if (!this._isBrowser || this._restored) return;

		this._restored = true;

		try {
			const saved: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');

			this.items.set(_sanitize(saved));
		} catch {
			// Blocked storage or a broken value: start with an empty cart.
		}
	}

	qty(slug: string): number {
		return this.items().find((item) => item.slug === slug)?.qty ?? 0;
	}

	add(slug: string, qty = 1): void {
		if (!isOrderableDish(slug)) return;

		this.restore();

		const current = this.qty(slug);

		if (!current && this.items().length >= CART_MAX_ITEMS) return;

		this.setQty(slug, current + qty);
	}

	setQty(slug: string, qty: number): void {
		this.restore();

		const next = Math.min(CART_MAX_QTY, Math.max(0, Math.floor(qty) || 0));

		this.items.update((items) => {
			if (!next) return items.filter((item) => item.slug !== slug);

			return items.some((item) => item.slug === slug)
				? items.map((item) => (item.slug === slug ? { ...item, qty: next } : item))
				: [...items, { slug, qty: next }];
		});
		this._save();
	}

	remove(slug: string): void {
		this.setQty(slug, 0);
	}

	clear(): void {
		this.items.set([]);
		this._save();
	}

	private _save(): void {
		if (!this._isBrowser) return;

		try {
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
		} catch {
			// Not remembering the cart must never block ordering.
		}
	}
}

function _sanitize(value: unknown): CartItem[] {
	if (!Array.isArray(value)) return [];

	const seen = new Set<string>();

	return value
		.filter(
			(item): item is CartItem =>
				!!item &&
				typeof item.slug === 'string' &&
				typeof item.qty === 'number' &&
				isOrderableDish(item.slug),
		)
		.map((item) => ({ slug: item.slug, qty: Math.min(CART_MAX_QTY, Math.max(0, Math.floor(item.qty))) }))
		.filter((item) => item.qty > 0 && !seen.has(item.slug) && !!seen.add(item.slug))
		.slice(0, CART_MAX_ITEMS);
}

function _round(value: number): number {
	return Math.round(value * 100) / 100;
}
