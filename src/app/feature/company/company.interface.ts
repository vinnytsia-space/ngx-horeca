export interface Company {
	_id: string;
	name: string;
	custom?: Record<string, unknown>;
}

export interface CompanyCurrency {
	code: string;
	icon: string;
}

export interface SeoMetadata {
	title: string;
	description: string;
	keywords: string[];
	author: string;
	robots: string;
	image: string;
	type: string;
	twitterCard: string;
}

export interface SeoPageOverride extends Partial<SeoMetadata> {
	canonicalPath?: string;
}

/** Schema.org data for the JSON-LD block in the page head (`CompanySeoService`). */
export interface CompanyStructuredData {
	/** Schema.org type in English, for example `Restaurant`, `Cafe`, `Hotel` or `BarOrPub`. */
	type: string;
	priceRange: string;
	servesCuisine: string;
	addressLocality: string;
	addressCountry: string;
	sameAs: string[];
	/** Extra schema.org properties merged into the JSON-LD object, such as `geo` or `openingHours`. */
	custom?: Record<string, unknown>;
}

export const COMPANY_SOCIAL_KEYS = [
	'map',
	'telegram',
	'viber',
	'whatsapp',
	'instagram',
	'facebook',
	'tiktok',
	'youtube',
	'threads',
	'x',
	'linkedin',
	'pinterest',
	'googleBusiness',
	'tripadvisor',
	'boltFood',
	'glovo',
] as const;

export type CompanySocialKey = (typeof COMPANY_SOCIAL_KEYS)[number];

/** A social, messenger, map or delivery link. An empty `url` hides the link on the site. */
export interface CompanySocialLink {
	url: string;
	/** Short display text derived from the URL, for example `instagram.com/horeca`. */
	label: string;
}

export type CompanySocials = Record<CompanySocialKey, CompanySocialLink>;

export interface CompanyProfile extends Company {
	lang: string;
	locale: string;
	siteUrl: string;
	logo: string;
	phone: string;
	email: string;
	address: string;
	currency: CompanyCurrency;
	socials: CompanySocials;
	defaultSeo: SeoMetadata;
	pageSeo: Record<string, SeoPageOverride>;
	structuredData: CompanyStructuredData;
	custom?: Record<string, unknown>;
}
