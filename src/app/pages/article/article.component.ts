import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ArticleService } from '@wawjs/ngx-horeca';
import { fallbackArticles, findFallbackArticleBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './article.component.html',
	styleUrl: './article.component.scss',
})
export class ArticleComponent {
	private readonly _articleService = inject(ArticleService);

	protected readonly article = injectDetailItem(
		this._articleService.articles,
		findFallbackArticleBySlug,
		fallbackArticles,
	);

	constructor() {
		effect(() => {
			this._articleService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.article();

			return {
				path: `/article/${item.slug}`,
				title: item.title,
				description: item.summary,
			};
		});
	}
}
