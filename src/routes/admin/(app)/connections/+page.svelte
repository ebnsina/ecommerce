<script lang="ts">
	import { Check, Plug, Copy, ExternalLink } from '@lucide/svelte';
	import ChannelBadge from '$lib/admin/ChannelBadge.svelte';

	let { data } = $props();

	let copied = $state('');

	async function copy(text: string, key: string) {
		await navigator.clipboard.writeText(text);
		copied = key;
		setTimeout(() => (copied = ''), 1500);
	}

	const CHANNEL_KEYS = new Set(['site', 'sms', 'telegram', 'whatsapp', 'messenger', 'instagram']);
</script>

<svelte:head><title>Connections · Admin</title></svelte:head>

<div class="max-w-3xl">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Connections</h1>
	<p class="mt-1 text-sm text-ink-muted">
		What your shop is plugged into, what each thing is for, and what is still needed.
		<span class="num font-medium text-ink">{data.connected}</span> of
		<span class="num font-medium text-ink">{data.total}</span> connected.
	</p>

	<p class="mt-4 rounded-2xl bg-surface-alt p-4 text-sm text-ink-muted">
		These are set up once by whoever runs your server — they are secrets, so they live outside this
		admin. Send the highlighted names to your developer; you never need to paste a key here.
	</p>

	<div class="mt-6 flex flex-col gap-6">
		{#each data.groups as group (group.title)}
			<section>
				<h2 class="text-sm font-medium text-ink">{group.title}</h2>
				<p class="mt-0.5 text-xs text-ink-muted">{group.blurb}</p>

				<div class="mt-3 overflow-hidden rounded-3xl border border-border bg-surface">
					{#each group.items as item (item.key)}
						<div class="flex flex-wrap gap-3 border-b border-border p-4 last:border-0">
							{#if CHANNEL_KEYS.has(item.key)}
								<ChannelBadge channel={item.key} size="md" />
							{:else}
								<span
									class="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-alt text-ink-muted"
								>
									<Plug size={17} />
								</span>
							{/if}

							<div class="min-w-48 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="text-sm font-medium text-ink">{item.name}</span>
									{#if item.connected}
										<span
											class="inline-flex items-center gap-1 rounded-lg border border-border px-1.5 py-0.5 text-xs font-medium text-ink"
										>
											<Check size={11} style="color: var(--color-ok-fg)" />
											Connected
										</span>
									{:else}
										<span
											class="rounded-lg border border-border px-1.5 py-0.5 text-xs font-medium text-ink-muted"
										>
											Not set up
										</span>
									{/if}
								</div>

								<p class="mt-1 text-sm text-ink-muted">{item.purpose}</p>

								{#if !item.connected && item.vars.length}
									<div class="mt-2 flex flex-wrap items-center gap-1.5">
										{#each item.vars as v (v)}
											<button
												type="button"
												onclick={() => copy(v, item.key + v)}
												class="inline-flex items-center gap-1 rounded-lg bg-surface-alt px-2 py-1 font-mono text-xs text-ink transition-colors hover:bg-border"
												title="Copy name"
											>
												{v}
												{#if copied === item.key + v}
													<Check size={11} style="color: var(--color-ok-fg)" />
												{:else}
													<Copy size={11} class="text-ink-faint" />
												{/if}
											</button>
										{/each}
									</div>
								{/if}

								{#if item.webhook}
									<p class="mt-2 text-xs text-ink-muted">
										Callback URL for {item.name}:
										<span class="font-mono text-ink">{item.webhook}</span>
									</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>

	<p class="mt-6 flex items-center gap-1.5 text-xs text-ink-muted">
		<ExternalLink size={13} />
		Everything on this page is also listed in the project's
		<span class="font-mono">.env.example</span> file.
	</p>
</div>
