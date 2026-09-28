import { ArrowUpRight, X } from 'lucide-react';
import { ConsultationSession } from './ConsultationSession';
import type { ButtonHTMLAttributes, ReactNode, RefObject } from 'react';

/** Full-width action. Navigation to a URL should use a link instead. */
export function ActionRow({ number, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { number: number }) {
  return <button type="button" {...props}><span className="contact-row-number" aria-hidden="true">{String(number).padStart(2, '0')}</span><span>{children}</span><ArrowUpRight size={19} strokeWidth={1.4} aria-hidden="true" /></button>;
}

/** Native keyboard interaction; multiple answers may remain open. */
export function Disclosure({ title, children }: { title: ReactNode; children: ReactNode }) {
  return <details><summary>{title}</summary>{children}</details>;
}

/** Consultation modal: open with showModal() for native focus containment. */
export function ConsultationModal({ panelRef, labelledBy, children }: { panelRef: RefObject<HTMLDialogElement | null>; labelledBy: string; children: ReactNode }) {
  return <dialog ref={panelRef} className="inquiry-dialog consultation-panel collection-modal" aria-labelledby={labelledBy} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); panelRef.current?.close(); }
  }}>
    <button type="button" className="dialog-close" aria-label="문의 닫기" onClick={() => panelRef.current?.close()}><X aria-hidden="true" /></button>
    <ConsultationSession>{children}</ConsultationSession>
  </dialog>;
}
