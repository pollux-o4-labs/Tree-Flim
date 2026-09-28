import { lazy, Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TotalPrograms from '../prototypes/proto-total/TotalPrograms';
import ConsultationPanel from '../prototypes/proto-total/ConsultationPanel';
import { ActionRow, Disclosure, ConsultationModal } from './components';
import PhotoDeck from './PhotoDeck';
import { concepts } from '../content/prototype-fixture';
import '../prototypes/proto-total/total.css';
import '../prototypes/proto-total/total-theme.css';
import '../prototypes/proto-total/total-news.css';
import './preview.css';
import './collection-modal.css';
import './card-stage.css';
import './mobile-deck.css';
import './card-scene.css';

const Documentation = lazy(() => import('./Documentation'));

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);
  const [example, setExample] = useState({ label: '촬영 안내', version: 0 });
  const panel = useRef<HTMLDialogElement>(null);
  const open = (label: string) => { setExample(value => ({ label, version: value.version + 1 })); panel.current?.showModal(); };
  return <div className="prototype-total ds-preview" data-theme={dark ? 'dark' : 'light'}>
    <main>
      <nav><Link to="/prototype/total">← 사이트로 돌아가기</Link><button onClick={() => setDark(value => !value)} aria-pressed={dark}>다크 모드</button></nav>
      <header><p className="eyebrow">TREE FILM / DESIGN SYSTEM</p><h1>디자인 시스템</h1></header>
      <Suspense fallback={<p role="status">문서를 불러오는 중입니다.</p>}><Documentation /></Suspense>
      <section id="ds-examples"><h2>01 · 색상과 글꼴</h2><div className="ds-swatches">{['paper', 'ink', 'subtle', 'section', 'control'].map(name => <div key={name}><span style={{ background: `var(--total-${name})` }} /><code>--total-{name}</code></div>)}</div><p className="ds-serif">Noto Serif KR · 다음 장면의 주인공은, 당신이면 좋겠습니다.</p><p className="ds-display">Cormorant Garamond · A moment to keep.</p><p>DM Sans · 본문과 조작 안내 / 0123456789</p></section>
      <section id="ds-components"><h2>02 · 실제 문의 메뉴</h2><TotalPrograms onInquiry={open} /><div className="contact-rows"><ActionRow number={4} disabled>비활성 예시 · 준비 중</ActionRow></div></section>
      <section className="consultation-faq"><h2>03 · 접기와 펼치기</h2><div className="package-policies"><Disclosure title="키보드로도 조작할 수 있나요?"><p>Tab으로 이동하고 Enter 또는 Space로 펼칩니다. 답변 여러 개를 동시에 열 수 있습니다.</p></Disclosure><Disclosure title="모달은 어떻게 닫나요?"><p>닫기 버튼 또는 패널 안에서 Escape를 누릅니다. 닫으면 열었던 버튼으로 포커스가 돌아갑니다.</p></Disclosure></div></section>
      <section className="deck-scale-demo"><h2>05 · 5개 카드 확장 검수</h2><p>탐색 검사용 샘플이며 실제 판매 콘셉트가 아닙니다.</p><PhotoDeck cards={Array.from({ length: 5 }, (_, index) => ({ id: 'demo-' + index, title: '샘플 ' + (index + 1), image: concepts[0].photos[index % concepts[0].photos.length].src }))} onChoose={() => {}} /></section>
    </main>
    <ConsultationModal panelRef={panel} labelledBy="inquiry-title"><ConsultationPanel key={example.version} initial={example.label} /></ConsultationModal>
  </div>;
}
