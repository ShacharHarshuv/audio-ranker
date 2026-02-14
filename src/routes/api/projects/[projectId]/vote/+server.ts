import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST = async ({ params, request, cookies, url }) => {
	const body = await request.json().catch(() => null);
	const winnerAudioFileId = String(body?.winnerAudioFileId ?? '');
	const loserAudioFileId = String(body?.loserAudioFileId ?? '');

	if (!winnerAudioFileId || !loserAudioFileId || winnerAudioFileId === loserAudioFileId) {
		return json({ error: 'Invalid vote payload.' }, { status: 400 });
	}

	const project = await db.project.findUnique({
		where: { id: params.projectId },
		select: { id: true }
	});

	if (!project) {
		return json({ error: 'Project not found.' }, { status: 404 });
	}

	const files = await db.audioFile.findMany({
		where: {
			projectId: project.id,
			id: { in: [winnerAudioFileId, loserAudioFileId] }
		},
		select: { id: true },
		take: 2
	});

	if (files.length !== 2) {
		return json({ error: 'Vote files do not belong to this project.' }, { status: 400 });
	}

	const existingSession = cookies.get('audioRankerSessionId');
	const voterSessionId = existingSession || crypto.randomUUID();

	if (!existingSession) {
		cookies.set('audioRankerSessionId', voterSessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	await db.rankingVote.create({
		data: {
			projectId: project.id,
			winnerAudioFileId,
			loserAudioFileId,
			voterSessionId
		}
	});

	return json({ ok: true });
};

export const DELETE = async ({ params, cookies }) => {
	const voterSessionId = cookies.get('audioRankerSessionId');
	if (!voterSessionId) {
		return json({ error: 'No session found.' }, { status: 400 });
	}

	const lastVote = await db.rankingVote.findFirst({
		where: { projectId: params.projectId, voterSessionId },
		orderBy: { createdAt: 'desc' }
	});

	if (!lastVote) {
		return json({ error: 'No vote to undo.' }, { status: 404 });
	}

	await db.rankingVote.delete({ where: { id: lastVote.id } });

	return json({ ok: true });
};
