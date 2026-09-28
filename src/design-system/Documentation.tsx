import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { Link, useSearchParams } from 'react-router-dom';

// Adding/editing Markdown here is enough; no duplicated document registry.
const documents = import.meta.glob('../../docs/design-system/**/*.md', {query:'?raw',import:'default',eager:true}) as Record<string,string>;
const prefix = '../../docs/design-system/';

export default function Documentation() {
  const [search] = useSearchParams();
  const current = search.get('doc') ?? 'README.md';
  const content = documents[prefix + current];
  const article = useRef<HTMLElement>(null);
  const previous = useRef(current);
  useEffect(() => {
    if (previous.current !== current) {
      article.current?.focus({preventScroll:true});
      article.current?.scrollIntoView({block:'start'});
      previous.current = current;
    }
  },[current]);
  return <section className="ds-documentation" aria-label="디자인 시스템 문서">
    <nav aria-label="문서 탐색"><Link to="/design-system">문서 목차</Link><a href="#ds-examples">실행 예시</a></nav>
    <p className="ds-source">원본: <code>docs/design-system/{current}</code></p>
    <article ref={article} tabIndex={-1}>
      {content ? <Markdown skipHtml components={{
        a: ({href,children}) => {
          if (!href) return <span>{children}</span>;
          if (/^https?:\/\//.test(href)) return <a href={href} rel="noreferrer">{children}</a>;
          const target = new URL(href, 'https://docs.local/docs/design-system/' + current);
          const path = decodeURIComponent(target.pathname).replace('/docs/design-system/','');
          if (documents[prefix + path]) return <Link to={'/design-system?doc='+encodeURIComponent(path)+target.hash}>{children}</Link>;
          // Repo references are not website routes. Do not navigate to a broken /src URL.
          return <span>{children} <code className="ds-repo-reference">{target.pathname.slice(1)}</code></span>;
        },
      }}>{content}</Markdown> : <p role="alert">문서를 찾을 수 없습니다. 문서 목차에서 다시 선택해 주세요.</p>}
    </article>
  </section>;
}
