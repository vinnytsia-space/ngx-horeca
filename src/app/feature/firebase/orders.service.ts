import { Service, inject } from '@angular/core';
import type { DocumentData } from 'firebase/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseLiveList } from './firebase-live-list';
import { CURRENT_SITE } from './site';

/** The statuses an admin can set; keep in step with `orderStatuses()` in firestore.rules. */
export const ORDER_STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'done', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Source-language labels of the statuses (translated where shown). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	new: 'Нове',
	confirmed: 'Підтверджено',
	preparing: 'Готується',
	ready: 'Готове',
	done: 'Виконано',
	cancelled: 'Скасовано',
};

export type OrderType = 'pickup' | 'delivery';

export interface OrderItem {
	slug: string;
	name: string;
	price: number;
	qty: number;
}

/** What the cart page sends; the owner, status and time are added here. */
export interface OrderInput {
	items: OrderItem[];
	total: number;
	currency: string;
	phone: string;
	type: OrderType;
	address: string;
	comment: string;
}

/** One document of `orders`. The fields match `orderKeys()` in firestore.rules. */
export interface Order extends OrderInput {
	id: string;
	status: OrderStatus;
	createdBy: string;
	createdByEmail: string;
	createdByName: string;
	createdAt: string;

	/** The host of the site the order was placed on (see `CURRENT_SITE`). */
	site: string;
}

/** How many orders a list reads. */
export const ORDERS_LIMIT = 100;

/** Orders placed from the cart page. Browser-only; used by client-rendered pages. */
@Service()
export class OrdersService {
	private readonly _auth = inject(FirebaseAuthService);

	/** A live list of orders; the page starts it with `listenMine()` or `listenAll()` and stops it. */
	createList(): FirebaseLiveList<Order> {
		return new FirebaseLiveList(this._auth, (id, data) => _fromDoc(id, data));
	}

	/** The signed-in person's orders, newest first. */
	listenMine(list: FirebaseLiveList<Order>, uid: string): Promise<void> {
		return list.start(({ db, collection, query, where, orderBy, limit }) =>
			query(
				collection(db, 'orders'),
				where('createdBy', '==', uid),
				where('site', '==', CURRENT_SITE),
				orderBy('createdAt', 'desc'),
				limit(ORDERS_LIMIT),
			),
		);
	}

	/** This site's orders, newest first (admins only; the rules refuse anyone else). */
	listenAll(list: FirebaseLiveList<Order>): Promise<void> {
		return list.start(({ db, collection, query, where, orderBy, limit }) =>
			query(
				collection(db, 'orders'),
				where('site', '==', CURRENT_SITE),
				orderBy('createdAt', 'desc'),
				limit(ORDERS_LIMIT),
			),
		);
	}

	/** Saves a new order as the signed-in person. Throws `not-signed-in` without a Firebase user. */
	async create(input: OrderInput): Promise<Order> {
		const user = this._auth.user();

		if (!user) throw new Error('not-signed-in');

		const { db, collection, addDoc } = await this._auth.firestore();
		const data: Omit<Order, 'id'> = {
			...input,
			status: 'new',
			createdBy: user.uid,
			createdByEmail: user.email ?? '',
			createdByName: (user.name ?? '').slice(0, 200),
			createdAt: new Date().toISOString(),
			site: CURRENT_SITE,
		};
		const ref = await addDoc(collection(db, 'orders'), data);

		return { id: ref.id, ...data };
	}

	/** Admin: any status. Owner: only `cancelled` while the order is `new` (the rules check both). */
	async setStatus(id: string, status: OrderStatus): Promise<void> {
		const { db, doc, updateDoc } = await this._auth.firestore();

		await updateDoc(doc(db, 'orders', id), { status });
	}
}

function _fromDoc(id: string, data: DocumentData): Order {
	const status = (ORDER_STATUSES as readonly string[]).includes(data['status'])
		? (data['status'] as OrderStatus)
		: 'new';

	return {
		id,
		items: Array.isArray(data['items']) ? (data['items'] as OrderItem[]) : [],
		total: typeof data['total'] === 'number' ? data['total'] : 0,
		currency: String(data['currency'] ?? ''),
		phone: String(data['phone'] ?? ''),
		type: data['type'] === 'delivery' ? 'delivery' : 'pickup',
		address: String(data['address'] ?? ''),
		comment: String(data['comment'] ?? ''),
		status,
		createdBy: String(data['createdBy'] ?? ''),
		createdByEmail: String(data['createdByEmail'] ?? ''),
		createdByName: String(data['createdByName'] ?? ''),
		createdAt: String(data['createdAt'] ?? ''),
		site: String(data['site'] ?? ''),
	};
}
