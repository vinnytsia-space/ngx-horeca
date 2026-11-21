/** Source-language (Ukrainian) texts for Firebase failures; they are translated where shown. */
export const FIREBASE_ERROR_TEXTS = {
	'permission-denied': 'Немає доступу',
	unavailable: 'Немає з’єднання, спробуйте ще раз',
	other: 'Щось пішло не так, спробуйте ще раз',
} as const;

export type FirebaseErrorKind = keyof typeof FIREBASE_ERROR_TEXTS;

const UNAVAILABLE = ['unavailable', 'deadline-exceeded', 'auth/network-request-failed'];

/** Sorts an error from Firestore or Firebase Auth into what the person needs to know. */
export function firebaseErrorKind(error: unknown): FirebaseErrorKind {
	const code = (error as { code?: unknown } | null)?.code;

	if (code === 'permission-denied') return 'permission-denied';
	if (typeof code === 'string' && UNAVAILABLE.includes(code)) return 'unavailable';
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'unavailable';

	return 'other';
}

/** The translatable text for a Firebase error. */
export function firebaseErrorText(error: unknown): string {
	return FIREBASE_ERROR_TEXTS[firebaseErrorKind(error)];
}
