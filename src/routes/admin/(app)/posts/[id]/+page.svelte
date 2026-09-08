<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import { ArrowLeft, Eye, Trash2, Check } from '@lucide/svelte';
	import { fadeIn } from '$lib/motion';
	import { slugify } from '$lib/slug';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Checkbox from '$lib/ui/Checkbox.svelte';
	import MediaPicker from '$lib/ui/MediaPicker.svelte';
	import RichTextEditor from '$lib/admin/RichTextEditor.svelte';

	let { data, form } = $props();
	const init = untrack(() => data.post);

	let title = $state(init.title);
	let titleBn = $state(init.titleBn ?? '');
	let slug = $state(init.slug);
	let excerpt = $state(init.excerpt ?? '');
	let body = $state(init.body);
	let cover = $state(init.cover ?? '');
	let tags = $state((init.tags ?? []).join(', '));
	let seoTitle = $state(init.seoTitle ?? '');
	let seoDescription = $state(init.seoDescription ?? '');
	let published = $state(init.published);
	let slugTouched = $state(true);

	/* A new post's address follows its title until someone sets one by hand. */
	const shownSlug = $derived(slugTouched ? slug : slugify(title));
</script>

<svelte:head><title>{title} · Blog · Admin</title></svelte:head>

<a
	href="/admin/posts"
	class="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
>
	<ArrowLeft size={15} />
	All posts
</a>

<form method="POST" action="?/save" use:enhance class="mt-3">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
			<p class="mt-1 text-sm text-ink-faint">
				/blog/{shownSlug}
				{#if data.post.author}· by {data.post.author}{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="ghost" href="/demo/blog/{data.post.slug}" target="_blank">
				<Eye size={16} />
				{published ? 'View' : 'Preview'}
			</Button>
			<Button type="submit">Save</Button>
		</div>
	</div>

	{#if form?.error}
		<p
			class="mt-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3 text-sm text-sale"
			role="alert"
		>
			{form.error}
		</p>
	{:else if form?.saved}
		<p
			class="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
			transition:fade={fadeIn()}
		>
			<Check size={15} class="text-ok-fg" />
			{form.saved === 'published' ? 'Published — anyone can read it now.' : 'Saved as a draft.'}
		</p>
	{/if}

	<div class="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
		<div class="flex flex-col gap-4">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<div class="flex flex-col gap-4">
					<Input label="Title" name="title" bind:value={title} required />
					<Input label="Title (Bangla)" name="titleBn" bind:value={titleBn} />
					<Textarea
						label="Summary"
						name="excerpt"
						bind:value={excerpt}
						rows={2}
						hint="Shown in the blog list, and used by Google when no SEO description is set."
					/>
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<input type="hidden" name="body" value={body} />
				<RichTextEditor label="Article" bind:value={body} />
			</section>
		</div>

		<div class="flex flex-col gap-4">
			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Publishing</h2>
				<div class="flex flex-col gap-4">
					<Checkbox
						name="publish"
						bind:checked={published}
						label="Published"
						hint="Off keeps it private. The link still works for you."
					/>
					<Input
						label="Web address"
						name="slug"
						bind:value={slug}
						oninput={() => (slugTouched = true)}
						hint="The part after /blog/."
					/>
					<Input
						label="Tags"
						name="tags"
						bind:value={tags}
						placeholder="buying guide, kitchen"
						hint="Separate with commas."
					/>
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Cover image</h2>
				<input type="hidden" name="cover" value={cover} />
				<MediaPicker bind:value={cover} />
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5">
				<h2 class="mb-4 text-sm font-medium text-ink">Search engines</h2>
				<div class="flex flex-col gap-4">
					<Input label="Title" name="seoTitle" bind:value={seoTitle} />
					<Textarea
						label="Description"
						name="seoDescription"
						bind:value={seoDescription}
						rows={3}
					/>
				</div>
			</section>
		</div>
	</div>
</form>

<form method="POST" action="?/remove" use:enhance class="mt-4">
	<button class="flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-sale">
		<Trash2 size={15} />
		Delete this post
	</button>
</form>
