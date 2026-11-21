import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { QuestService } from '@wawjs/ngx-horeca';
import { fallbackQuests, findFallbackQuestBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';
import { withTrailingSlash } from '../../services/trailing-slash';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './quest.component.html',
	styleUrl: './quest.component.scss',
})
export class QuestComponent {
	/** Internal CTA links use the trailing-slash form of canonical URLs. */
	protected readonly linkHref = withTrailingSlash;

	private readonly _questService = inject(QuestService);

	protected readonly quest = injectDetailItem(
		this._questService.quests,
		findFallbackQuestBySlug,
		fallbackQuests,
	);

	constructor() {
		effect(() => {
			this._questService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.quest();

			return {
				path: `/quest/${item.slug}`,
				title: item.title,
				description: item.summary,
			};
		});
	}
}
