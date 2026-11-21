import { Component, inject, signal } from '@angular/core';
import {
	FormField,
	FormRoot,
	form,
	maxLength,
	required,
	requiredError,
	validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { firstValueFrom } from 'rxjs';
import { CartButtonComponent } from '../../components/cart-button/cart-button.component';
import { SignInButtonComponent } from '../../components/sign-in-button/sign-in-button.component';
import { CartService } from '../../feature/cart/cart.service';
import { ContactService } from '../../feature/contact/contact.service';
import { requiredText } from '../../feature/contact/form.utils';
import { companyProfile } from '../../feature/company/company.data';
import { FirebaseAuthService } from '../../feature/firebase/firebase-auth.service';
import { firebaseErrorText } from '../../feature/firebase/firebase-errors';
import { Order, OrderType, OrdersService } from '../../feature/firebase/orders.service';

interface CheckoutRequest {
	phone: string;
	type: OrderType;
	address: string;
	comment: string;
}

/** How long placing an order may wait for Firestore (it waits for the connection when offline). */
const ORDER_TIMEOUT_MS = 15000;

/** The cart and checkout. Client-rendered (see app.routes.server.ts): it uses localStorage and Firebase. */
@Component({
	imports: [CartButtonComponent, FormField, FormRoot, RouterLink, SignInButtonComponent, TranslateDirective],
	templateUrl: './cart.component.html',
})
export class CartComponent {
	private readonly _contactService = inject(ContactService);
	private readonly _ordersService = inject(OrdersService);

	protected readonly auth = inject(FirebaseAuthService);
	protected readonly cart = inject(CartService);
	protected readonly company = companyProfile;
	protected readonly placedOrder = signal<Order | null>(null);
	protected readonly submitError = signal('');

	protected readonly checkout = signal<CheckoutRequest>({
		phone: this._contactService.getSavedPhone(),
		type: 'pickup',
		address: '',
		comment: '',
	});
	protected readonly checkoutForm = form(
		this.checkout,
		(path) => {
			required(path.phone, { message: 'Номер телефону обов’язковий' });
			requiredText(path.phone, 'Номер телефону обов’язковий');
			maxLength(path.phone, 100);
			// The address only counts for delivery; for pickup the field is hidden and not sent.
			const isDelivery = ({ valueOf }: { valueOf: (p: typeof path.type) => OrderType }) =>
				valueOf(path.type) === 'delivery';
			required(path.address, { message: 'Вкажіть адресу доставки', when: isDelivery });
			validate(path.address, (ctx) =>
				isDelivery(ctx) && !ctx.value().trim()
					? requiredError({ message: 'Вкажіть адресу доставки' })
					: null,
			);
			maxLength(path.address, 500, { when: isDelivery });
			maxLength(path.comment, 1000);
		},
		{
			name: 'checkout',
			submission: {
				action: async () => {
					await this._placeOrder();
					return null;
				},
				onInvalid: (field) => {
					if (field.phone().invalid()) field.phone().focusBoundControl();
					else field.address().focusBoundControl();
				},
			},
		},
	);

	constructor() {
		this.cart.restore();
		// Load Firebase now, so the sign-in popup opens right on the click.
		this.auth.preload();
	}

	private async _placeOrder(): Promise<void> {
		this.submitError.set('');

		const lines = this.cart.lines();

		if (!lines.length) return;

		// The submit button shows only when signed in; this is a guard for a sign-out meanwhile.
		if (!this.auth.user()) return;

		const value = this.checkout();
		const request: CheckoutRequest = {
			phone: value.phone.trim(),
			type: value.type,
			address: value.type === 'delivery' ? value.address.trim() : '',
			comment: value.comment.trim(),
		};
		let timer: ReturnType<typeof setTimeout> | undefined;

		try {
			const order = await Promise.race([
				this._ordersService.create({
					items: lines.map((line) => ({
						slug: line.slug,
						name: line.name,
						price: line.price,
						qty: line.qty,
					})),
					total: this.cart.total(),
					currency: this.cart.currency.code,
					...request,
				}),
				new Promise<never>((_, reject) => {
					timer = setTimeout(() => reject({ code: 'unavailable' }), ORDER_TIMEOUT_MS);
				}),
			]).finally(() => clearTimeout(timer));

			this.cart.clear();
			this._contactService.savePhone(request.phone);
			this.placedOrder.set(order);
			this._notifyVenue(order);
		} catch (error) {
			console.error('[order]', error);
			this.submitError.set(firebaseErrorText(error));
		}
	}

	/** Tells the venue through Telegram; the order is already saved, so a failure here is only logged. */
	private _notifyVenue(order: Order): void {
		const message = [
			'New order',
			`Order: ${order.id}`,
			`Type: ${order.type}`,
			`Phone: ${order.phone}`,
			order.address ? `Address: ${order.address}` : '',
			order.createdByName ? `Name: ${order.createdByName}` : '',
			order.createdByEmail ? `Email: ${order.createdByEmail}` : '',
			...order.items.map((item) => `${item.qty} x ${item.name} (${item.price} ${order.currency})`),
			`Total: ${order.total} ${order.currency}`,
			order.comment ? `Comment: ${order.comment}` : '',
		]
			.filter(Boolean)
			.join('\n');

		firstValueFrom(this._contactService.contact(message)).catch((error) =>
			console.error('[order] telegram', error),
		);
	}
}
