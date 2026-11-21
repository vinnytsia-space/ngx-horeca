import articlesData from '../../../data/article/articles.json';
import discountsData from '../../../data/discount/discounts.json';
import dishCategoriesData from '../../../data/dish/dishCategories.json';
import dishesData from '../../../data/dish/dishes.json';
import eventsData from '../../../data/event/events.json';
import exhibitsData from '../../../data/exhibit/exhibits.json';
import jobsData from '../../../data/job/jobs.json';
import productsData from '../../../data/product/products.json';
import profilesData from '../../../data/profile/profiles.json';
import questionsData from '../../../data/question/question.json';
import questsData from '../../../data/quest/quests.json';
import reviewsData from '../../../data/review/reviews.json';
import roomsData from '../../../data/room/rooms.json';
import rulesData from '../../../data/rule/rules.json';
import { companyProfile } from '../company/company.data';
import { Article } from '@wawjs/ngx-horeca';
import { Discount } from '@wawjs/ngx-horeca';
import { Dish, DishCategory } from '@wawjs/ngx-horeca';
import { EventItem } from '@wawjs/ngx-horeca';
import { Exhibit } from '@wawjs/ngx-horeca';
import { Job } from '@wawjs/ngx-horeca';
import { Product } from '@wawjs/ngx-horeca';
import { Profile } from '@wawjs/ngx-horeca';
import { Question } from '@wawjs/ngx-horeca';
import { Quest } from '@wawjs/ngx-horeca';
import { Review } from '@wawjs/ngx-horeca';
import { Room } from '@wawjs/ngx-horeca';
import { Rule } from '@wawjs/ngx-horeca';
import { buildSlug } from '@wawjs/ngx-horeca';

interface DishDetail {
	dish: Dish;
	category: DishCategory | null;
}

type RawItem = Record<string, unknown>;

/** First value that is not null or undefined, like the services' `a ?? b ?? c`. */
function _pick(item: RawItem, keys: string[]): unknown {
	for (const key of keys) {
		if (item[key] !== null && item[key] !== undefined) {
			return item[key];
		}
	}

	return undefined;
}

/** Trimmed text of the first present value, as the services read titles and names. */
function _text(item: RawItem, keys: string[]): string {
	const value = _pick(item, keys);

	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}

	return typeof value === 'string' ? value.trim() : '';
}

/**
 * Gives every item the slug its `@wawjs/ngx-horeca` service will give it (`slug`, then `id`, then
 * the title or name, through `buildSlug`). Route matching, prerender params and the links the
 * services build then use the same value, even for a Cyrillic or uppercase slug in the data.
 */
function _withSlugs<T>(items: T[], prefix: string, fallbackSource: (item: RawItem) => unknown): T[] {
	return items.map((item, index) => {
		const rawItem = item as unknown as RawItem;
		const source = _pick(rawItem, ['slug', 'id']) ?? fallbackSource(rawItem);

		return { ...item, slug: buildSlug(source, prefix, index) };
	});
}

export const fallbackArticles = _withSlugs(articlesData as Article[], 'article', (item) =>
	_text(item, ['title', 'name', 'headline']),
);
export const fallbackDiscounts = _withSlugs(discountsData as Discount[], 'discount', (item) =>
	_text(item, ['title', 'name', 'headline']),
);
export const fallbackDishCategories = dishCategoriesData as DishCategory[];
export const fallbackDishes = (dishesData as Dish[]).map((dish) => ({
	...dish,
	image: dish.image || `/dish/${dish.slug}.webp`,
}));
export const fallbackEvents = _withSlugs(eventsData as EventItem[], 'event', (item) =>
	_text(item, ['title', 'name', 'eventTitle']),
);
export const fallbackExhibits = _withSlugs(exhibitsData as Exhibit[], 'exhibit', (item) =>
	_text(item, ['src', 'image', 'url']),
);
export const fallbackJobs = _withSlugs(
	(jobsData as Job[]).map((job) => ({
		...job,
		contactEmail: job.contactEmail || companyProfile.email,
		contactPhone: job.contactPhone || companyProfile.phone,
	})),
	'job',
	(item) => _text(item, ['title', 'name', 'position']),
);
export const fallbackProducts = _withSlugs(productsData as Product[], 'product', (item) =>
	_text(item, ['title', 'name', 'productTitle', 'label']),
);
export const fallbackProfiles = _withSlugs(profilesData as Profile[], 'profile', (item) =>
	_text(item, ['name', 'title']),
);
export const fallbackQuestions = questionsData as Question[];
export const fallbackQuests = _withSlugs(questsData as Quest[], 'quest', (item) =>
	_text(item, ['title', 'name', 'questTitle', 'label']),
);
export const fallbackReviews = _withSlugs(reviewsData as Review[], 'review', (item) => {
	const author = _text(item, ['author', 'name', 'customer', 'client']);
	const title = _text(item, ['title', 'headline', 'subject']);
	const body = _text(item, ['body', 'text', 'review', 'content', 'message', 'description']);

	return `${author}-${title || body}`;
});
export const fallbackRooms = _withSlugs(roomsData as Room[], 'room', (item) =>
	_text(item, ['name', 'title']),
);
export const fallbackRules = rulesData as Rule[];

