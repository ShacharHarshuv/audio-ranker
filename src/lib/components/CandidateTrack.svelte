<script lang="ts">
	import CandidateNote from './CandidateNote.svelte';
	import type { AudioItem } from '../../routes/[projectId]/+page.server';
	import type { Rating } from 'ts-trueskill';

	type Props = {
		item: AudioItem & { rating: Rating };
	projectId: string;
		index: number;
		onAudioPlay: (event: Event) => void;
	};

let { item, projectId, index, onAudioPlay }: Props = $props();

	let audioEl: HTMLAudioElement | undefined = $state();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let playbackRate = $state(1);
	let progress = $derived(
		duration ? (Math.min(currentTime, duration) / duration) * 100 : 0
	);

	const togglePlay = async () => {
		if (!audioEl) return;
		if (audioEl.paused) {
			await audioEl.play();
			return;
		}
		audioEl.pause();
	};

	const onPlay = (event: Event) => {
		isPlaying = true;
		onAudioPlay(event);
	};

	const onPause = () => {
		isPlaying = false;
	};

	const onLoadedMetadata = () => {
		duration = audioEl?.duration ?? 0;
	};

	const onTimeUpdate = () => {
		currentTime = audioEl?.currentTime ?? 0;
	};

	const onSeek = (event: Event) => {
		if (!audioEl) return;
		const target = event.currentTarget as HTMLInputElement;
		const nextTime = Number(target.value);
		audioEl.currentTime = nextTime;
		currentTime = nextTime;
	};

	const onPlaybackRateChange = (event: Event) => {
		if (!audioEl) return;
		const target = event.currentTarget as HTMLSelectElement;
		playbackRate = Number(target.value);
		audioEl.playbackRate = playbackRate;
	};

</script>

<li
	class="grid grid-cols-[auto_1fr] items-start gap-3 rounded-md bg-zinc-50 px-3 py-2"
>
	<div class="flex items-center gap-2">
		<span class="text-xs leading-6 text-zinc-500">{index + 1}</span>
		<button
			type="button"
			class="flex size-6 items-center justify-center text-zinc-700 hover:text-zinc-900"
			onclick={togglePlay}
			aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
			title={isPlaying ? 'Pause' : 'Play'}
		>
			{#if isPlaying}
				<svg viewBox="0 0 24 24" class="size-4 fill-current" aria-hidden="true">
					<rect x="6" y="5" width="4" height="14" rx="1"></rect>
					<rect x="14" y="5" width="4" height="14" rx="1"></rect>
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" class="size-4 fill-current" aria-hidden="true">
					<path
						d="M8 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 8 5.5z"
					></path>
				</svg>
			{/if}
		</button>
	</div>
	<div class="min-w-0">
		<div class="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-3">
			<div class="min-w-0">
				<div class="flex items-center justify-between gap-2">
					<span
						class="block truncate text-sm font-medium leading-6"
						title={item.filename}
					>
						{item.alias}
					</span>
					<span class="shrink-0 text-xs text-zinc-600">
						<span class="sm:hidden"
							>{item.rating.mu.toFixed(2)} | {item.rating.sigma.toFixed(2)}</span
						>
						<span class="hidden sm:inline"
							>mu {item.rating.mu.toFixed(2)} | sigma {item.rating.sigma.toFixed(
								2
							)}</span
						>
					</span>
				</div>
				<div class="flex items-center">
					<input
						class="seek w-full"
						type="range"
						min="0"
						max={duration || 0}
						step="0.01"
						value={Math.min(currentTime, duration || 0)}
						style={`--seek-progress: ${progress}%`}
						oninput={onSeek}
					/>
					<select
						class="appearance-none cursor-pointer border-0 bg-transparent px-0 py-0 text-right text-xs text-zinc-400 outline-none"
						value={String(playbackRate)}
						onchange={onPlaybackRateChange}
					>
						<option
							class="rounded-md border-0 px-2 py-1 text-black shadow-sm"
							value="0.75">0.75x</option
						>
						<option
							class="rounded-md border-0 px-2 py-1 text-black shadow-sm"
							value="1">1x</option
						>
						<option
							class="rounded-md border-0 px-2 py-1 text-black shadow-sm"
							value="1.25">1.25x</option
						>
						<option
							class="rounded-md border-0 px-2 py-1 text-black shadow-sm"
							value="1.5">1.5x</option
						>
						<option
							class="rounded-md border-0 px-2 py-1 text-black shadow-sm"
							value="2">2x</option
						>
					</select>
				</div>
			</div>
			<CandidateNote
				{projectId}
				audioFileId={item.id}
				{item}
			/>
		</div>
		<audio
			class="hidden"
			bind:this={audioEl}
			preload="metadata"
			src={item.src}
			onplay={onPlay}
			onpause={onPause}
			onloadedmetadata={onLoadedMetadata}
			ontimeupdate={onTimeUpdate}
			onended={onPause}
		></audio>
	</div>
</li>

<style>
	.seek {
		appearance: none;
		height: 16px;
		border: 0;
		border-radius: 9999px;
		outline: none;
		cursor: pointer;
		background-image: linear-gradient(
			to right,
			rgb(24 24 27) 0%,
			rgb(24 24 27) var(--seek-progress),
			rgb(212 212 216) var(--seek-progress),
			rgb(212 212 216) 100%
		);
		background-repeat: no-repeat;
		background-position: center;
		background-size: 100% 3px;
	}

	.seek::-webkit-slider-thumb {
		appearance: none;
		width: 0;
		height: 0;
		opacity: 0;
		cursor: pointer;
	}

	.seek::-moz-range-thumb {
		width: 0;
		height: 0;
		opacity: 0;
		border: 0;
		cursor: pointer;
	}

	.seek::-moz-range-track {
		height: 3px;
		border: 0;
		border-radius: 9999px;
		background: rgb(212 212 216);
	}

	.seek::-moz-range-progress {
		height: 3px;
		border-radius: 9999px;
		background: rgb(24 24 27);
	}
</style>
