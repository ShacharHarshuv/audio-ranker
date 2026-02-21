<script lang="ts">
	import {
		applyResult,
		createRatings,
		leaderboardConfidence,
		pickNextPair
	} from '$lib/ranker';
	import CandidateTrack from '$lib/components/CandidateTrack.svelte';
	import type { PageProps } from './$types';
	import { Rating } from 'ts-trueskill';

	let { data }: PageProps = $props();
	const currentData = () => data;

	const shuffledItems = [...currentData().audioItems]
		.map((item) => ({ ...item, sortSeed: Math.random() }))
		.sort((a, b) => a.sortSeed - b.sortSeed);

	const ratingsById = $state(createRatings(shuffledItems));

	for (const vote of currentData().votes) {
		if (
			!ratingsById[vote.winnerAudioFileId] ||
			!ratingsById[vote.loserAudioFileId]
		) {
			continue;
		}
		applyResult(ratingsById, vote.winnerAudioFileId, vote.loserAudioFileId);
	}

	let currentPair = $state(pickNextPair(shuffledItems, ratingsById));
	let submitError = $state('');

	type UndoEntry = {
		winnerId: string;
		loserId: string;
		previousRatings: Record<string, { mu: number; sigma: number }>;
		previousPair: typeof currentPair;
	};

	const undoStack: UndoEntry[] = [];
	let showResetDialog = $state(false);
	let showCloneDialog = $state(false);
	let cloneName = $state(data.project.name);
	let cloning = $state(false);

	const cloneProject = async () => {
		cloning = true;
		const response = await fetch(`/api/projects/${data.project.id}/clone`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name: cloneName })
		});

		if (response.ok) {
			const { id } = await response.json();
			window.location.href = `/${id}`;
		}

		cloning = false;
	};

	const leaderboard = $derived(
		shuffledItems
			.map((item) => {
				const rating = ratingsById[item.id];
				return {
					...item,
					rating
				};
			})
			.sort((a, b) => {
				if (b.rating.mu !== a.rating.mu) return b.rating.mu - a.rating.mu;
				return a.sortSeed - b.sortSeed;
			})
	);

	const confidence = $derived(
		leaderboardConfidence(leaderboard.map((item) => item.rating))
	);

	const chooseWinner = async (winnerId: string) => {
		const loserId =
			currentPair[0].id === winnerId ? currentPair[1].id : currentPair[0].id;

		const previousRatings = Object.fromEntries(
			Object.entries(ratingsById).map(([id, r]) => [
				id,
				{ mu: r.mu, sigma: r.sigma }
			])
		);
		undoStack.push({
			winnerId,
			loserId,
			previousRatings,
			previousPair: currentPair
		});

		applyResult(ratingsById, winnerId, loserId);
		currentPair = pickNextPair(shuffledItems, ratingsById);
		submitError = '';

		const response = await fetch(`/api/projects/${data.project.id}/vote`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				winnerAudioFileId: winnerId,
				loserAudioFileId: loserId
			})
		});

		if (!response.ok) {
			submitError =
				'Could not save that vote. Your local ranking still updated.';
		}
	};

	const resetRatings = async () => {
		for (const item of shuffledItems) {
			ratingsById[item.id] = createRatings([item])[item.id];
		}
		currentPair = pickNextPair(shuffledItems, ratingsById);

		await fetch(`/api/projects/${data.project.id}/reset`, { method: 'POST' });
	};

	const undo = async () => {
		const entry = undoStack.pop();
		if (!entry) return;

		for (const [id, { mu, sigma }] of Object.entries(entry.previousRatings)) {
			ratingsById[id] = new Rating(mu, sigma);
		}
		currentPair = entry.previousPair;

		await fetch(`/api/projects/${data.project.id}/vote`, { method: 'DELETE' });
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
			e.preventDefault();
			void undo();
		}
	};

	const handleAudioPlay = (event: Event) => {
		const currentAudio = event.currentTarget;
		if (!(currentAudio instanceof HTMLAudioElement)) return;

		for (const audio of document.querySelectorAll('audio')) {
			if (audio !== currentAudio && !audio.paused) audio.pause();
		}
	};

</script>

<svelte:window onkeydown={handleKeydown} />

