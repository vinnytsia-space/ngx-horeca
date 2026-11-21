import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { DiscountService } from '@wawjs/ngx-horeca';
import { fallbackDiscounts, findFallbackDiscountBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';
import { withTrailingSlash } from '../../services/trailing-slash';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './discount.component.html',
	styleUrl: './discount.component.scss',
})
export class DiscountComponent {
	/** Internal CTA links use the trailing-slash form of canonical URLs. */
	protected readonly linkHref = withTrailingSlash;

	private readonly _discountService = inject(DiscountService);

	protected readonly discount = injectDetailItem(
		this._discountService.discounts,
		findFallbackDiscountBySlug,
		fallbackDiscounts,
	);

	constructor() {
		effect(() => {
			this._discountService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.discount();

			return {
				path: `/discount/${item.slug}`,
				title: item.title,
				description: item.summary,
			};
		});
	}
}
