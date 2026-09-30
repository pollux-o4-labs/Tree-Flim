import { useState, type ImgHTMLAttributes } from 'react';
import { imagePreviewUrl, imageOriginalUrl } from './imagePreview';

export default function PreviewImage({ src = '', previewWidth = 1200, onError, ...props }: ImgHTMLAttributes<HTMLImageElement> & { previewWidth?: number | null }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const original = imageOriginalUrl(src);
  const preview = previewWidth === null ? original : imagePreviewUrl(src, previewWidth);
  const display = failedSource === preview ? original : preview;
  return <img {...props} src={display} onError={event => {
    if (display !== original) setFailedSource(preview);
    else onError?.(event);
  }} />;
}
