<script lang="ts">
	let files = $state<File[]>([]);
	let aliases = $state<string[]>([]);

	const presetAliases = [
		'Atlas',
		'Ember',
		'River',
		'Stone',
		'Orbit',
		'Flame',
		'Echo',
		'Sky',
		'Path',
		'Seed'
	];

	const aliasFor = (index: number) => {
		const preset = presetAliases[index % presetAliases.length];
		const cycle = Math.floor(index / presetAliases.length);
		return cycle === 0 ? preset : `${preset} ${cycle + 1}`;
	};

	const handleFilesChange = (event: Event) => {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.files) return;

		files = Array.from(input.files);
		aliases = files.map((_, index) => aliases[index] || aliasFor(index));
	};
</script>

<main
	class="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8 md:px-6"
>
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">
			Create Audio Ranker Project
		</h1>
		<p class="text-sm text-zinc-600">
			Name your project, upload audio files, then share the generated project
			URL.
		</p>
	</header>

	<form
		id="create-project-form"
		class="space-y-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6"
		method="POST"
		enctype="multipart/form-data"
	>
		<div class="space-y-2">
			<label class="block text-sm font-medium text-zinc-800" for="projectName">
				Project name
			</label>
			<input
				class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring"
				id="projectName"
				name="projectName"
				placeholder="My vocal takes"
				required
			/>
		</div>

		<div class="space-y-2">
			<label class="block text-sm font-medium text-zinc-800" for="files">
				Audio files
			</label>
			<input
				class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
				id="files"
				name="files"
				type="file"
				accept="audio/*"
				multiple
				required
				onchange={handleFilesChange}
			/>
		</div>

		<button
			class="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
			type="submit"
		>
			Create project
		</button>
	</form>

	{#if files.length > 0}
		<section class="space-y-2">
			<h2 class="text-sm font-medium text-zinc-700">Aliases</h2>
			<div class="space-y-2">
				{#each files as file, index}
					<div class="grid items-center gap-2 sm:grid-cols-[1fr_220px]">
						<p class="truncate text-xs text-zinc-500" title={file.name}>
							{file.name}
						</p>
						<label
							class="sr-only"
							for={`alias-${index}`}
						>
							Alias for {file.name}
						</label>
						<input
							class="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none ring-zinc-400 focus:ring"
							id={`alias-${index}`}
							form="create-project-form"
							name="aliases"
							placeholder="Alias"
							required
							bind:value={aliases[index]}
						/>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</main>
