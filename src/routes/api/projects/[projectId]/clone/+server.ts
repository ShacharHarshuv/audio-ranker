import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const name = String(body?.name ?? '').trim();

	if (!name) {
		return json({ error: 'Project name is required.' }, { status: 400 });
	}

	const source = await db.project.findUnique({
		where: { id: params.projectId },
		include: {
			audioFiles: {
				orderBy: { createdAt: 'asc' },
				select: { alias: true, note: true, eliminated: true, filename: true, url: true }
			}
		}
	});

	if (!source) {
		return json({ error: 'Project not found.' }, { status: 404 });
	}

	const clone = await db.project.create({
		data: { name }
	});

	await db.audioFile.createMany({
		data: source.audioFiles.map((file) => ({
			projectId: clone.id,
			alias: file.alias,
			note: file.note,
			eliminated: file.eliminated,
			filename: file.filename,
			url: file.url
		}))
	});

	return json({ id: clone.id });
};
