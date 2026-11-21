import { NgOptimizedImage } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ProfileService } from '@wawjs/ngx-horeca';
import { fallbackProfiles, findFallbackProfileBySlug } from '../../feature/content/content.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';

@Component({
	imports: [NgOptimizedImage, RouterLink, TranslateDirective],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss',
})
export class ProfileComponent {
	private readonly _profileService = inject(ProfileService);

	protected readonly profile = injectDetailItem(
		this._profileService.profiles,
		findFallbackProfileBySlug,
		fallbackProfiles,
	);

	constructor() {
		effect(() => {
			this._profileService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const item = this.profile();

			return {
				path: `/profile/${item.slug}`,
				title: item.name,
				description: item.description,
				image: item.image,
			};
		});
	}
}
