import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './archive-header.css';

type Props = {
  backHref: string;
  backLabel: string;
  title: string;
  count?: number;
  status: string;
  dirty?: boolean;
  children?: ReactNode;
};

/** Common navigation, identity and action hierarchy for archive editing. */
export default function ArchiveHeader({ backHref, backLabel, title, count, status, dirty, children }: Props) {
  return <header className="editor-header">
    <Link className="editor-header-back" to={backHref} aria-label={backLabel}>
      <ArrowLeft size={17} /><span>{backLabel}</span>
    </Link>
    <div className="editor-header-identity"><small>ARCHIVE</small><strong>{title}</strong>
      {count !== undefined && <em>{count}장</em>}
    </div>
    <div className="editor-header-actions">
      <span className={`editor-header-status${dirty ? ' is-dirty' : ''}`} role="status">{status}</span>
      {children}
    </div>
  </header>;
}
