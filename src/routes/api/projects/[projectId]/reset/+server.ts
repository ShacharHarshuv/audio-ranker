import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST = async ({ params }) => {
	const project = await db.project.findUnique({
		where: { id: params.projectId },
		select: { id: true }
	});

	if (!project) {
		return json({ error: 'Project not found.' }, { status: 404 });
	}

	await db.rankingVote.deleteMany({
		where: { projectId: project.id }
	});

	return json({ ok: true });
};
