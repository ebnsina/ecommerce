<script lang="ts" generics="T extends Record<string, unknown>">
	import { untrack, type Snippet } from 'svelte';
	import { createTable, FlexRender, renderSnippet } from '@tanstack/svelte-table';
	import { adminTableFeatures, type AdminTableFeatures } from './table';
	import type { CellContext, ColumnDef, Row, RowSelectionState } from '@tanstack/svelte-table';
	import { Search, ChevronLeft, ChevronRight, X } from '@lucide/svelte';
	import Select from '$lib/ui/Select.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import { PER_PAGE_OPTIONS, setParams, debouncedSetParams } from './listQuery';

	/**
	 * The shape every admin list uses: search and filters above the table,
	 * the rows, then page size and position below.
	 *
	 * Searching, filtering and paging all happen on the server — this component
	 * only ever holds the page it was given, so the table stays the same speed
	 * at twenty rows and at twenty thousand.
	 */
	let {
		columns,
		rows,
		total,
		page,
		perPage,
		q = '',
		searchPlaceholder = 'Search…',
		empty = 'Nothing here yet.',
		filters,
		selection = $bindable({}),
		bulk,
		rowId = (_row: T, i: number) => String(i)
	}: {
		columns: ColumnDef<AdminTableFeatures, T>[];
		rows: T[];
		total: number;
		page: number;
		perPage: number;
		q?: string;
		searchPlaceholder?: string;
		empty?: string;
		/** Controls sitting to the right of the search box. */
		filters?: Snippet;
		selection?: RowSelectionState;
		/** Shown in place of the filters once something is selected. */
		bulk?: Snippet<[{ ids: string[]; clear: () => void }]>;
		rowId?: (row: T, index: number) => string;
	} = $props();

	/* The tick column is added here rather than by each page, so selection looks
	   and behaves the same everywhere it is switched on. */
	const allColumns = $derived(
		bulk
			? [
					{
						id: 'select',
						header: () => renderSnippet(headerTick, null),
						cell: (c: CellContext<AdminTableFeatures, T, unknown>) => renderSnippet(rowTick, c.row)
					} as ColumnDef<AdminTableFeatures, T>,
					...columns
				]
			: columns
	);

	const table = createTable({
		features: adminTableFeatures,
		get columns() {
			return allColumns;
		},
		get data() {
			return rows;
		},
		getRowId: untrack(() => rowId),
		state: {
			get rowSelection() {
				return selection;
			}
		},
		onRowSelectionChange: (updater) => {
			selection = typeof updater === 'function' ? updater(selection) : updater;
		}
		// No pagination, sorting or filtering features are enabled: the server has
		// already done all three, and the table renders exactly the page it was
		// handed. Its job here is column definitions and row selection.
	});

	const selectedIds = $derived(Object.keys(selection).filter((id) => selection[id]));
	const clearSelection = () => (selection = {});

	const from = $derived(total === 0 ? 0 : (page - 1) * perPage + 1);
	const to = $derived(Math.min(page * perPage, total));
	const lastPage = $derived(Math.max(1, Math.ceil(total / perPage)));

	// Follows the URL when it changes from elsewhere — a cleared filter, a back
	// button — and still takes what is being typed, because a writable $derived
	// keeps a local assignment until its source changes again.
	let searchValue = $derived(q);
</script>

{#snippet headerTick()}
	<Checkbox
		checked={table.getIsAllRowsSelected()}
		indeterminate={table.getIsSomeRowsSelected()}
		label="Select every row on this page"
		hideLabel
		onchange={() => table.toggleAllRowsSelected()}
	/>
{/snippet}

{#snippet rowTick(row: Row<AdminTableFeatures, T>)}
	<Checkbox
		checked={row.getIsSelected()}
		label="Select this row"
		hideLabel
		onchange={() => row.toggleSelected()}
	/>
{/snippet}

<div class="flex flex-col gap-4">
	<!-- Toolbar: search left, filters right — outside the table, as its controls
	     are about the query rather than the rows. -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="relative min-w-56 flex-1 sm:max-w-80">
			<Search
				size={16}
				class="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
			/>
			<input
				type="search"
				bind:value={searchValue}
				placeholder={searchPlaceholder}
				aria-label={searchPlaceholder}
				class="h-11 w-full rounded-xl border border-border bg-surface pr-3.5 pl-10 text-sm text-ink
				       transition-colors duration-[180ms] ease-brand placeholder:text-ink-faint"
				oninput={(e) => debouncedSetParams({ q: e.currentTarget.value })}
			/>
		</div>

		{#if selectedIds.length && bulk}
			<div class="flex items-center gap-2">
				<span class="num text-sm text-ink-muted">{selectedIds.length} selected</span>
				{@render bulk({ ids: selectedIds, clear: clearSelection })}
				<button
					class="grid size-9 place-items-center rounded-xl border border-border text-ink-faint hover:text-ink"
					aria-label="Clear selection"
					onclick={clearSelection}
				>
					<X size={15} />
				</button>
			</div>
		{:else if filters}
			<div class="flex flex-wrap items-center gap-2">{@render filters()}</div>
		{/if}
	</div>

	<div class="overflow-hidden rounded-3xl border border-border bg-surface">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<tr class="border-b border-border">
							{#each headerGroup.headers as header (header.id)}
								<th
									scope="col"
									class="px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase"
								>
									{#if !header.isPlaceholder}
										<FlexRender {header} />
									{/if}
								</th>
							{/each}
						</tr>
					{/each}
				</thead>
				<tbody>
					{#each table.getRowModel().rows as row (row.id)}
						<tr
							class="border-b border-border transition-colors duration-[180ms] ease-brand last:border-0 hover:bg-surface-alt"
							class:bg-primary-soft={row.getIsSelected()}
						>
							{#each row.getAllCells() as cell (cell.id)}
								<td class="px-4 py-3 align-middle">
									<FlexRender {cell} />
								</td>
							{/each}
						</tr>
					{:else}
						<tr>
							<td colspan={allColumns.length} class="px-4 py-16 text-center text-sm text-ink-faint">
								{empty}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Footer: how many per page on the left, where you are on the right. -->
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
			<label class="flex items-center gap-2 text-sm text-ink-muted">
				<span>Rows per page</span>
				<Select
					value={String(perPage)}
					class="w-24"
					options={PER_PAGE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
					onchange={(v) => setParams({ perPage: v })}
				/>
			</label>

			<div class="flex items-center gap-2">
				<p class="num text-sm text-ink-muted">
					{from}–{to} of {total}
				</p>
				<button
					class="grid size-9 place-items-center rounded-xl border border-border text-ink-muted
					       transition-colors duration-[180ms] ease-brand hover:text-ink
					       disabled:cursor-not-allowed disabled:text-ink-faint"
					aria-label="Previous page"
					disabled={page <= 1}
					onclick={() => setParams({ page: page - 1 })}
				>
					<ChevronLeft size={16} />
				</button>
				<button
					class="grid size-9 place-items-center rounded-xl border border-border text-ink-muted
					       transition-colors duration-[180ms] ease-brand hover:text-ink
					       disabled:cursor-not-allowed disabled:text-ink-faint"
					aria-label="Next page"
					disabled={page >= lastPage}
					onclick={() => setParams({ page: page + 1 })}
				>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	</div>
</div>
