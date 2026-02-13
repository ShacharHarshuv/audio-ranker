import { put } from '@vercel/blob';

const sanitize = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

const fileNameWithFallback = (filename: string) => sanitize(filename) || 'audio-file';

export const uploadAudioFile = async (projectId: string, file: File) => {
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		throw new Error('Missing required env var: BLOB_READ_WRITE_TOKEN');
	}

	const filename = fileNameWithFallback(file.name);
	const path = `projects/${projectId}/${filename}`;
	const blob = await put(path, file, {
		access: 'public',
		addRandomSuffix: true,
		token: process.env.BLOB_READ_WRITE_TOKEN,
		contentType: file.type || 'application/octet-stream'
	});

	return {
		filename,
		url: blob.url
	};
};
