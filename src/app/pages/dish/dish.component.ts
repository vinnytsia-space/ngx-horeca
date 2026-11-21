import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MetaService } from '@wawjs/ngx-core';
import { LanguageService, TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { CartButtonComponent } from '../../components/cart-button/cart-button.component';
import { ImageComponent } from '../../components/image/image.component';
import { findDishDetailBySlug, rawDishDetails } from '../../feature/content/content.data';
import { companyProfile } from '../../feature/company/company.data';
import type { Dish, DishCategory } from '@wawjs/ngx-horeca';
import { DishService } from '@wawjs/ngx-horeca';
import { CanonicalService } from '../../services/canonical.service';
import { buildPageImage } from '../../services/seo.utils';

interface DishFact {
	label: string;
	value?: string;
	/** Translation key shown after `value`, such as a unit. */
	unit?: string;
	translatedValue?: string;
	/** Translated one by one and joined, for lists such as allergens. */
	translatedValues?: string[];
	fallbackValue?: string;
}

interface DishSuggestion {
	slug: string;
	name: string;
	description: string;
	hasDescription: boolean;
	image: string;
	price: number | null;
}

interface DishViewModel {
	id: string;
	slug: string;
	name: string;
	description: string;
	fullDescription: string;
	categoryName: string;
	hasDescription: boolean;
	hasFullDescription: boolean;
	labels: string[];
	image: string;
	price: number | null;
	facts: DishFact[];
	suggestions: DishSuggestion[];
}

const _fallbackEntry = _resolveFallbackEntry();

@Component({
	imports: [CartButtonComponent, RouterLink, TranslateDirective, ImageComponent],
	templateUrl: './dish.component.html',
	styleUrl: './dish.component.scss',
})
export class DishComponent {
	private readonly _canonicalService = inject(CanonicalService);
	private readonly _languageService = inject(LanguageService);
	private readonly _metaService = inject(MetaService);
	private readonly _route = inject(ActivatedRoute);
	private readonly _dishService = inject(DishService);
	private readonly _title = inject(Title);
	private readonly _translateService = inject(TranslateService);
	private readonly _slug = toSignal(this._route.paramMap, {
		initialValue: this._route.snapshot.paramMap,
	});

	protected readonly dish = computed(() => {
		const slug = this._slug().get('slug');
		const entry = slug ? (findDishDetailBySlug(slug) ?? _fallbackEntry) : _fallbackEntry;

		return _buildDishViewModel(entry.category, entry.dish);
	});
	protected readonly isFavorite = computed(() =>
		this._dishService.favoriteDishes().includes(this.dish().slug),
	);
	protected readonly currency = companyProfile.currency;

	constructor() {
		effect(() => {
			this._dishService.loadTranslations();
		});

		effect(() => {
			this._languageService.language();
			const dish = this.dish();
			const translatedTitle = this._translateService.translate(dish.name)();
			const description = _buildDishMetaDescription(dish, (key) =>
				this._translateService.translate(key)(),
			);

			this._title.setTitle(`${translatedTitle} | ${companyProfile.name}`);

			this._metaService.applyMeta({
				title: translatedTitle,
				description,
				image: buildPageImage(`/dish/${dish.slug}`, dish.image),
			});
			this._canonicalService.setCanonicalUrl(`/dish/${dish.slug}`);
		});
	}

	protected toggleFavorite() {
		this._dishService.toggleDishFavorite(this.dish().slug);
	}
}

function _buildDishViewModel(category: DishCategory | null, item: Dish): DishViewModel {
	return {
		id: item.slug,
		slug: item.slug,
		name: item.name,
		description: item.description,
		fullDescription: item.fullDescription,
		categoryName: category?.name ?? item.categorySlug,
		hasDescription: Boolean(item.description?.trim()),
		hasFullDescription: Boolean(item.fullDescription?.trim()),
		labels: item.labels,
		image: item.image,
		price: item.price,
		facts: _buildFacts(item, category),
		suggestions: _buildSuggestions(item),
	};
}

function _buildFacts(item: Dish, category: DishCategory | null): DishFact[] {
	return [
		{
			label: 'Розділ меню',
			translatedValue: category?.name,
			fallbackValue: item.categorySlug,
		},
		{
			label: 'Порція',
			translatedValue: item.portion || undefined,
			fallbackValue: item.portion ? undefined : 'Уточніть порцію у персоналу ресторану',
		},
		{
			label: 'Час приготування',
			value: item.cookTimeMinutes == null ? undefined : String(item.cookTimeMinutes),
			unit: 'хв',
			fallbackValue: item.cookTimeMinutes == null ? 'Уточніть у персоналу ресторану' : undefined,
		},
		{
			label: 'Калорійність',
			value: item.caloriesKcal == null ? undefined : String(item.caloriesKcal),
			unit: 'ккал',
			fallbackValue: item.caloriesKcal == null ? 'Уточніть у персоналу ресторану' : undefined,
		},
		{
			label: 'Алергени',
			translatedValues: item.allergens?.length ? item.allergens : undefined,
			fallbackValue: item.allergens?.length ? undefined : 'Немає інформації про алергени',
		},
	];
}

function _buildSuggestions(currentItem: Dish): DishSuggestion[] {
	const suggestedItems = currentItem.suggested
		.map((slug) => findDishDetailBySlug(slug)?.dish)
		.filter((item): item is Dish => Boolean(item));

	return (
		suggestedItems.length
			? suggestedItems
			: rawDishDetails
					.map((entry) => entry.dish)
					.filter(
						(item) =>
							item.slug !== currentItem.slug && item.categorySlug === currentItem.categorySlug,
					)
	)
		.slice(0, 3)
		.map((item) => ({
			slug: item.slug,
			name: item.name,
			description: item.description,
			hasDescription: Boolean(item.description?.trim()),
			image: item.image,
			price: item.price,
		}));
}

function _resolveFallbackEntry() {
	for (const entry of rawDishDetails) {
		return entry;
	}

	throw new Error('No dishes available in menu data.');
}

function _buildDishMetaDescription(
	dish: DishViewModel,
	translate: (key: string) => string,
): string {
	const text = dish.fullDescription || dish.description;

	return text
		? translate(text)
		: `${translate(dish.name)}. ${translate('Розділ меню')}: ${translate(dish.categoryName)}.`;
}
