<script lang="ts">
	import { Globe, Send, Phone } from '@lucide/svelte';
	import SiWhatsapp from '@icons-pack/svelte-simple-icons/icons/SiWhatsapp';
	import SiFacebook from '@icons-pack/svelte-simple-icons/icons/SiFacebook';
	import SiInstagram from '@icons-pack/svelte-simple-icons/icons/SiInstagram';

	/** Brand colours here are identity, not theme — a WhatsApp thread must look
	    like WhatsApp at a glance in a mixed list. */
	const map: Record<string, { Icon: any; tint: string; label: string }> = {
		site: { Icon: Globe, tint: 'bg-surface-alt text-ink-muted', label: 'Website' },
		messenger: { Icon: SiFacebook, tint: 'bg-[#0866FF]/10 text-[#0866FF]', label: 'Messenger' },
		instagram: { Icon: SiInstagram, tint: 'bg-[#E1306C]/10 text-[#E1306C]', label: 'Instagram' },
		whatsapp: { Icon: SiWhatsapp, tint: 'bg-[#25D366]/12 text-[#128C7E]', label: 'WhatsApp' },
		telegram: { Icon: Send, tint: 'bg-[#229ED9]/10 text-[#229ED9]', label: 'Telegram' },
		sms: { Icon: Phone, tint: 'bg-primary-soft text-primary', label: 'SMS' }
	};

	let { channel, size = 'sm' }: { channel: string; size?: 'sm' | 'md' } = $props();

	const entry = $derived(map[channel] ?? map.site);
</script>

<span
	class="grid shrink-0 place-items-center rounded-lg {entry.tint} {size === 'md'
		? 'size-9'
		: 'size-7'}"
	title={entry.label}
	aria-label={entry.label}
>
	<entry.Icon size={size === 'md' ? 17 : 14} />
</span>
