import { CanMatchFn, Routes } from '@angular/router';
import {
	articleSlugs,
	discountSlugs,
	dishSlugs,
	eventSlugs,
	jobSlugs,
	productSlugs,
	profileSlugs,
	questSlugs,
	reviewSlugs,
	roomSlugs,
} from './feature/content/content.data';
import { companyProfile } from './feature/company/company.data';
import { adminGuard } from './feature/firebase/admin.guard';
import { buildRouteMeta } from './services/seo.utils';

/**
 * Detail routes match only slugs that exist in the bundled data, so an unknown slug falls through to
 * the not-found route instead of showing another item.
 */
function _knownSlug(slugs: readonly string[]): CanMatchFn {
	return (_route, segments) => slugs.includes(segments[1]?.path ?? '');
}

const notFoundRoute = {
	data: {
		meta: {
			title: 'Сторінку не знайдено',
			robots: 'noindex, nofollow',
		},
	},
	loadComponent: () =>
		import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
};

export const routes: Routes = [
	{
		path: '',
		data: {
			// The home page shows the company title as written ("Horeca | ..."), without the suffix.
			meta: {
				...buildRouteMeta('/'),
				title: companyProfile.defaultSeo.title,
				titleSuffix: '',
			},
		},
		loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
	},
	{
		path: 'menu',
		data: {
			meta: buildRouteMeta('/menu'),
		},
		loadComponent: () => import('./pages/menu/menu.component').then((m) => m.MenuComponent),
	},
	{
		path: 'about',
		data: {
			meta: buildRouteMeta('/about'),
		},
		loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
	},
	{
		path: 'spa',
		data: {
			meta: buildRouteMeta('/spa'),
		},
		loadComponent: () => import('./pages/spa/spa.component').then((m) => m.SpaComponent),
	},
	{
		path: 'book',
		data: {
			meta: buildRouteMeta('/book'),
		},
		loadComponent: () => import('./pages/book/book.component').then((m) => m.BookComponent),
	},
	{
		path: 'favorites',
		data: {
			meta: buildRouteMeta('/favorites'),
		},
		loadComponent: () => import('./pages/menu/menu.component').then((m) => m.MenuComponent),
	},
	{
		path: 'seasonal',
		data: {
			meta: buildRouteMeta('/seasonal'),
		},
		loadComponent: () => import('./pages/menu/menu.component').then((m) => m.MenuComponent),
	},
	{
		path: 'daily',
		data: {
			meta: buildRouteMeta('/daily'),
		},
		loadComponent: () => import('./pages/menu/menu.component').then((m) => m.MenuComponent),
	},
	{
		path: 'rooms',
		data: {
			meta: buildRouteMeta('/rooms'),
		},
		loadComponent: () => import('./pages/rooms/rooms.component').then((m) => m.RoomsComponent),
	},
	{
		path: 'navigation',
		data: {
			meta: buildRouteMeta('/navigation'),
		},
		loadComponent: () =>
			import('./pages/navigation/navigation.component').then((m) => m.NavigationComponent),
	},
	{
		path: 'gallery',
		data: {
			meta: buildRouteMeta('/gallery'),
		},
		loadComponent: () =>
			import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent),
	},
	{
		path: 'dish/:slug',
		canMatch: [_knownSlug(dishSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () => import('./pages/dish/dish.component').then((m) => m.DishComponent),
	},
	{
		path: 'room/:slug',
		canMatch: [_knownSlug(roomSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () => import('./pages/room/room.component').then((m) => m.RoomComponent),
	},
	{
		path: 'discounts',
		data: {
			meta: buildRouteMeta('/discounts'),
		},
		loadComponent: () =>
			import('./pages/discounts/discounts.component').then((m) => m.DiscountsComponent),
	},
	{
		path: 'discount/:slug',
		canMatch: [_knownSlug(discountSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () =>
			import('./pages/discount/discount.component').then((m) => m.DiscountComponent),
	},
	{
		path: 'loyalty',
		data: {
			meta: buildRouteMeta('/loyalty'),
		},
		loadComponent: () =>
			import('./pages/loyalty/loyalty.component').then((m) => m.LoyaltyComponent),
	},
	{
		path: 'takeaway',
		data: {
			meta: buildRouteMeta('/takeaway'),
		},
		loadComponent: () =>
			import('./pages/takeaway/takeaway.component').then((m) => m.TakeawayComponent),
	},
	{
		path: 'catering',
		data: {
			meta: buildRouteMeta('/catering'),
		},
		loadComponent: () =>
			import('./pages/catering/catering.component').then((m) => m.CateringComponent),
	},
	{
		path: 'articles',
		data: {
			meta: buildRouteMeta('/articles'),
		},
		loadComponent: () =>
			import('./pages/articles/articles.component').then((m) => m.ArticlesComponent),
	},
	{
		path: 'article/:slug',
		canMatch: [_knownSlug(articleSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () =>
			import('./pages/article/article.component').then((m) => m.ArticleComponent),
	},
	{
		path: 'quests',
		data: {
			meta: buildRouteMeta('/quests'),
		},
		loadComponent: () =>
			import('./pages/quests/quests.component').then((m) => m.QuestsComponent),
	},
	{
		path: 'questions',
		data: {
			meta: buildRouteMeta('/questions'),
		},
		loadComponent: () =>
			import('./pages/questions/questions.component').then((m) => m.QuestionsComponent),
	},
	{
		path: 'rules',
		data: {
			meta: buildRouteMeta('/rules'),
		},
		loadComponent: () => import('./pages/rules/rules.component').then((m) => m.RulesComponent),
	},
	{
		path: 'quest/:slug',
		canMatch: [_knownSlug(questSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () => import('./pages/quest/quest.component').then((m) => m.QuestComponent),
	},
	{
		path: 'reviews',
		data: {
			meta: buildRouteMeta('/reviews'),
		},
		loadComponent: () =>
			import('./pages/reviews/reviews.component').then((m) => m.ReviewsComponent),
	},
	{
		path: 'review/:slug',
		canMatch: [_knownSlug(reviewSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () =>
			import('./pages/review/review.component').then((m) => m.ReviewComponent),
	},
	{
		path: 'events',
		data: {
			meta: buildRouteMeta('/events'),
		},
		loadComponent: () =>
			import('./pages/events/events.component').then((m) => m.EventsComponent),
	},
	{
		path: 'event/:slug',
		canMatch: [_knownSlug(eventSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () => import('./pages/event/event.component').then((m) => m.EventComponent),
	},
	{
		path: 'products',
		data: {
			meta: buildRouteMeta('/products'),
		},
		loadComponent: () =>
			import('./pages/products/products.component').then((m) => m.ProductsComponent),
	},
	{
		path: 'product/:slug',
		canMatch: [_knownSlug(productSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () =>
			import('./pages/product/product.component').then((m) => m.ProductComponent),
	},
	{
		path: 'jobs',
		data: {
			meta: buildRouteMeta('/jobs'),
		},
		loadComponent: () => import('./pages/jobs/jobs.component').then((m) => m.JobsComponent),
	},
	{
		path: 'job/:slug',
		canMatch: [_knownSlug(jobSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () => import('./pages/job/job.component').then((m) => m.JobComponent),
	},
	{
		path: 'team',
		data: {
			meta: buildRouteMeta('/team'),
		},
		loadComponent: () => import('./pages/team/team.component').then((m) => m.TeamComponent),
	},
	{
		path: 'profile/:slug',
		canMatch: [_knownSlug(profileSlugs)],
		// The page writes its own title and meta; the router-driven reset must not overwrite them
		// (for example when a language switch re-navigates to the same URL).
		data: { meta: { disableUpdate: true } },
		loadComponent: () =>
			import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
	},
	{
		path: 'socials',
		data: {
			meta: buildRouteMeta('/socials'),
		},
		loadComponent: () =>
			import('./pages/socials/socials.component').then((m) => m.SocialsComponent),
	},
	// Firebase pages (cart, orders, admin): client-rendered (app.routes.server.ts), never prerendered,
	// and noindex, so they are not in the sitemap either.
	{
		path: 'cart',
		data: { meta: { title: 'Кошик', robots: 'noindex, nofollow' } },
		loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
	},
	{
		path: 'orders',
		data: { meta: { title: 'Мої замовлення', robots: 'noindex, nofollow' } },
		loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
	},
	{
		path: 'admin',
		data: { meta: { title: 'Адмін-панель', robots: 'noindex, nofollow' } },
		canActivate: [adminGuard],
		loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
	},
	// Prerendered to 404/index.html; the deploy workflow publishes it as 404.html for GitHub Pages.
	{ path: '404', ...notFoundRoute },
	// Unknown URLs reached inside the app (for example a broken link) show the same page.
	{ path: '**', ...notFoundRoute },
];
