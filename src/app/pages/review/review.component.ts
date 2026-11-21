import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ReviewService } from '@wawjs/ngx-horeca';
import { fallbackReviews, findFallbackReviewBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './review.component.html',
	styleUrl: './review.component.scss',
})
export class ReviewComponent {
	private readonly _reviewService = inject(ReviewService);

	protected readonly stars = [1, 2, 3, 4, 5];
	protected readonly review = injectDetailItem(
		this._reviewService.reviews,
		findFallbackReviewBySlug,
		fallbackReviews,
	);

	constructor() {
		effect(() => {
			this._reviewService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.review();

			return {
				path: `/review/${item.slug}`,
				title: item.title || item.author,
				description: item.body,
			};
		});
	}
}
