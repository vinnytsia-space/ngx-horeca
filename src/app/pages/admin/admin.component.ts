import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { companyProfile } from '../../feature/company/company.data';
import { firebaseErrorText } from '../../feature/firebase/firebase-errors';
import {
	ORDER_STATUSES,
	ORDER_STATUS_LABELS,
	Order,
	OrderStatus,
	OrdersService,
} from '../../feature/firebase/orders.service';
import {
	FormRequest,
	REQUEST_TYPE_LABELS,
	RequestsService,
} from '../../feature/firebase/requests.service';

type AdminTab = 'orders' | 'requests';

/** Source-language labels of the `kind` values the booking forms send (book page and SPA page). */
const REQUEST_KIND_LABELS: Record<string, string> = {
	столик: 'Столик',
	номер: 'Номер',
	SPA: 'SPA',
};

/**
 * Orders and form requests, live, newest first. Admins only (adminGuard); the Firestore rules are the
 * real protection. Client-rendered (see app.routes.server.ts).
 */
@Component({
	imports: [TranslateDirective],
	templateUrl: './admin.component.html',
})
export class AdminComponent {
	private readonly _ordersService = inject(OrdersService);
	private readonly _requestsService = inject(RequestsService);

	protected readonly tab = signal<AdminTab>('orders');
	protected readonly orders = this._ordersService.createList();
	protected readonly requests = this._requestsService.createList();
	protected readonly statuses = ORDER_STATUSES;
	protected readonly statusLabels = ORDER_STATUS_LABELS;
	protected readonly requestTypeLabels = REQUEST_TYPE_LABELS;
	protected readonly currencyIcon = companyProfile.currency.icon;
	protected readonly saving = signal<string | null>(null);
	protected readonly actionError = signal('');

	constructor() {
		void this._ordersService.listenAll(this.orders);
		void this._requestsService.listenAll(this.requests);

		inject(DestroyRef).onDestroy(() => {
			this.orders.stop();
			this.requests.stop();
		});
	}

	protected async setStatus(order: Order, status: string): Promise<void> {
		if (status === order.status) return;

		await this._run(order.id, () => this._ordersService.setStatus(order.id, status as OrderStatus));
	}

	protected async toggleHandled(request: FormRequest): Promise<void> {
		await this._run(request.id, () => this._requestsService.setHandled(request.id, !request.handled));
	}

	protected kindLabel(kind: string): string {
		return REQUEST_KIND_LABELS[kind] ?? kind;
	}

	/** A form date (`YYYY-MM-DD`) in the admin's locale; other values are shown as they are. */
	protected formatDay(value: string): string {
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

		return match
			? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString()
			: value;
	}

	protected formatDate(value: string): string {
		const date = new Date(value);

		return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
	}

	private async _run(id: string, action: () => Promise<void>): Promise<void> {
		this.saving.set(id);
		this.actionError.set('');

		try {
			await action();
		} catch (error) {
			console.error('[admin]', error);
			this.actionError.set(firebaseErrorText(error));
		} finally {
			this.saving.set(null);
		}
	}
}
