import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FirebaseAuthService } from './firebase-auth.service';

/**
 * Lets only the admins listed in `environment.admins` open a route; everyone else goes home. The saved
 * Firebase sign-in restores asynchronously after a reload, so it waits for `watch()` first. The real
 * protection is the admin list in firestore.rules.
 */
export const adminGuard: CanActivateFn = async () => {
	const router = inject(Router);

	if (!isPlatformBrowser(inject(PLATFORM_ID))) return router.parseUrl('/');

	const firebaseAuth = inject(FirebaseAuthService);

	await firebaseAuth.watch().catch(() => undefined);

	return firebaseAuth.isAdmin() ? true : router.parseUrl('/');
};
