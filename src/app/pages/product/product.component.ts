import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ProductService } from '@wawjs/ngx-horeca';
import { fallbackProducts, findFallbackProductBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';
import { withTrailingSlash } from '../../services/trailing-slash';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './product.component.html',
	styleUrl: './product.component.scss',
})
export class ProductComponent {
	/** Internal CTA links use the trailing-slash form of canonical URLs. */
	protected readonly linkHref = withTrailingSlash;

	private readonly _productService = inject(ProductService);

	protected readonly product = injectDetailItem(
		this._productService.products,
		findFallbackProductBySlug,
		fallbackProducts,
	);

	constructor() {
		effect(() => {
			this._productService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.product();

			return {
				path: `/product/${item.slug}`,
				title: item.title,
				description: item.summary,
			};
		});
	}
}
