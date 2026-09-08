<script lang="ts">
	import { enhance } from '$app/forms';
	import { MapPin, Plus, Pencil, Trash2, Check } from '@lucide/svelte';
	import { formatPhone } from '$lib/phone';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';

	type Row = (typeof data)['list'][number];

	let { data, form } = $props();

	let open = $state(false);
	let editing = $state<Row | null>(null);
	let name = $state('');
	let phone = $state('');
	let districtId = $state('');
	let areaId = $state('');
	let line = $state('');
	let isDefault = $state(false);

	const areas = $derived(data.regions.areasByDistrict[districtId] ?? []);

	function pickDistrict(id: string) {
		districtId = id;
		areaId = '';
	}

	function start(row: Row | null) {
		editing = row;
		name = row?.name ?? '';
		phone = row?.phone ?? '';
		districtId = row?.districtId ?? '';
		areaId = row?.areaId ?? '';
		line = row?.line ?? '';
		isDefault = row?.isDefault ?? false;
		open = true;
	}
</script>

<svelte:head><title>Addresses · {data.settings.store.name}</title></svelte:head>

<div class="flex items-start justify-between gap-4">
	<h1 class="text-2xl font-semibold tracking-tight text-ink">Addresses</h1>
	<Button onclick={() => start(null)}>
		<Plus size={16} />
		Add address
	</Button>
</div>

{#if form?.error}
	<p
		class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
		role="alert"
	>
		{form.error}
	</p>
{/if}

<div class="mt-6 grid gap-4 sm:grid-cols-2">
	{#each data.list as a (a.id)}
		<div class="rounded-3xl border border-border bg-surface p-5">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-sm font-medium text-ink">{a.name}</p>
					<p class="num text-xs text-ink-muted">{formatPhone(a.phone)}</p>
				</div>
				{#if a.isDefault}
					<span class="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
						Default
					</span>
				{/if}
			</div>
			<p class="mt-3 text-sm text-ink-muted">
				{a.line}{a.area ? `, ${a.area}` : ''}, {a.city}
			</p>
			<p class="mt-1 text-xs text-ink-faint">
				{data.zones.find((z) => z.value === a.zone)?.label}
			</p>

			<div class="mt-4 flex items-center gap-1">
				<button
					class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
					onclick={() => start(a)}
				>
					<Pencil size={13} />
					Edit
				</button>
				{#if !a.isDefault}
					<form method="POST" action="?/makeDefault" use:enhance>
						<input type="hidden" name="id" value={a.id} />
						<button
							class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
						>
							<Check size={13} />
							Make default
						</button>
					</form>
				{/if}
				<form method="POST" action="?/remove" use:enhance class="ml-auto">
					<input type="hidden" name="id" value={a.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
						aria-label="Delete address"
					>
						<Trash2 size={14} />
					</button>
				</form>
			</div>
		</div>
	{:else}
		<div
			class="col-span-full flex flex-col items-center gap-4 rounded-3xl border border-border px-6 py-16"
		>
			<MapPin size={24} class="text-ink-faint" />
			<p class="text-sm text-ink-muted">No addresses saved. Add one to check out faster.</p>
		</div>
	{/each}
</div>

<Dialog bind:open title={editing ? 'Edit address' : 'New address'}>
	<form
		id="address-form"
		method="POST"
		action="?/save"
		use:enhance={() =>
			({ update }) => {
				open = false;
				return update();
			}}
		class="flex flex-col gap-4"
	>
		{#if editing}<input type="hidden" name="id" value={editing.id} />{/if}
		<div class="grid gap-4 sm:grid-cols-2">
			<Input label="Full name" name="name" bind:value={name} required autocomplete="name" />
			<Input
				label="Mobile number"
				name="phone"
				bind:value={phone}
				numeric
				inputmode="tel"
				required
			/>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<Select
				label="District"
				name="districtId"
				value={districtId}
				placeholder="Choose your district"
				options={data.regions.districts.map((d) => ({ value: d.id, label: d.name }))}
				onchange={pickDistrict}
			/>
			<Select
				label="Area / thana"
				name="areaId"
				bind:value={areaId}
				placeholder={districtId ? 'Choose your area' : 'Pick a district first'}
				options={areas.map((a) => ({ value: a.id, label: a.name }))}
			/>
		</div>
		<Textarea label="Full address" name="line" bind:value={line} rows={3} required />
		<Checkbox name="isDefault" bind:checked={isDefault} label="Use as my default address" />
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="address-form">{editing ? 'Save address' : 'Add address'}</Button>
	{/snippet}
</Dialog>
