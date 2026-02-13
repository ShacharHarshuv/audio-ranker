import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { uploadAudioFile } from '$lib/server/uploads';

const fallbackAlias = (index: number) => `Clip ${index + 1}`;

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('projectName') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Project name is required.' });
		}

		const files = formData
			.getAll('files')
			.filter((entry): entry is File => entry instanceof File && entry.size > 0);

		if (files.length < 2) {
			return fail(400, { error: 'Upload at least two audio files.' });
		}

		const aliases = formData
			.getAll('aliases')
			.map((entry) => String(entry ?? '').trim());

		const project = await db.project.create({
			data: { name }
		});

		const audioFiles = [];

		for (const [index, file] of files.entries()) {
			const alias = aliases[index] || fallbackAlias(index);
			const uploaded = await uploadAudioFile(project.id, file);

			audioFiles.push({
				projectId: project.id,
				alias,
				filename: uploaded.filename,
				url: uploaded.url
			});
		}

		await db.audioFile.createMany({ data: audioFiles });

		redirect(303, `/${project.id}`);
	}
};
