import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const issues = [];

const walk = (folder, extensions, skip = () => false) => {
	const files = [];

	for (const entry of readdirSync(folder, { withFileTypes: true })) {
		const file = path.join(folder, entry.name);

		if (skip(file, entry)) {
			continue;
		}

		if (entry.isDirectory()) {
			files.push(...walk(file, extensions, skip));
		} else if (entry.isFile() && extensions.includes(path.extname(file))) {
			files.push(file);
		}
	}

	return files;
};

const hasLatin = (text) => /[A-Za-z]/.test(text);
const hasCyrillic = (text) => /[А-Яа-яІіЇїЄєҐґ]/.test(text);
const ignoredJsonTrail = (trail) =>
	/(^|\.|])(slug|categorySlug|parent|suggested|src|icon|url|image|images|imageAlt|href|email|phone|website|mapUrl|applyUrl|_id|name|lang|locale|code|author|robots|type|twitterCard|servesCuisine|addressCountry)$/.test(
		trail,
	) ||
	trail.includes('.suggested') ||
	trail.includes('.images') ||
	trail.includes('.keywords') ||
	// schema.org values (JSON-LD) are technical, not visible text.
	trail.includes('structuredData.custom') ||
	trail.endsWith('.links[0].href') ||
	trail.endsWith('.links[1].href');

for (const file of walk('src/app', ['.html', '.ts'])) {
	const content = readFileSync(file, 'utf8');
	const lines = content.split(/\r?\n/);

	lines.forEach((line, index) => {
		if (
			(/\[translate\]="'.*[A-Za-z].*'"/.test(line) ||
				/translate>[^<]*[A-Za-z]/.test(line) ||
				/translate\('.*[A-Za-z].*'\)/.test(line)) &&
			!hasCyrillic(line) &&
			!line.includes('http')
		) {
			issues.push(`${file}:${index + 1}: ${line.trim()}`);
		}
	});
}

for (const file of walk('src/data', ['.json'], (file) => file.includes(`${path.sep}i18n${path.sep}`))) {
	const data = JSON.parse(readFileSync(file, 'utf8'));

	const visit = (value, trail) => {
		if (typeof value === 'string') {
			if (
				hasLatin(value) &&
				!hasCyrillic(value) &&
				!ignoredJsonTrail(trail) &&
				value !== 'Wi-Fi' &&
				!/^(https?:|mailto:|tel:|\/|[a-z0-9-]+\.(webp|png|jpg|jpeg|svg))/.test(value)
			) {
				issues.push(`${file}:${trail}: ${value}`);
			}

			return;
		}

		if (Array.isArray(value)) {
			value.forEach((item, index) => visit(item, `${trail}[${index}]`));
			return;
		}

		if (value && typeof value === 'object') {
			for (const [key, item] of Object.entries(value)) {
				visit(item, trail ? `${trail}.${key}` : key);
			}
		}
	};

	visit(data, '');
}

// UTF-8 text saved through a single-byte encoding ("Ð¡Ð½Ñ–..." instead of "Сні..."). The broken
// strings are not translation keys, so they show up as garbage in every language.
const mojibake = /[\u00d0\u00d1][\u0080-\u00bf\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac\u2122]|\u00e2\u20ac|\u00c3[\u0080-\u00bf]/;

for (const file of [
	...walk('src/app', ['.html', '.ts']),
	...walk('src/i18n', ['.json']),
	...walk('src/data', ['.json']),
	...walk('projects', ['.ts', '.html', '.md']),
]) {
	readFileSync(file, 'utf8')
		.split(/\r?\n/)
		.forEach((line, index) => {
			if (mojibake.test(line)) {
				issues.push(`${file}:${index + 1}: broken encoding: ${line.trim().slice(0, 80)}`);
			}
		});
}

if (issues.length) {
	console.error(`Found ${issues.length} possible non-Ukrainian source strings:`);
	for (const issue of issues.slice(0, 120)) {
		console.error(issue);
	}
	process.exit(1);
}

console.log('No obvious Latin source strings found in translate bindings or data JSON.');