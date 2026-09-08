<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Pencil, Trash2, TicketPercent, Power } from '@lucide/svelte';
	import { formatTk } from '$lib/money';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import Dialog from '$lib/ui/Dialog.svelte';

	type Row = (typeof data)['list'][number];

	let { data, form } = $props();

	let open = $state(false);
	let editing = $state<Row | null>(null);
	let code = $state('');
	let type = $state('percent');
	let value = $state('');
	let minOrder = $state('0');
	let usageLimit = $state('');
	let perCustomerLimit = $state('1');
	let startsAt = $state('');
	let endsAt = $state('');
	let active = $state(true);

	const forInput = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 16) : '');

	function start(row: Row | null) {
		editing = row;
		code = row?.code ?? '';
		type = row?.type ?? 'percent';
		value = row ? (row.type === 'percent' ? String(row.value) : String(row.value / 100)) : '';
		minOrder = row ? String(row.minOrder / 100) : '0';
		usageLimit = row?.usageLimit ? String(row.usageLimit) : '';
		perCustomerLimit = String(row?.perCustomerLimit ?? 1);
		startsAt = forInput(row?.startsAt ?? null);
		endsAt = forInput(row?.endsAt ?? null);
		active = row?.active ?? true;
		open = true;
	}

	const describe = (c: Row) =>
		c.type === 'percent'
			? `${c.value}% off`
			: c.type === 'fixed'
				? `${formatTk(c.value)} off`
				: 'Free delivery';

	const window = (c: Row) => {
		const f = (d: Date | string | null) =>
			d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null;
		const a = f(c.startsAt);
		const b = f(c.endsAt);
		if (a && b) return `${a} – ${b}`;
		if (b) return `until ${b}`;
		if (a) return `from ${a}`;
		return 'always';
	};
</script>

<svelte:head><title>Coupons · Admin</title></svelte:head>

<div class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-ink">Coupons</h1>
		<p class="mt-1 text-sm text-ink-muted">Discount codes customers type at checkout.</p>
	</div>
	<Button onclick={() => start(null)}>
		<Plus size={16} />
		New coupon
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

<div class="mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
	{#each data.list as c (c.id)}
		<div
			class="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-0"
			class:opacity-55={!c.active}
		>
			<span class="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
				<TicketPercent size={16} />
			</span>
			<span class="min-w-32">
				<span class="num block text-sm font-semibold text-ink">{c.code}</span>
				<span class="block text-xs text-ink-muted">{describe(c)}</span>
			</span>
			<span class="min-w-28 text-xs text-ink-muted">
				{c.minOrder > 0 ? `min ${formatTk(c.minOrder)}` : 'no minimum'}
			</span>
			<span class="min-w-24 text-xs text-ink-muted">{window(c)}</span>
			<span class="num min-w-20 text-xs text-ink-muted">
				used {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
			</span>

			<span class="ml-auto flex items-center gap-1">
				<form method="POST" action="?/toggle" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
						aria-label={c.active ? `Disable ${c.code}` : `Enable ${c.code}`}
					>
						<Power size={15} />
					</button>
				</form>
				<button
					class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
					aria-label="Edit {c.code}"
					onclick={() => start(c)}
				>
					<Pencil size={15} />
				</button>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={c.id} />
					<button
						class="grid size-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-sale/8 hover:text-sale"
						aria-label="Delete {c.code}"
					>
						<Trash2 size={15} />
					</button>
				</form>
			</span>
		</div>
	{:else}
		<p class="px-4 py-16 text-center text-sm text-ink-faint">No coupons yet.</p>
	{/each}
</div>

<Dialog bind:open title={editing ? `Edit ${editing.code}` : 'New coupon'}>
	<form
		id="coupon-form"
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

		<Input
			label="Code"
			name="code"
			bind:value={code}
			placeholder="EID25"
			hint="Customers type this. Letters, digits, - and _."
		/>

		<Select
			label="Discount type"
			name="type"
			bind:value={type}
			options={[
				{ value: 'percent', label: 'Percentage off' },
				{ value: 'fixed', label: 'Fixed amount off' },
				{ value: 'free_shipping', label: 'Free delivery' }
			]}
		/>

		{#if type !== 'free_shipping'}
			<Input
				label={type === 'percent' ? 'Percent off' : 'Amount off (৳)'}
				name="value"
				bind:value
				numeric
				inputmode="decimal"
			/>
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<Input
				label="Minimum order (৳)"
				name="minOrder"
				bind:value={minOrder}
				numeric
				inputmode="decimal"
			/>
			<Input
				label="Total uses"
				name="usageLimit"
				bind:value={usageLimit}
				numeric
				type="number"
				min="1"
				hint="Empty means unlimited."
			/>
		</div>

		<Input
			label="Uses per customer"
			name="perCustomerLimit"
			bind:value={perCustomerLimit}
			numeric
			type="number"
			min="1"
		/>

		<div class="grid gap-4 sm:grid-cols-2">
			<Input label="Starts" name="startsAt" type="datetime-local" bind:value={startsAt} />
			<Input label="Ends" name="endsAt" type="datetime-local" bind:value={endsAt} />
		</div>

		<Checkbox name="active" bind:checked={active} label="Active" />
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
		<Button type="submit" form="coupon-form">{editing ? 'Save coupon' : 'Create coupon'}</Button>
	{/snippet}
</Dialog>
