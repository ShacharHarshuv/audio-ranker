import { readdir } from 'node:fs/promises';
import { extname, join, parse } from 'node:path';

const supportedAudioExtensions = new Set([
	'.mp3',
	'.wav',
	'.m4a',
	'.ogg',
	'.flac'
]);

const friendlyAliases = [
	'Atlas',
	'Ember',
	'River',
	'Stone',
	'Orbit',
	'Flame',
	'Echo',
	'Sky',
	'Path',
	'Seed'
];

const aliasFor = (index: number) => friendlyAliases[index] ?? `Clip ${index + 1}`;

export const load = async () => {
	const audioFolder = join(process.cwd(), 'static', 'audio');

	try {
		const entries = await readdir(audioFolder, { withFileTypes: true });
		const audioItems = entries
			.filter((entry) => entry.isFile())
			.map((entry) => entry.name)
			.filter((filename) =>
				supportedAudioExtensions.has(extname(filename).toLowerCase())
			)
			.sort((left, right) => left.localeCompare(right))
			.map((filename, index) => ({
				id: parse(filename).name,
				alias: aliasFor(index),
				src: `/audio/${filename}`,
				filename
			}));

		return { audioItems };
	} catch {
		return { audioItems: [] };
	}
};
