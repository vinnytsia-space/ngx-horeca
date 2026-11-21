import { companyProfile } from '../company/company.data';

/**
 * The site's own host (for example `horeca.webart.work`), from `siteUrl` in company.json. Every
 * order and request is saved with it, and the admin page lists only this site's documents, because
 * org sites built from this template can share one Firebase project.
 */
export const CURRENT_SITE = _host(companyProfile.siteUrl);

function _host(url: string): string {
	try {
		return new URL(url).host.toLowerCase();
	} catch {
		return '';
	}
}
