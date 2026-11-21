import { Service, inject } from '@angular/core';
import type { DocumentData } from 'firebase/firestore';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseLiveList } from './firebase-live-list';
import { CURRENT_SITE } from './site';

/** Keep in step with `isValidNewRequest()` in firestore.rules. */
export const REQUEST_TYPES = ['booking', 'room', 'contact'] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

/** Source-language labels of the request types (translated where shown). */
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
	booking: 'Бронювання',
	room: 'Номер',
	contact: 'Повідомлення',
};

/** The form fields a request keeps; a form leaves the ones it does not have empty. */
export interface RequestFields {
	kind: string;
	phone: string;
	name: string;
	date: string;
	time: string;
	guests: string;
	room: string;
	comment: string;
}

/** One document of `requests`. The fields match `requestKeys()` in firestore.rules. */
export interface FormRequest extends RequestFields {
	id: string;
	type: RequestType;
	handled: boolean;

	/** Firebase uid when the visitor was signed in, '' otherwise. */
	createdBy: string;
	createdAt: string;

	/** The host of the site the form was sent from (see `CURRENT_SITE`). */
	site: string;
}

/** Field length limits; the same as in firestore.rules. */
const LIMITS: Record<keyof RequestFields, number> = {
	kind: 50,
	phone: 100,
	name: 200,
	date: 20,
	time: 20,
	guests: 50,
	room: 200,
	comment: 3000,
};

export const REQUESTS_LIMIT = 100;

/** Form requests (booking, room, contact) saved next to the Telegram message. Browser-only. */
@Service()
export class RequestsService {
	private readonly _auth = inject(FirebaseAuthService);

	/** Saves a request; anyone may create one (anonymous visitors too). */
	async create(type: RequestType, fields: Partial<RequestFields>): Promise<void> {
		const { db, collection, addDoc } = await this._auth.firestore();
		const clean = (key: keyof RequestFields) =>
			String(fields[key] ?? '')
				.trim()
				.slice(0, LIMITS[key]);
		const data: Omit<FormRequest, 'id'> = {
			type,
			kind: clean('kind'),
			phone: clean('phone'),
			name: clean('name'),
			date: clean('date'),
			time: clean('time'),
			guests: clean('guests'),
			room: clean('room'),
			comment: clean('comment'),
			handled: false,
			createdBy: this._auth.user()?.uid ?? '',
			createdAt: new Date().toISOString(),
			site: CURRENT_SITE,
		};

		await addDoc(collection(db, 'requests'), data);
	}

	createList(): FirebaseLiveList<FormRequest> {
		return new FirebaseLiveList(this._auth, (id, data) => _fromDoc(id, data));
	}

	/** This site's requests, newest first (admins only). */
	listenAll(list: FirebaseLiveList<FormRequest>): Promise<void> {
		return list.start(({ db, collection, query, where, orderBy, limit }) =>
			query(
				collection(db, 'requests'),
				where('site', '==', CURRENT_SITE),
				orderBy('createdAt', 'desc'),
				limit(REQUESTS_LIMIT),
			),
		);
	}

	async setHandled(id: string, handled: boolean): Promise<void> {
		const { db, doc, updateDoc } = await this._auth.firestore();

		await updateDoc(doc(db, 'requests', id), { handled });
	}
}

function _fromDoc(id: string, data: DocumentData): FormRequest {
	const text = (key: string) => String(data[key] ?? '');

	return {
		id,
		type: (REQUEST_TYPES as readonly string[]).includes(data['type'])
			? (data['type'] as RequestType)
			: 'contact',
		kind: text('kind'),
		phone: text('phone'),
		name: text('name'),
		date: text('date'),
		time: text('time'),
		guests: text('guests'),
		room: text('room'),
		comment: text('comment'),
		handled: data['handled'] === true,
		createdBy: text('createdBy'),
		createdAt: text('createdAt'),
		site: text('site'),
	};
}
