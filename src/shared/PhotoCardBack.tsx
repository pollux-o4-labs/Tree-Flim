import type { ReactNode } from 'react';
import './photo-card-back.css';

type Props = {
  className: string;
  title: ReactNode;
  category: ReactNode;
  signature: ReactNode;
  eyebrow?: ReactNode;
  collectionLabel?: ReactNode;
  locationLabel?: ReactNode;
  location?: ReactNode;
  noteLabel?: ReactNode;
  note?: ReactNode;
  footer?: ReactNode;
  ariaHidden?: boolean;
};

export default function PhotoCardBack({
  className, title, category, signature, eyebrow = 'ON THE OTHER SIDE',
  collectionLabel = 'COLLECTION', locationLabel = 'LOCATION / DATE',
  location, noteLabel = 'NOTE', note, footer, ariaHidden,
}: Props) {
  return <div className={`photo-card-back ui-scrollbar ${className}`} aria-hidden={ariaHidden}>
    <div className="photo-card-back-content">
    <p className="eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <dl>
      <dt>{collectionLabel}</dt><dd>{category}</dd>
      {location && <><dt>{locationLabel}</dt><dd>{location}</dd></>}
      {note && <><dt>{noteLabel}</dt><dd>{note}</dd></>}
    </dl>
    <span className="signature">{signature}</span>
    {footer && <small>{footer}</small>}
    </div>
  </div>;
}
