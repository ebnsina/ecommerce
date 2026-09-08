<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import {
		Bold,
		Italic,
		Heading2,
		Heading3,
		List,
		ListOrdered,
		Quote,
		Link2,
		Undo2,
		Redo2
	} from '@lucide/svelte';

	/**
	 * Rich text for CMS pages. Tiptap is headless and framework-agnostic, so the
	 * vanilla `Editor` mounts straight into a Svelte element — no wrapper package.
	 *
	 * The value is HTML. It is sanitised server-side before rendering
	 * (see $lib/sanitize) — this editor constrains what a staff member can
	 * produce, it is not the security boundary.
	 */
	let { value = $bindable(''), label }: { value?: string; label?: string } = $props();

	let host = $state<HTMLDivElement | null>(null);
	let editor = $state<Editor | null>(null);
	/** Bumped on every transaction so the toolbar's active states re-evaluate. */
	let revision = $state(0);

	onMount(() => {
		const instance = new Editor({
			element: host!,
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] } }),
				Link.configure({ openOnClick: false })
			],
			content: value || '<p></p>',
			onUpdate: ({ editor: e }) => {
				// An empty document serialises as <p></p>; store nothing instead.
				const html = e.getHTML();
				value = html === '<p></p>' ? '' : html;
			},
			onTransaction: () => revision++
		});

		editor = instance;
		return () => instance.destroy();
	});

	const isActive = (name: string, attrs?: Record<string, unknown>) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- read to register a reactive dependency
		revision; // re-run when the selection or document changes
		return editor?.isActive(name, attrs) ?? false;
	};

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const href = prompt('Link to');
		if (!href) return;
		editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
	}

	const tools = $derived([
		{
			label: 'Bold',
			Icon: Bold,
			active: isActive('bold'),
			run: () => editor?.chain().focus().toggleBold().run()
		},
		{
			label: 'Italic',
			Icon: Italic,
			active: isActive('italic'),
			run: () => editor?.chain().focus().toggleItalic().run()
		},
		{
			label: 'Heading',
			Icon: Heading2,
			active: isActive('heading', { level: 2 }),
			run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run()
		},
		{
			label: 'Subheading',
			Icon: Heading3,
			active: isActive('heading', { level: 3 }),
			run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run()
		},
		{
			label: 'Bullet list',
			Icon: List,
			active: isActive('bulletList'),
			run: () => editor?.chain().focus().toggleBulletList().run()
		},
		{
			label: 'Numbered list',
			Icon: ListOrdered,
			active: isActive('orderedList'),
			run: () => editor?.chain().focus().toggleOrderedList().run()
		},
		{
			label: 'Quote',
			Icon: Quote,
			active: isActive('blockquote'),
			run: () => editor?.chain().focus().toggleBlockquote().run()
		},
		{ label: 'Link', Icon: Link2, active: isActive('link'), run: toggleLink }
	]);
</script>

{#if label}<span class="mb-1.5 block text-sm font-medium text-ink">{label}</span>{/if}

<div class="overflow-hidden rounded-2xl border border-border bg-surface">
	<div class="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-alt p-1.5">
		{#each tools as t (t.label)}
			<button
				type="button"
				title={t.label}
				aria-label={t.label}
				aria-pressed={t.active}
				class="grid size-8 place-items-center rounded-lg transition-colors duration-[180ms] ease-brand
				       {t.active
					? 'bg-surface text-primary shadow-sm'
					: 'text-ink-muted hover:bg-surface hover:text-ink'}"
				onclick={t.run}
			>
				<t.Icon size={15} />
			</button>
		{/each}

		<span class="ml-auto flex gap-0.5">
			<button
				type="button"
				aria-label="Undo"
				class="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
				onclick={() => editor?.chain().focus().undo().run()}
			>
				<Undo2 size={15} />
			</button>
			<button
				type="button"
				aria-label="Redo"
				class="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
				onclick={() => editor?.chain().focus().redo().run()}
			>
				<Redo2 size={15} />
			</button>
		</span>
	</div>

	<div bind:this={host} class="prose-page min-h-40 px-4 py-3"></div>
</div>

<style>
	/* The editor surface should read as the page will, not as a textarea. */
	.prose-page :global(.tiptap) {
		outline: none;
		font-size: 0.875rem;
		color: var(--color-ink);
	}
	.prose-page :global(.tiptap > * + *) {
		margin-top: 0.75em;
	}
	.prose-page :global(.tiptap h2) {
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.prose-page :global(.tiptap h3) {
		font-size: 1rem;
		font-weight: 600;
	}
	.prose-page :global(.tiptap ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}
	.prose-page :global(.tiptap ol) {
		list-style: decimal;
		padding-left: 1.25rem;
	}
	.prose-page :global(.tiptap blockquote) {
		border-left: 2px solid var(--color-border);
		padding-left: 0.75rem;
		color: var(--color-ink-muted);
	}
	.prose-page :global(.tiptap a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.prose-page :global(.tiptap p.is-editor-empty:first-child::before) {
		content: 'Write the page content…';
		color: var(--color-ink-faint);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
