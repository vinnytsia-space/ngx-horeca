import { isPlatformBrowser } from '@angular/common';
import { inject, Service, PLATFORM_ID, WritableSignal } from '@angular/core';
import { HttpService } from '@wawjs/ngx-http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestFields, RequestType, RequestsService } from '../firebase/requests.service';

const CONTACT_PHONE_STORAGE_KEY = 'horeca.contact.phone';

/** How long a form waits for the Firestore copy before it reports the Telegram result alone. */
const SAVE_TIMEOUT_MS = 10000;

/** The request fields a form shares with `RequestFields`; `message` is saved as the comment. */
const REQUEST_FIELD_KEYS = ['kind', 'phone', 'name', 'date', 'time', 'guests', 'room', 'comment'] as const;

export interface ContactSubmission<Request extends { phone: string }> {
	request: Request;
	submittedRequest: WritableSignal<Request | null>;
	submitMessage: WritableSignal<string>;
	submitError: WritableSignal<string>;
	normalize: (request: Request) => Request;
	message: (request: Request) => string;
	successMessage: string;
	errorMessage: string;
	/** What the Firestore copy in `requests` is filed as. Defaults to `'contact'`. */
	requestType?: RequestType;
	/** The fields saved to `requests`. Defaults to the matching string fields of the request. */
	requestFields?: (request: Request) => Partial<RequestFields>;
}

@Service()
export class ContactService {
	private readonly _httpService = inject(HttpService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private readonly _requestsService = inject(RequestsService);

	contact(message: string): Observable<unknown> {
		return this._httpService.post('/api/telegram/contact', {
			slug: environment.companyId,
			message,
		});
	}

	/**
	 * Sends the request to the venue's Telegram and, at the same time, saves a copy to Firestore
	 * (`requests`). Either one arriving counts as sent: a failed copy never blocks the Telegram
	 * message, and a saved copy still reaches the admin page when Telegram fails. The phone is
	 * remembered only after a successful send.
	 */
	async submit<Request extends { phone: string }>(submission: ContactSubmission<Request>): Promise<void> {
		if (submission.submittedRequest()) return;

		const request = submission.normalize(submission.request);
		submission.submitMessage.set('');
		submission.submitError.set('');

		const [telegram, saved] = await Promise.allSettled([
			firstValueFrom(this.contact(submission.message(request))),
			this._saveRequest(submission, request),
		]);

		if (telegram.status === 'rejected') console.error('[contact] telegram', telegram.reason);
		if (saved.status === 'rejected') console.error('[contact] firestore', saved.reason);

		if (telegram.status === 'fulfilled' || saved.status === 'fulfilled') {
			this.savePhone(request.phone);
			submission.submittedRequest.set(request);
			submission.submitMessage.set(submission.successMessage);
		} else {
			submission.submitError.set(submission.errorMessage);
		}
	}

	private _saveRequest<Request extends { phone: string }>(
		submission: ContactSubmission<Request>,
		request: Request,
	): Promise<void> {
		if (!this._isBrowser) return Promise.reject(new Error('firebase-browser-only'));

		const fields = submission.requestFields?.(request) ?? _defaultRequestFields(request);
		let timer: ReturnType<typeof setTimeout> | undefined;

		// Firestore waits for the connection when offline; do not hold the form for that.
		return Promise.race([
			this._requestsService.create(submission.requestType ?? 'contact', fields),
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('firestore-timeout')), SAVE_TIMEOUT_MS);
			}),
		]).finally(() => clearTimeout(timer));
	}

	getSavedPhone(): string {
		if (!this._isBrowser) {
			return '';
		}

		// Storage can throw when site data is blocked; the form then just starts empty.
		try {
			return localStorage.getItem(CONTACT_PHONE_STORAGE_KEY) ?? '';
		} catch {
			return '';
		}
	}

	savePhone(phone: string): void {
		if (!this._isBrowser) {
			return;
		}

		const normalized = phone.trim();

		if (normalized) {
			try {
				localStorage.setItem(CONTACT_PHONE_STORAGE_KEY, normalized);
			} catch {
				// Not remembering the phone must never block sending the form.
			}
		}
	}
}

function _defaultRequestFields(request: object): Partial<RequestFields> {
	const source = request as Record<string, unknown>;
	const fields: Partial<RequestFields> = {};

	for (const key of REQUEST_FIELD_KEYS) {
		if (typeof source[key] === 'string') fields[key] = source[key];
	}

	if (!fields.comment && typeof source['message'] === 'string') fields.comment = source['message'];

	return fields;
}
