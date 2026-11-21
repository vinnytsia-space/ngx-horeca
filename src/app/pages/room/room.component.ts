import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { RoomService } from '@wawjs/ngx-horeca';
import { fallbackRooms, findFallbackRoomBySlug } from '../../feature/content/content.data';
import { companyPhoneHref } from '../../feature/company/company.data';
import { RoomBookingFormComponent } from '../../components/room-booking-form/room-booking-form.component';
import { injectDetailItem, useDetailPageMeta } from '../../services/detail-page';

@Component({
	imports: [NgOptimizedImage, RoomBookingFormComponent, RouterLink, TranslateDirective],
	templateUrl: './room.component.html',
	styleUrl: './room.component.scss',
})
export class RoomComponent {
	protected readonly companyPhoneHref = companyPhoneHref;
	private readonly _roomService = inject(RoomService);

	protected readonly room = injectDetailItem(
		this._roomService.rooms,
		findFallbackRoomBySlug,
		fallbackRooms,
	);
	protected readonly facts = computed(() =>
		[
			{ label: 'Площа номера', value: this.room().size },
			{ label: 'Розміщення', value: this.room().occupancy },
			{ label: 'Ліжко', value: this.room().bed },
			{ label: 'Ванна кімната', value: this.room().bathroom },
		].filter((fact) => fact.value),
	);
	protected readonly roomBookingOptions = computed(() => [this.room()]);

	constructor() {
		effect(() => {
			this._roomService.loadTranslations();
		});

		useDetailPageMeta(() => {
			const room = this.room();

			return {
				path: `/room/${room.slug}`,
				title: room.name,
				description: room.description,
				image: room.image,
			};
		});
	}
}
