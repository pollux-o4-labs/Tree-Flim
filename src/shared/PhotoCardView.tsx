import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import ImageLoadStatus from './ImageLoadStatus';
import CardFlipButton from './CardFlipButton';
import './photo-card-view.css';

type Props = { front: ReactNode; back: ReactNode; flipped: boolean; onFlip: () => void; eyebrow?: ReactNode; flipLabel?: ReactNode; children?: ReactNode };
export default function PhotoCardView({ front, back, flipped, onFlip, eyebrow = 'A MOMENT TO KEEP', flipLabel, children }: Props) {
  const frontRef = useRef<HTMLDivElement>(null);
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  useLayoutEffect(() => {
    const image = frontRef.current?.querySelector('img');
    setImageStatus(!image ? 'ready' : image.complete ? image.naturalWidth > 0 ? 'ready' : 'failed' : 'loading');
  }, [front]);
  return <div className="photo-card-view">
    <p className="eyebrow">{eyebrow}</p>
    <div className="card-perspective" onPointerMove={event => {
      if (event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--rx', ((event.clientY - rect.top) / rect.height - .5) * -12 + 'deg');
      event.currentTarget.style.setProperty('--ry', ((event.clientX - rect.left) / rect.width - .5) * 12 + 'deg');
    }} onPointerLeave={event => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg'); }}>
      <div className={`photo-card${flipped ? ' is-flipped' : ''}`}>
        <div ref={frontRef} className="card-front" aria-hidden={flipped} inert={flipped}
          aria-busy={imageStatus === 'loading'}
          onLoadCapture={event => { if (event.target instanceof HTMLImageElement) setImageStatus('ready'); }}
          onErrorCapture={event => { if (event.target instanceof HTMLImageElement) setImageStatus('failed'); }}>
          {front}
          {imageStatus !== 'ready' && <ImageLoadStatus failed={imageStatus === 'failed'} />}
        </div>
        {back}
      </div>
    </div>
    <CardFlipButton className="flip-button" onClick={onFlip}>{flipLabel ?? (flipped ? '사진으로 돌아가기' : '뒷면의 기록 읽기')}</CardFlipButton>
    {children}
  </div>;
}