<main
	class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 md:px-6"
>
	<header class="space-y-2">
		<div class="flex items-center justify-between gap-3">
			<h1 class="text-3xl font-semibold tracking-tight">{data.project.name}</h1>
			<div class="flex gap-2">
				<button
					onclick={() => (showCloneDialog = true)}
					class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
				>
					Clone
				</button>
				<a
					href="/create"
					class="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
				>
					Create
				</a>
			</div>
		</div>
		<p class="text-sm text-zinc-600">
			Pick the better clip each round. Share this page URL to collect rankings
			from others.
		</p>
	</header>

	{#if shuffledItems.length < 2}
		<section
			class="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm"
		>
			This project needs at least two audio files to rank.
		</section>
	{:else}
		{#if submitError}
			<p
				class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
			>
				{submitError}
			</p>
		{/if}

		<section class="grid gap-4 md:grid-cols-2">
			{#each currentPair as item (item.id)}
				<article
					class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
				>
					<div class="mb-3 flex items-start justify-between gap-3">
						<h2 class="text-lg font-medium" title={item.filename}>
							{item.alias}
						</h2>
					</div>
					<audio
						class="mb-4 w-full"
						controls
						preload="metadata"
						src={item.src}
						onplay={handleAudioPlay}
					></audio>
					<button
						class="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
						onclick={() => void chooseWinner(item.id)}
					>
						I like this better!
					</button>
				</article>
			{/each}
		</section>

		<section class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
			<div class="mb-3 space-y-2">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-medium">Leaderboard</h2>
					<div class="flex items-center gap-3">
						<button
							onclick={() => (showResetDialog = true)}
							class="text-xs font-medium text-zinc-500 transition hover:text-zinc-800"
						>
							Reset
						</button>
						<span class="text-xs text-zinc-500"
							>{confidence.toFixed(0)}% confident</span
						>
					</div>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
					<div
						class="h-full rounded-full bg-zinc-900 transition-all duration-500"
						style="width: {confidence}%"
					></div>
				</div>
			</div>
			<ol class="space-y-2">
				{#each leaderboard as item, index}
					<CandidateTrack
						{item}
						projectId={data.project.id}
						{index}
						onAudioPlay={handleAudioPlay}
					/>
				{/each}
			</ol>
		</section>
	{/if}

	{#if showCloneDialog}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onclick={() => (showCloneDialog = false)}
			onkeydown={(e) => e.key === 'Escape' && (showCloneDialog = false)}
			role="button"
			tabindex="-1"
		>
			<div
				class="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg"
				onclick={(e) => e.stopPropagation()}
				onkeydown={() => {}}
				role="dialog"
				tabindex="-1"
			>
				<h2 class="mb-4 text-lg font-semibold">Clone Project</h2>
				<label
					class="mb-1 block text-sm font-medium text-zinc-700"
					for="clone-name">Project name</label
				>
				<input
					id="clone-name"
					class="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
					bind:value={cloneName}
					onkeydown={(e) => e.key === 'Enter' && !cloning && cloneProject()}
				/>
				<div class="flex justify-end gap-2">
					<button
						class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
						onclick={() => (showCloneDialog = false)}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
						disabled={cloning || !cloneName.trim()}
						onclick={() => void cloneProject()}
					>
						{cloning ? 'Cloning…' : 'Clone'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showResetDialog}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
			onclick={() => (showResetDialog = false)}
			onkeydown={(e) => e.key === 'Escape' && (showResetDialog = false)}
			role="button"
			tabindex="-1"
		>
			<div
				class="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg"
				onclick={(e) => e.stopPropagation()}
				onkeydown={() => {}}
				role="dialog"
				tabindex="-1"
			>
				<h2 class="mb-2 text-lg font-semibold">Reset all ratings?</h2>
				<p class="mb-4 text-sm text-zinc-600">
					This will permanently delete all votes and reset every rating to its
					default. This cannot be undone.
				</p>
				<div class="flex justify-end gap-2">
					<button
						class="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
						onclick={() => (showResetDialog = false)}
					>
						Cancel
					</button>
					<button
						class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
						onclick={() => {
							showResetDialog = false;
							void resetRatings();
						}}
					>
						Reset
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
