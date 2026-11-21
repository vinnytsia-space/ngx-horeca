import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { SignInButtonComponent } from '../../components/sign-in-button/sign-in-button.component';
import { companyProfile } from '../../feature/company/company.data';
import { FirebaseAuthService } from '../../feature/firebase/firebase-auth.service';
import { firebaseErrorText } from '../../feature/firebase/firebase-errors';
import { ORDER_STATUS_LABELS, Order, OrdersService } from '../../feature/firebase/orders.service';

/** The signed-in guest's orders, live. Client-rendered (see app.routes.server.ts). */
@Component({
	imports: [RouterLink, SignInButtonComponent, TranslateDirective],
	templateUrl: './orders.component.html',
})
export class OrdersComponent {
	private readonly _ordersService = inject(OrdersService);

	protected readonly auth = inject(FirebaseAuthService);
	protected readonly list = this._ordersService.createList();
	protected readonly statusLabels = ORDER_STATUS_LABELS;
	protected readonly currencyIcon = companyProfile.currency.icon;
	protected readonly cancelling = signal<string | null>(null);
	protected readonly actionError = signal('');
	private readonly _uid = computed(() => this.auth.user()?.uid ?? null);

	constructor() {
		this.auth.watch().catch((error) => console.error('[firebase]', error));

		effect(() => {
			const uid = this._uid();

			if (uid) void this._ordersService.listenMine(this.list, uid);
			else {
				this.list.stop();
				this.list.items.set([]);
			}
		});

		inject(DestroyRef).onDestroy(() => this.list.stop());
	}

	protected async cancel(order: Order): Promise<void> {
		this.cancelling.set(order.id);
		this.actionError.set('');

		try {
			await this._ordersService.setStatus(order.id, 'cancelled');
		} catch (error) {
			console.error('[orders]', error);
			this.actionError.set(firebaseErrorText(error));
		} finally {
			this.cancelling.set(null);
		}
	}

	protected formatDate(value: string): string {
		const date = new Date(value);

		return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
	}
}
