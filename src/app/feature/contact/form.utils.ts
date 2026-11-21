import {
	requiredError,
	validate,
	type PathKind,
	type SchemaPath,
	type SchemaPathRules,
} from '@angular/forms/signals';

/**
 * `required()` accepts a value made only of spaces; this also rejects it. Use it next to `required()`,
 * which keeps the field marked as required for the browser and assistive technology.
 */
export function requiredText<TPathKind extends PathKind = PathKind.Root>(
	path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
	message: string,
): void {
	validate(path, ({ value }) => (value() && !value().trim() ? requiredError({ message }) : null));
}

/** Today in the visitor's time zone as `YYYY-MM-DD`, the format of `<input type="date">`. */
export function localToday(): string {
	const now = new Date();
	const pad = (value: number) => String(value).padStart(2, '0');

	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
