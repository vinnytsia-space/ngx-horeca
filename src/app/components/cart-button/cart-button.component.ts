import { Component, computed, inject, input } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CART_MAX_QTY, CartService, isOrderableDish } from '../../feature/cart/cart.service';

/** "Add to order" for one dish; turns into a quantity stepper once the dish is in the cart. */
@Component({
	selector: 'app-cart-button',
	imports: [TranslateDirective],
	template: `
		@if (orderable()) {
			@if (qty(); as count) {
				<div
					class="inline-flex h-10 items-center rounded-full border border-[var(--c-border)] bg-[var(--c-bg-primary)]"
					role="group"
					[attr.aria-label]="'Кількість у замовленні'"
					translate
					[translate]="{ ariaLabel: 'Кількість у замовленні' }"
				>
					<button
						class="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--c-text-secondary)] transition-colors hover:bg-[var(--c-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)]"
						type="button"
						[attr.aria-label]="'Зменшити кількість'"
						translate
						[translate]="{ ariaLabel: 'Зменшити кількість' }"
						(click)="cart.setQty(slug(), count - 1)"
					>
						<span class="material-symbols-outlined text-[20px]" aria-hidden="true">remove</span>
					</button>
					<span class="min-w-6 text-center text-sm font-semibold text-[var(--c-text-secondary)]" aria-live="polite">
						{{ count }}
					</span>
					<button
						class="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--c-text-secondary)] transition-colors hover:bg-[var(--c-bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-primary)] disabled:opacity-40"
						type="button"
						[disabled]="count >= maxQty"
						[attr.aria-label]="'Збільшити кількість'"
						translate
						[translate]="{ ariaLabel: 'Збільшити кількість' }"
						(click)="cart.add(slug())"
					>
						<span class="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
					</button>
				</div>
			} @else {
				<button
					class="ui-btn ui-btn-secondary inline-flex min-h-10 items-center gap-1.5"
					[class]="compact() ? '!px-3 !py-1.5 text-sm' : ''"
					type="button"
					(click)="cart.add(slug())"
				>
					<span class="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
					<span [translate]="'Додати до замовлення'">{{ 'Додати до замовлення' }}</span>
				</button>
			}
		}
	`,
})
export class CartButtonComponent {
	protected readonly cart = inject(CartService);

	readonly slug = input.required<string>();
	readonly soldOut = input(false);
	readonly compact = input(false);

	protected readonly maxQty = CART_MAX_QTY;
	protected readonly orderable = computed(() => !this.soldOut() && isOrderableDish(this.slug()));
	protected readonly qty = computed(() => this.cart.qty(this.slug()));
}
