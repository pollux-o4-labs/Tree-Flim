import { imagePreviewUrl, imageOriginalUrl } from '../../shared/imagePreview';
import type { Photo } from "../../content/prototype-fixture";

export type PreparedPhoto = Photo & { width: number; height: number };
const dimensions = new Map<string, { width: number; height: number }>();
const pending = new Map<string, Promise<{ width: number; height: number }>>();

export function getPreparedPhoto(photo: Photo): PreparedPhoto | undefined {
  const size = dimensions.get(photo.src);
  return size ? { ...photo, ...size } : undefined;
}

export async function preparePhoto(photo: Photo): Promise<PreparedPhoto> {
  const cached = getPreparedPhoto(photo);
  if (cached) return cached;
  let request = pending.get(photo.src);
  if (!request) {
    request = new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      const finish = () => {
        window.clearTimeout(timer);
        image.onload = image.onerror = null;
      };
      const timer = window.setTimeout(() => { finish(); reject(new Error("Image load timed out")); }, 15000);
      image.onload = async () => {
        try {
          await image.decode();
          const size = { width: image.naturalWidth, height: image.naturalHeight };
          dimensions.set(photo.src, size);
          resolve(size);
        } catch (error) { reject(error); }
        finally { finish(); }
      };
      image.onerror = () => { finish(); reject(new Error("Image load failed")); };
      const original = imageOriginalUrl(photo.src);
      const preview = imagePreviewUrl(photo.src);
      image.onerror = () => {
        if (image.src === preview && preview !== original) {
          image.onerror = () => { finish(); reject(new Error("Image load failed")); };
          image.src = original;
        } else { finish(); reject(new Error("Image load failed")); }
      };
      image.src = preview;
    }).finally(() => pending.delete(photo.src));
    pending.set(photo.src, request);
  }
  return { ...photo, ...await request };
}
