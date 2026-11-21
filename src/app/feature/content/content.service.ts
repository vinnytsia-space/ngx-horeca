import { inject, Service } from '@angular/core';
import {
	ArticleService,
	DiscountService,
	DishCategoryService,
	DishService,
	EventService,
	ExhibitService,
	JobService,
	ProductService,
	ProfileService,
	QuestionService,
	QuestService,
	ReviewService,
	RoomService,
	RuleService,
} from '@wawjs/ngx-horeca';
import {
	fallbackArticles,
	fallbackDiscounts,
	fallbackDishCategories,
	fallbackDishes,
	fallbackEvents,
	fallbackExhibits,
	fallbackJobs,
	fallbackProducts,
	fallbackProfiles,
	fallbackQuestions,
	fallbackQuests,
	fallbackReviews,
	fallbackRooms,
	fallbackRules,
} from './content.data';

/**
 * Fills the HoReCa feature services with the content bundled in `src/data/`.
 * The site is prerendered from this data; nothing is fetched from an API at runtime.
 */
@Service()
export class ContentService {
	private readonly _articleService = inject(ArticleService);
	private readonly _discountService = inject(DiscountService);
	private readonly _dishCategoryService = inject(DishCategoryService);
	private readonly _dishService = inject(DishService);
	private readonly _eventService = inject(EventService);
	private readonly _exhibitService = inject(ExhibitService);
	private readonly _jobService = inject(JobService);
	private readonly _productService = inject(ProductService);
	private readonly _profileService = inject(ProfileService);
	private readonly _questionService = inject(QuestionService);
	private readonly _questService = inject(QuestService);
	private readonly _reviewService = inject(ReviewService);
	private readonly _roomService = inject(RoomService);
	private readonly _ruleService = inject(RuleService);

	initialize() {
		this._articleService.setFallbackArticles(fallbackArticles);
		this._discountService.setFallbackDiscounts(fallbackDiscounts);
		this._dishCategoryService.setFallbackCategories(fallbackDishCategories);
		this._dishService.setFallbackDishes(fallbackDishes);
		this._eventService.setFallbackEvents(fallbackEvents);
		this._exhibitService.setFallbackExhibits(fallbackExhibits);
		this._jobService.setFallbackJobs(fallbackJobs);
		this._productService.setFallbackProducts(fallbackProducts);
		this._profileService.setFallbackProfiles(fallbackProfiles);
		this._questionService.setFallbackQuestions(fallbackQuestions);
		this._questService.setFallbackQuests(fallbackQuests);
		this._reviewService.setFallbackReviews(fallbackReviews);
		this._roomService.setFallbackRooms(fallbackRooms);
		this._ruleService.setFallbackRules(fallbackRules);

		this._articleService.finishLoading();
		this._discountService.finishLoading();
		this._eventService.finishLoading();
		this._exhibitService.finishLoading();
		this._jobService.finishLoading();
		this._productService.finishLoading();
		this._questionService.finishLoading();
		this._questService.finishLoading();
		this._reviewService.finishLoading();
		this._roomService.finishLoading();
		this._ruleService.finishLoading();
	}
}
