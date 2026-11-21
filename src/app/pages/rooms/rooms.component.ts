import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoomService } from '@wawjs/ngx-horeca';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { RoomBookingFormComponent } from '../../components/room-booking-form/room-booking-form.component';
import { companyPhoneHref, companyProfile } from '../../feature/company/company.data';

type ContactLink = {
	label: string;
	href: string;
	description: string;
};

@Component({
	imports: [NgOptimizedImage, RoomBookingFormComponent, RouterLink, TranslateDirective],
	templateUrl: './rooms.component.html',
	styleUrl: './rooms.component.scss',
})
export class RoomsComponent {
	private readonly _roomService = inject(RoomService);

	protected readonly amenities = [
		'Комфортні номери',
		'Сніданок для гостей',
		'Ресторан або кафе на території',
		'Обслуговування номерів',
		'Wi-Fi у номерах',
		'Паркінг',
		'Робоча зона',
		'Кондиціонер',
		'Трансфер на запит',
		'Підтримка бронювання',
	];
	protected readonly loadingCards = [1, 2, 3];
	protected readonly rooms = this._roomService.rooms;
	protected readonly isLoading = this._roomService.isLoading;
	protected readonly hasRooms = computed(() => this.rooms().length > 0);
	protected readonly company = companyProfile;

	protected readonly contactLinks: ContactLink[] = (
		[
			{
				label: 'Зателефонуйте нам',
				href: companyPhoneHref,
				description: companyProfile.phone,
			},
			{
				label: 'Написати у Viber',
				href: companyProfile.socials.viber.url,
				description: 'Швидкий чат для бронювання',
			},
			{
				label: 'Написати у Telegram',
				href: companyProfile.socials.telegram.url,
				description: companyProfile.socials.telegram.label,
			},
		] satisfies ContactLink[]
	).filter((link) => !!link.href);

	constructor() {
		effect(() => {
			this._roomService.loadTranslations();
		});
	}
}
