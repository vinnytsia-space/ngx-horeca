import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { JobService } from '@wawjs/ngx-horeca';
import { fallbackJobs, findFallbackJobBySlug } from '../../feature/content/content.data';
import { phoneHref } from '../../feature/company/company.data';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';
import { withTrailingSlash } from '../../services/trailing-slash';

interface JobInfoField {
	label: string;
	value: string;
}

@Component({
	imports: [RouterLink, TranslateDirective],
	templateUrl: './job.component.html',
	styleUrl: './job.component.scss',
})
export class JobComponent {
	/** Internal CTA links use the trailing-slash form of canonical URLs. */
	protected readonly linkHref = withTrailingSlash;

	private readonly _jobService = inject(JobService);

	protected readonly job = injectDetailItem(
		this._jobService.jobs,
		findFallbackJobBySlug,
		fallbackJobs,
	);
	protected readonly contactPhoneHref = computed(() => phoneHref(this.job().contactPhone));
	protected readonly infoFields = computed<JobInfoField[]>(() => {
		const job = this.job();

		return [
			{ label: 'Відділ', value: job.department },
			{ label: 'Рівень', value: job.level },
			{ label: 'Формат роботи', value: job.workFormat },
			{ label: 'Локація', value: job.location },
			{ label: 'Тип зайнятості', value: job.employmentType },
			{ label: 'Графік', value: job.schedule },
			{ label: 'Зарплата', value: job.salary },
			{ label: 'Досвід', value: job.experience },
		].filter((field) => field.value.length > 0);
	});

	constructor() {
		effect(() => {
			this._jobService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const job = this.job();

			return { path: `/job/${job.slug}`, title: job.title, description: job.summary };
		});
	}
}