export const articleSlugs = fallbackArticles.map((article) => article.slug);
export const discountSlugs = fallbackDiscounts.map((discount) => discount.slug);
export const dishSlugs = fallbackDishes.map((dish) => dish.slug);
export const eventSlugs = fallbackEvents.map((event) => event.slug);
export const jobSlugs = fallbackJobs.map((job) => job.slug);
export const productSlugs = fallbackProducts.map((product) => product.slug);
export const profileSlugs = fallbackProfiles.map((profile) => profile.slug);
export const questSlugs = fallbackQuests.map((quest) => quest.slug);
export const reviewSlugs = fallbackReviews.map((review) => review.slug);
export const roomSlugs = fallbackRooms.map((room) => room.slug);

const _articlesBySlug = new Map(fallbackArticles.map((article) => [article.slug, article]));
const _discountsBySlug = new Map(fallbackDiscounts.map((discount) => [discount.slug, discount]));
const _eventsBySlug = new Map(fallbackEvents.map((event) => [event.slug, event]));
const _jobsBySlug = new Map(fallbackJobs.map((job) => [job.slug, job]));
const _productsBySlug = new Map(fallbackProducts.map((product) => [product.slug, product]));
const _profilesBySlug = new Map(fallbackProfiles.map((profile) => [profile.slug, profile]));
const _questsBySlug = new Map(fallbackQuests.map((quest) => [quest.slug, quest]));
const _reviewsBySlug = new Map(fallbackReviews.map((review) => [review.slug, review]));
const _roomsBySlug = new Map(fallbackRooms.map((room) => [room.slug, room]));
const _categoriesBySlug = new Map(
	fallbackDishCategories.map((category) => [category.slug, category] as const),
);
const _dishDetailsBySlug = new Map(
	fallbackDishes.map((dish) => [
		dish.slug,
		{
			dish,
			category: _categoriesBySlug.get(dish.categorySlug) ?? null,
		} satisfies DishDetail,
	] as const),
);

export const rawDishDetails = [..._dishDetailsBySlug.values()];

export function findFallbackArticleBySlug(slug: string) {
	return _articlesBySlug.get(slug) ?? null;
}

export function findFallbackDiscountBySlug(slug: string) {
	return _discountsBySlug.get(slug) ?? null;
}

export function findDishDetailBySlug(slug: string) {
	return _dishDetailsBySlug.get(slug) ?? null;
}

export function findFallbackEventBySlug(slug: string) {
	return _eventsBySlug.get(slug) ?? null;
}

export function findFallbackJobBySlug(slug: string) {
	return _jobsBySlug.get(slug) ?? null;
}

export function findFallbackProductBySlug(slug: string) {
	return _productsBySlug.get(slug) ?? null;
}

export function findFallbackProfileBySlug(slug: string) {
	return _profilesBySlug.get(slug) ?? null;
}

export function findFallbackQuestBySlug(slug: string) {
	return _questsBySlug.get(slug) ?? null;
}

export function findFallbackReviewBySlug(slug: string) {
	return _reviewsBySlug.get(slug) ?? null;
}

export function findFallbackRoomBySlug(slug: string) {
	return _roomsBySlug.get(slug) ?? null;
}
