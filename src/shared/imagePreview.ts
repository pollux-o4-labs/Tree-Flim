function driveImageId(source: string): string | null {
  try {
    const url = new URL(source, 'http://local');
    const id = url.pathname === '/api/public-drive-image'
      ? url.searchParams.get('id')
      : ['drive.google.com', 'drive.usercontent.google.com'].includes(url.hostname)
        ? url.searchParams.get('id') ?? url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]
        : url.hostname === 'lh3.googleusercontent.com'
          ? url.pathname.match(/^\/d\/([\w-]+)/)?.[1] : null;
    return id && /^[\w-]{10,}$/.test(id) ? id : null;
  } catch { return null; }
}
/** Stored links stay intact; display requests use the provider's preview. */
export function imagePreviewUrl(source: string, width = 1200): string {
  const id = driveImageId(source);
  return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${Math.max(240, Math.min(1600, Math.round(width)))}` : source;
}
/** Public Drive originals are loaded directly, without a local proxy. */
export function imageOriginalUrl(source: string): string {
  const id = driveImageId(source);
  return id ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=s0` : source;
}
