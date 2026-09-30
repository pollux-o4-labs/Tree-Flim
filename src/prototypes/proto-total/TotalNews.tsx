import { Text, ContentImage, Attachment } from '../../content-editor/Content';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { usePublishedNews, type NewsPost } from '../../content/news';

type Navigation = { onOpen: (id: string) => void };
const categoryLabels: Record<string, string> = { STUDIO: '스튜디오', SEASONAL: '계절 촬영', EXHIBITION: '전시', STORY: '촬영 이야기' };
function MarkdownInline({ value }: { value: string }) {
  const parts = value.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return <>{parts.map((part, index): ReactNode => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  })}</>;
}
function MarkdownBlock({ value }: { value: string }) {
  const heading = value.match(/^(#{1,3})\s+(.+)$/);
  const list = value.split('\n').filter(line => /^[-*]\s+/.test(line));
  if (heading) { const Tag = `h${Math.min(4, heading[1].length + 1)}` as 'h2' | 'h3' | 'h4'; return <Tag><MarkdownInline value={heading[2]} /></Tag>; }
  if (list.length && list.length === value.split('\n').length) return <ul>{list.map((line, index) => <li key={index}><MarkdownInline value={line.replace(/^[-*]\s+/, '')} /></li>)}</ul>;
  return <p><MarkdownInline value={value} /></p>;
}
function NewsCard({ post, onOpen }: Navigation & { post: NewsPost }) {
  return <button className="news-card" onClick={() => onOpen(post.id)}>
    <div className="news-card-image"><ContentImage field={`news.${post.id}.image`} section="소식" src={post.image} alt={post.imageAlt} loading="lazy" /></div>
    <div className="news-meta"><span><Text id={`news.category.${post.category}`} section="소식">{categoryLabels[post.category]}</Text></span><span><Text id={`news.${post.id}.date`} section="소식">{post.publishedAt ?? (post.id === 'dan-soon-hyang' || post.id === 'first-exhibition' ? '지난 기록' : '촬영 안내')}</Text></span></div>
    <h3><Text id={`news.${post.id}.title`} section="소식">{post.title}</Text><ArrowUpRight size={19} /></h3><p><Text id={`news.${post.id}.summary`} section="소식">{post.summary}</Text></p>
  </button>;
}

export function TotalNewsPreview({ onOpen }: Navigation) {
  const posts = usePublishedNews();
  return <section className="news-preview" id="news" aria-labelledby="news-heading">
    <div className="news-section-heading"><div><p className="eyebrow"><Text id="TotalNews.001" section="소식">{"FROM THE STUDIO"}</Text></p><h2 id="news-heading"><Text id="TotalNews.002" section="소식">{"계속되는 기록"}</Text></h2><p><Text id="TotalNews.003" section="소식">{"촬영과 계절, 그 사이의 이야기."}</Text></p></div><button className="news-text-link" onClick={() => onOpen('all')}><Text id="TotalNews.004" section="소식">{"모든 소식 "}</Text><ArrowUpRight size={18} /></button></div>
    <div className="news-grid">{posts.slice(0, 3).map(post => <NewsCard key={post.id} post={post} onOpen={onOpen} />)}</div>
  </section>;
}

export default function TotalNews({ selected, onOpen, onClose, onInquiry }: Navigation & { selected: string; onClose: () => void; onInquiry: (label: string) => void }) {
  const [filter, setFilter] = useState('전체');
  const allPosts = usePublishedNews();
  const post = allPosts.find(item => item.id === selected);
  const filters = ['전체', ...new Set(allPosts.map(item => item.category))];
  const posts = allPosts.filter(item => filter === '전체' || item.category === filter);
  return <main className="news-page" id="news-page" tabIndex={-1}>
    <button className="news-text-link news-back" onClick={post || selected !== 'all' ? () => onOpen('all') : onClose}><ArrowLeft size={16} /><Text id={`news.back.${post || selected !== "all" ? "list" : "home"}`} section="소식">{post || selected !== 'all' ? '모든 소식' : '메인으로 돌아가기'}</Text></button>
    {post ? <article className="news-article">
      <header><p className="eyebrow"><Text id={`news.category.${post.category}`} section="소식">{categoryLabels[post.category]}</Text><Text id={`news.${post.id}.archiveNote`} section="소식">{post.id === 'dan-soon-hyang' || post.id === 'first-exhibition' ? ' · 지난 기록' : ''}</Text></p><h1><Text id={`news.${post.id}.title`} section="소식">{post.title}</Text></h1><p className="news-deck"><Text id={`news.${post.id}.subtitle`} section="소식">{post.subtitle}</Text></p>{post.note && <p className="news-detail-notice"><Text id={`news.${post.id}.note`} section="소식">{post.note}</Text></p>}</header>
      <ContentImage field={`news.${post.id}.image`} section="소식" className="news-article-image" src={post.image} alt={post.imageAlt} />
      <Attachment id={`news.${post.id}.attachment`} section="소식 첨부" />
      <div className="news-article-body"><aside><Text id="TotalNews.005" section="소식">{"FROM THE ARTIST"}</Text><span><Text id="TotalNews.006" section="소식">{"상목의 기록"}</Text></span></aside><div>{post.paragraphs.map((paragraph, paragraphIndex) => <MarkdownBlock key={`${post.id}-${paragraphIndex}`} value={paragraph} />)}
      {post.id === 'seasonal-profile' && <div className="news-seasons" aria-label="계절별 촬영 참고 일정">{[['03', '벚꽃'], ['05', '장미'], ['06', '능소화'], ['08', '배롱나무'], ['12', '눈']].map(([month, name]) => <div key={month}><span><Text id={`news.season.${month}.month`} section="계절 안내">{month}</Text><small><Text id="TotalNews.007" section="소식">{"월"}</Text></small></span><p><Text id={`news.season.${month}.name`} section="계절 안내">{name}</Text></p></div>)}</div>}
      {post.id !== 'first-exhibition' && <button className="news-text-link" onClick={() => onInquiry(post.id === 'seasonal-profile' ? '계절 개인 스냅' : post.id === 'wedding-couple' ? '웨딩 스냅' : '단순향 협업 문의')}><Text id={`news.${post.id}.inquiry`} section="소식">{post.id === 'dan-soon-hyang' ? '현재 협업 여부 문의 준비' : '이 촬영 문의 준비'}</Text> <ArrowUpRight size={18} /></button>}</div></div>
      <div className="news-article-end"><span><Text id="TotalNews.008" section="소식">{"계속되는 기록"}</Text></span><button className="news-text-link" onClick={() => onOpen('all')}><Text id="TotalNews.009" section="소식">{"소식 목록으로 "}</Text><ArrowUpRight size={18} /></button></div>
    </article> : selected !== 'all' ? <div className="news-intro"><h1><Text id="TotalNews.010" section="소식">{"기록을 찾을 수 없습니다."}</Text></h1><button className="news-text-link" onClick={() => onOpen('all')}><Text id="TotalNews.011" section="소식">{"소식 목록 보기 "}</Text><ArrowUpRight size={18} /></button></div> : <>
      <header className="news-intro"><div><p className="eyebrow"><Text id="TotalNews.012" section="소식">{"TREE FILM / JOURNAL"}</Text></p><h1><Text id="TotalNews.013" section="소식">{"계속되는 기록"}</Text></h1></div><p className="news-intro-note"><Text id="TotalNews.014" section="소식">{"촬영과 계절,"}</Text><br /><Text id="TotalNews.015" section="소식">{"그 사이의 이야기."}</Text></p></header>
      <div className="news-toolbar"><div className="news-filters" aria-label="소식 분류">{filters.map(item => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}><Text id={`news.category.${item === "전체" ? "all" : item}`} section="소식">{categoryLabels[item] ?? item}</Text></button>)}</div><p className="news-result" aria-live="polite">{posts.length}<Text id="TotalNews.016" section="소식">{"개의 기록"}</Text></p></div>
      <div className="news-grid news-archive-grid">{posts.map(post => <NewsCard key={post.id} post={post} onOpen={onOpen} />)}</div>
    </>}
  </main>;
}
