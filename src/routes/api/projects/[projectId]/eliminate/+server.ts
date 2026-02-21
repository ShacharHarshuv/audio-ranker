import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST = async ({ params, request }) => {
	const body = await request.json().catch(() => null);
	const audioFileId = String(body?.audioFileId ?? '');
	const eliminated = Boolean(body?.eliminated);

	if (!audioFileId) {
		return json({ error: 'Audio file id is required.' }, { status: 400 });
	}

	const audioFile = await db.audioFile.findUnique({
		where: { id: audioFileId },
		select: { id: true, projectId: true }
	});

	if (!audioFile || audioFile.projectId !== params.projectId) {
		return json({ error: 'Audio file not found in this project.' }, { status: 404 });
	}

	await db.audioFile.update({
		where: { id: audioFileId },
		data: { eliminated }
	});

	return json({ ok: true });
};
