<script lang="ts">
	import { audioItems } from '$lib/audio-items';
	import { applyResult, confidenceScore, createRatings, pickNextPair } from '$lib/ranker';

	const shuffledItems = [...audioItems]
		.map((item) => ({ ...item, sortSeed: Math.random() }))
		.sort((a, b) => a.sortSeed - b.sortSeed);

	const ratingsById = $state(createRatings(shuffledItems));
	let currentPair = $state(pickNextPair(shuffledItems, ratingsById));

	const leaderboard = $derived(
		shuffledItems
			.map((item) => {
				const rating = ratingsById[item.id];
				return {
					...item,
					rating,
					confidence: confidenceScore(rating)
				};
			})
			.sort((a, b) => {
				if (b.rating.mu !== a.rating.mu) return b.rating.mu - a.rating.mu;
				if (b.confidence !== a.confidence) return b.confidence - a.confidence;
				return a.sortSeed - b.sortSeed;
			})
	);

	const chooseWinner = (winnerId: string) => {
		const loserId = currentPair[0].id === winnerId ? currentPair[1].id : currentPair[0].id;
		applyResult(ratingsById, winnerId, loserId);
		currentPair = pickNextPair(shuffledItems, ratingsById);
	};
</script>

<main class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Audio Ranker</h1>
		<p class="text-sm text-zinc-600">
			Pick the better clip each round. Ratings update with TrueSkill after every choice.
		</p>
	</header>

	<section class="grid gap-4 md:grid-cols-2">
		{#each currentPair as item}
			<article class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
				<div class="mb-3 flex items-start justify-between gap-3">
					<h2 class="text-lg font-medium" title={item.filename}>{item.alias}</h2>
					<span class="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{item.filename}</span>
				</div>
				<audio class="mb-4 w-full" controls preload="metadata">
					<source src={item.src} type="audio/mpeg" />
				</audio>
				<button
					class="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
					onclick={() => chooseWinner(item.id)}
				>
					Pick {item.alias}
				</button>
			</article>
		{/each}
	</section>

	<section class="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-medium">Leaderboard</h2>
			<span class="text-xs text-zinc-500">Sorted by mu</span>
		</div>
		<ol class="space-y-2">
			{#each leaderboard as item, index}
				<li class="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md bg-zinc-50 px-3 py-2">
					<span class="text-xs text-zinc-500">{index + 1}</span>
					<span class="truncate text-sm font-medium" title={item.filename}>{item.alias}</span>
					<span class="text-xs text-zinc-600">
						mu {item.rating.mu.toFixed(2)} | sigma {item.rating.sigma.toFixed(2)} | conf
						{item.confidence.toFixed(2)}
					</span>
				</li>
			{/each}
		</ol>
	</section>
</main>
