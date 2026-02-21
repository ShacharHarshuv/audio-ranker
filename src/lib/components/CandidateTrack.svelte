<script lang="ts">
	import type { AudioItem } from '../../routes/[projectId]/+page.server';
	import type { Rating } from 'ts-trueskill';

	type Props = {
		item: AudioItem & { rating: Rating };
		index: number;
		onAudioPlay: (event: Event) => void;
	};

	let { item, index, onAudioPlay }: Props = $props();
</script>

<li
	class="grid grid-cols-[2ch_1fr_auto] items-start gap-3 rounded-md bg-zinc-50 px-3 py-2"
>
	<span class="text-xs text-zinc-500">{index + 1}</span>
	<div class="min-w-0">
		<span class="truncate text-sm font-medium" title={item.filename}>
			{item.alias}
		</span>
		<audio
			class="mt-2 w-full"
			controls
			preload="metadata"
			src={item.src}
			onplay={onAudioPlay}
		></audio>
	</div>
	<span class="text-xs text-zinc-600">
		<span class="sm:hidden"
			>{item.rating.mu.toFixed(2)} | {item.rating.sigma.toFixed(2)}</span
		>
		<span class="hidden sm:inline"
			>mu {item.rating.mu.toFixed(2)} | sigma {item.rating.sigma.toFixed(
				2
			)}</span
		>
	</span>
</li>
