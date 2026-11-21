export interface AppLanguage {
	code: string;
	name: string;
	nativeName: string;
	flagSrc: string;
	htmlLang: string;
	population: number;
}

/** Firebase web app config (public: it identifies the project, the Firestore rules protect the data). */
export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId: string;
}

/**
 * A site admin: a verified Google email, optionally pinned to a Firebase uid. This only decides what the
 * app shows; keep it in step with `isAdmin()` in firestore.rules, which is the real protection.
 */
export interface AppAdmin {
	email: string;
	uid?: string;
}

export const environment: {
	apiUrl: string;
	companyId: string;
	appVersion: string;
	production: boolean;
	defaultLanguage: string;
	languages: AppLanguage[];
	firebase: FirebaseConfig;
	admins: AppAdmin[];
} = {
	apiUrl: 'https://it.webart.work',
	companyId: 'demo',
	appVersion: '1.0.0',
	production: true,
	defaultLanguage: 'ua',
	firebase: {
		apiKey: 'AIzaSyAr5dA2qQ_MtCZAPxMm1l01SdEVmoS2_3I',
		authDomain: 'ngx-horeca.firebaseapp.com',
		projectId: 'ngx-horeca',
		storageBucket: 'ngx-horeca.firebasestorage.app',
		messagingSenderId: '558270152272',
		appId: '1:558270152272:web:1807296cbb6d98c820db55',
		measurementId: 'G-9YMPN84270',
	},
	admins: [{ email: 'ceo@webart.work' }],
	languages: [
		{
			code: 'ua',
			name: 'Ukrainian',
			nativeName: 'Українська',
			flagSrc: 'flags/ukraine.svg',
			htmlLang: 'uk',
			population: 35,
		},
		{
			code: 'en',
			name: 'English',
			nativeName: 'English',
			flagSrc: 'flags/united-kingdom.svg',
			htmlLang: 'en',
			population: 280,
		},
		{
			code: 'de',
			name: 'German',
			nativeName: 'Deutsch',
			flagSrc: 'flags/germany.svg',
			htmlLang: 'de',
			population: 130,
		},
		{
			code: 'fr',
			name: 'French',
			nativeName: 'Français',
			flagSrc: 'flags/france.svg',
			htmlLang: 'fr',
			population: 110,
		},
		{
			code: 'pl',
			name: 'Polish',
			nativeName: 'Polski',
			flagSrc: 'flags/poland.svg',
			htmlLang: 'pl',
			population: 45,
		},
		{
			code: 'ro',
			name: 'Romanian',
			nativeName: 'Română',
			flagSrc: 'flags/romania.svg',
			htmlLang: 'ro',
			population: 28,
		},
		{
			code: 'hu',
			name: 'Hungarian',
			nativeName: 'Magyar',
			flagSrc: 'flags/hungary.svg',
			htmlLang: 'hu',
			population: 13,
		},
		{
			code: 'el',
			name: 'Greek',
			nativeName: 'Ελληνικά',
			flagSrc: 'flags/greece.svg',
			htmlLang: 'el',
			population: 13,
		},
		{
			code: 'cs',
			name: 'Czech',
			nativeName: 'Čeština',
			flagSrc: 'flags/czechia.svg',
			htmlLang: 'cs',
			population: 12,
		},
		{
			code: 'it',
			name: 'Italian',
			nativeName: 'Italiano',
			flagSrc: 'flags/italy.svg',
			htmlLang: 'it',
			population: 70,
		},
		{
			code: 'es',
			name: 'Spanish',
			nativeName: 'Español',
			flagSrc: 'flags/spain.svg',
			htmlLang: 'es',
			population: 75,
		},
		{
			code: 'nl',
			name: 'Dutch',
			nativeName: 'Nederlands',
			flagSrc: 'flags/netherlands.svg',
			htmlLang: 'nl',
			population: 25,
		},
		{
			code: 'pt',
			name: 'Portuguese',
			nativeName: 'Português',
			flagSrc: 'flags/portugal.svg',
			htmlLang: 'pt',
			population: 15,
		},
		{
			code: 'sv',
			name: 'Swedish',
			nativeName: 'Svenska',
			flagSrc: 'flags/sweden.svg',
			htmlLang: 'sv',
			population: 12,
		},
	],
};
