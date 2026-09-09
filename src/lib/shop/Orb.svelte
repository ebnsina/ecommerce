<script lang="ts">
	/**
	 * The assistant's mark: a small fluid orb.
	 *
	 * Not the WebGL kind — that is somebody else's shader, and a storefront on
	 * a mid-range Android over patchy data should not pay for a canvas to draw
	 * a 20px dot. This is layered radial gradients rotating at different rates
	 * behind a sphere-shaped mask, which reads as the same thing at the size it
	 * is actually used.
	 *
	 * It carries no meaning on its own — every place it appears has a word
	 * beside it — so it is hidden from screen readers, and it stops moving for
	 * anyone who asked motion to stop.
	 */
	let { size = 20, class: klass = '' }: { size?: number; class?: string } = $props();
</script>

<span
	class="orb {klass}"
	style="--orb-size: {size}px"
	aria-hidden="true"
	data-testid="assistant-orb"
></span>

<style>
	.orb {
		position: relative;
		display: inline-block;
		width: var(--orb-size);
		height: var(--orb-size);
		border-radius: 9999px;
		overflow: hidden;
		background: radial-gradient(circle at 32% 28%, #ffffff 0%, #cfe3fb 38%, #1565c0 100%);
		/* The rim: light gathers at the top edge and the ground bounces back up
		   into the bottom, which is what stops a circle reading as a flat dot. */
		box-shadow:
			inset 0 1px 1px rgb(255 255 255 / 0.9),
			inset 0 -2px 3px rgb(13 71 161 / 0.55),
			0 1px 2px rgb(15 23 42 / 0.2);
	}

	/* Two clouds turning at different speeds and in opposite directions. Two is
	   enough for the motion to never repeat visibly; three costs more paint than
	   it buys. */
	.orb::before,
	.orb::after {
		content: '';
		position: absolute;
		inset: -35%;
		border-radius: 9999px;
	}

	.orb::before {
		background: radial-gradient(closest-side, rgb(255 255 255 / 0.95), transparent 70%);
		transform-origin: 60% 55%;
		animation: orb-a 7s linear infinite;
	}

	.orb::after {
		background: radial-gradient(closest-side, rgb(13 71 161 / 0.85), transparent 68%);
		transform-origin: 38% 62%;
		animation: orb-b 11s linear infinite reverse;
	}

	@keyframes orb-a {
		from {
			transform: rotate(0deg) translate(8%, -6%);
		}
		to {
			transform: rotate(360deg) translate(8%, -6%);
		}
	}

	@keyframes orb-b {
		from {
			transform: rotate(0deg) translate(-10%, 8%);
		}
		to {
			transform: rotate(360deg) translate(-10%, 8%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orb::before,
		.orb::after {
			animation: none;
		}
	}
</style>
