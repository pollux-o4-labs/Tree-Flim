import { LoaderCircle, ImageOff } from 'lucide-react';
import './image-load-status.css';

export default function ImageLoadStatus({ failed = false }: { failed?: boolean }) {
  return <div className="image-load-status" role="status" aria-live="polite">
    {failed ? <ImageOff size={20} strokeWidth={1.4} aria-hidden="true" /> : <LoaderCircle className="image-load-spinner" size={20} strokeWidth={1.4} aria-hidden="true" />}
    <span>{failed ? '사진을 불러오지 못했습니다' : '사진을 불러오는 중'}</span>
    <small>{failed ? '카드를 닫고 다시 열어주세요.' : '원본 사진을 준비하고 있습니다.'}</small>
  </div>;
}
