/**
 * File storage. One module, two drivers, one public API — nothing else in the
 * app knows or cares where a file physically lives.
 *
 *   STORAGE_DRIVER=local  (default) writes to static/uploads. Fine for dev and
 *                         for a single VPS with a persistent disk.
 *   STORAGE_DRIVER=s3     any S3-compatible bucket: Cloudflare R2, MinIO,
 *                         DigitalOcean Spaces, Wasabi, AWS S3.
 *
 * Serverless hosts (Vercel) have an ephemeral filesystem, so `local` there
 * loses every upload on redeploy — use s3.
 *
 * Signing is done by aws4fetch rather than by hand: SigV4 is a security
 * boundary and not somewhere to save a dependency.
 */
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import { env } from '$env/dynamic/private';

export const MAX_BYTES = Number(env.UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024);

export const ALLOWED = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/avif',
	'image/svg+xml'
] as const;

const EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/svg+xml': 'svg'
};

const LOCAL_DIR = 'static/uploads';
const LOCAL_PREFIX = '/uploads';

const driver = () => (env.STORAGE_DRIVER === 's3' ? 's3' : 'local');

/* ── pure helpers (unit-tested) ──────────────────────────────────────── */

export function extensionFor(mime: string): string | null {
	return EXT[mime] ?? null;
}

/** Builds the object key. Dated folders keep buckets browsable at volume. */
export function buildKey(mime: string, now = new Date()): string {
	const ext = extensionFor(mime);
	if (!ext) throw new Error(`${mime || 'That file type'} is not an image.`);
	const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
	return `uploads/${yyyymm}/${randomUUID()}.${ext}`;
}

/** Reverses a stored public URL back to its object key, or null if not ours. */
export function keyFromUrl(url: string, base: string): string | null {
	const clean = (s: string) => s.replace(/\/+$/, '');
	if (!url.startsWith(clean(base) + '/')) return null;
	return url.slice(clean(base).length + 1);
}

export function validate(file: { type: string; size: number }): string | null {
	if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number]))
		return `${file.type || 'That file type'} is not an image.`;
	if (file.size > MAX_BYTES)
		return `Images must be under ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`;
	return null;
}

/* ── s3 ──────────────────────────────────────────────────────────────── */

function s3Config() {
	const endpoint = env.S3_ENDPOINT?.replace(/\/+$/, '');
	const bucket = env.S3_BUCKET;
	const accessKeyId = env.S3_ACCESS_KEY_ID;
	const secretAccessKey = env.S3_SECRET_ACCESS_KEY;

	if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
		throw new Error(
			'STORAGE_DRIVER=s3 needs S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.'
		);

	// Path style by default: R2, MinIO and Spaces all accept it. Set
	// S3_VIRTUAL_HOST=true for AWS-style bucket-in-hostname addressing.
	const objectBase = env.S3_VIRTUAL_HOST === 'true' ? endpoint : `${endpoint}/${bucket}`;

	return {
		client: new AwsClient({
			accessKeyId,
			secretAccessKey,
			region: env.S3_REGION || 'auto',
			service: 's3'
		}),
		objectBase,
		/** Where browsers read from: a CDN/public bucket domain, else the bucket itself. */
		publicBase: (env.S3_PUBLIC_URL || objectBase).replace(/\/+$/, '')
	};
}

/* ── public API ──────────────────────────────────────────────────────── */

export async function saveUpload(file: File): Promise<{ url: string; size: number }> {
	const problem = validate(file);
	if (problem) throw new Error(problem);

	const key = buildKey(file.type);
	const body = Buffer.from(await file.arrayBuffer());

	if (driver() === 'local') {
		const name = key.split('/').pop()!;
		await mkdir(LOCAL_DIR, { recursive: true });
		await writeFile(join(LOCAL_DIR, name), body);
		return { url: `${LOCAL_PREFIX}/${name}`, size: file.size };
	}

	const { client, objectBase, publicBase } = s3Config();
	const res = await client.fetch(`${objectBase}/${key}`, {
		method: 'PUT',
		body,
		headers: { 'content-type': file.type, 'cache-control': 'public, max-age=31536000, immutable' }
	});
	if (!res.ok) throw new Error(`Upload failed (${res.status}). Check the bucket and credentials.`);

	return { url: `${publicBase}/${key}`, size: file.size };
}

export async function deleteUpload(url: string): Promise<void> {
	if (driver() === 'local') {
		const key = keyFromUrl(url, LOCAL_PREFIX);
		if (!key) return; // not ours — nothing to unlink
		await unlink(join(LOCAL_DIR, key)).catch(() => {});
		return;
	}

	const { client, objectBase, publicBase } = s3Config();
	const key = keyFromUrl(url, publicBase);
	if (!key) return;
	await client.fetch(`${objectBase}/${key}`, { method: 'DELETE' }).catch(() => {});
}

/** Shown in admin settings so staff can see where files are going. */
export const storageInfo = () => ({
	driver: driver(),
	target: driver() === 's3' ? (env.S3_BUCKET ?? 'not configured') : LOCAL_DIR,
	maxBytes: MAX_BYTES
});
