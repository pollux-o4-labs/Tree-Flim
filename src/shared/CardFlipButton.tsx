import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import './card-flip-button.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode };
export default function CardFlipButton({ children, className = '', ...props }: Props) {
  return <button type="button" {...props} className={`card-flip-control ${className}`}>
    <RotateCw size={16} aria-hidden="true" />{children}
  </button>;
}
