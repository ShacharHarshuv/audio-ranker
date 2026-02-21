<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { AudioItem } from '../../routes/[projectId]/+page.server';

	type Props = {
		projectId: string;
		audioFileId: string;
		item: AudioItem;
	};

	let { projectId, audioFileId, item }: Props = $props();

	let localNote = $state('');
	let isNoteSaved = $state(true);
	let noteSaveTimeout: ReturnType<typeof setTimeout> | undefined = $state();

	$effect(() => {
		localNote = item.note ?? '';
	});

	const saveNote = async () => {
		const response = await fetch(`/api/projects/${projectId}/comment`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ audioFileId, note: localNote })
		});

		return response.ok;
	};

	const onInput = (event: Event) => {
		const target = event.currentTarget as HTMLTextAreaElement;
		localNote = target.value;
		item.note = target.value;
		isNoteSaved = true;

		if (noteSaveTimeout) {
			clearTimeout(noteSaveTimeout);
		}

		noteSaveTimeout = setTimeout(async () => {
			isNoteSaved = await saveNote();
		}, 500);
	};

	onDestroy(() => {
		if (noteSaveTimeout) {
			clearTimeout(noteSaveTimeout);
		}
	});
</script>

<div class="mt-2">
	<textarea
		class="w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs text-zinc-700 outline-none transition focus:border-zinc-400"
		rows="2"
		placeholder="Add a note..."
		value={localNote}
		oninput={onInput}
	></textarea>
	{#if !isNoteSaved}
		<p class="mt-1 text-[11px] text-red-600">Could not save note.</p>
	{/if}
</div>
