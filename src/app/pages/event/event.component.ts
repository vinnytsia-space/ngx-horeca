import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { EventService } from '@wawjs/ngx-horeca';
import { fallbackEvents, findFallbackEventBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';
import { withTrailingSlash } from '../../services/trailing-slash';

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './event.component.html',
	styleUrl: './event.component.scss',
})
export class EventComponent {
	/** Internal CTA links use the trailing-slash form of canonical URLs. */
	protected readonly linkHref = withTrailingSlash;

	private readonly _eventService = inject(EventService);

	protected readonly event = injectDetailItem(
		this._eventService.events,
		findFallbackEventBySlug,
		fallbackEvents,
	);

	constructor() {
		effect(() => {
			this._eventService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.event();

			return {
				path: `/event/${item.slug}`,
				title: item.title,
				description: item.summary,
			};
		});
	}
}
