import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load = async ({ params }) => {
	const project = await db.project.findUnique({
		where: { id: params.projectId },
		include: {
			audioFiles: {
				orderBy: { createdAt: 'asc' }
			},
			votes: {
				orderBy: { createdAt: 'asc' },
				select: {
					winnerAudioFileId: true,
					loserAudioFileId: true
				}
			}
		}
	});

	if (!project) {
		error(404, 'Project not found');
	}

	return {
		project: {
			id: project.id,
			name: project.name
		},
		audioItems: project.audioFiles.map((file) => ({
			id: file.id,
			alias: file.alias,
			note: file.note,
			src: file.url,
			filename: file.filename
		})),
		votes: project.votes
	};
};

export type AudioItem = Awaited<ReturnType<typeof load>>['audioItems'][number];
