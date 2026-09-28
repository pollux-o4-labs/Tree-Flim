import { Text, ContentImage } from '../content-editor/Content';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { cardTransition } from './motion';
import GestureHint from './GestureHint';
import { useConsultationValue } from './ConsultationSession';

export type PhotoChoice = { id: string; title: string; image: string; story?: string; price?: string; condition?: string };

export default function PhotoDeck({ cards, onChoose, action = '이 촬영 선택', kind = 'concept' }: { cards: PhotoChoice[]; onChoose: (id: string) => void; action?: string; kind?: 'concept' | 'package' }) {
  const [selected, setSelected] = useConsultationValue('deck:' + cards.map(item => item.id).join('-'), cards[0]?.id ?? '');
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const [hintDismissed, setHintDismissed] = useState(false);
  const shift = useMotionValue(0);
  const movement = useRef<{ stop: () => void } | null>(null);
  useEffect(() => () => movement.current?.stop(), []);
  const stopHint = () => setHintDismissed(true);
  const settle = () => { movement.current?.stop(); if (reduced) shift.set(0); else movement.current = animate(shift, 0, {duration:.22,ease:[.22,1,.36,1]}); };
  const pointer = useRef<{ id:number; x:number; y:number; origin:number; axis:'x'|'y'|null } | null>(null);
  const dragged = useRef(false);
  const detailId = useId();
  const detail = useRef<HTMLDivElement>(null);
  const cardButtons = useRef(new Map<string, HTMLButtonElement>());
  useLayoutEffect(() => {
    if (expanded) detail.current?.scrollIntoView({ block:'nearest', behavior:reduced ? 'instant' : 'smooth' });
  }, [expanded, reduced]);
  const index = Math.max(0, cards.findIndex(item => item.id === selected));
  if (!cards.length) return <p><Text id="PhotoDeck.001" section="촬영 카드">{"준비 중인 촬영입니다."}</Text></p>;
  const card = cards[index];
  const choose = (position: number) => { stopHint(); settle(); setSelected(cards[(position + cards.length) % cards.length].id); setExpanded(false); };
  const activate = () => kind === 'concept' ? onChoose(card.id) : setExpanded(value => !value);
  return <section className="card-scene" onPointerDownCapture={stopHint} onKeyDownCapture={() => { stopHint(); settle(); }} aria-label={kind === 'concept' ? '촬영 콘셉트 둘러보기' : '패키지 둘러보기'}>
    <div className="scene-stage">
    <div className="scene-stack" role="group" aria-roledescription="캐러셀" aria-label="사진 카드"
      onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length; choose(next); cardButtons.current.get(cards[next].id)?.focus({preventScroll:true}); } }}
      onPointerDown={event => {
        if (event.button !== 0 || !event.isPrimary || pointer.current) return;
        movement.current?.stop();
        pointer.current = {id:event.pointerId,x:event.clientX,y:event.clientY,origin:shift.get(),axis:null};
        dragged.current = false;
      }}
      onPointerCancel={() => { pointer.current = null; settle(); }}
      onLostPointerCapture={event => { if (event.target === event.currentTarget && pointer.current) { pointer.current = null; settle(); } }}
      onPointerMove={event => {
        const start = pointer.current;
        if (!start || event.pointerId !== start.id || cards.length < 2) return;
        const dx = event.clientX-start.x, dy = event.clientY-start.y;
        if (!start.axis && Math.max(Math.abs(dx),Math.abs(dy)) > 10) {
          start.axis = Math.abs(dx) > Math.abs(dy)*1.2 ? 'x' : 'y';
          dragged.current = true;
          if (start.axis === 'x') event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (start.axis === 'x') {
          const value = start.origin+dx*.65;
          shift.set(Math.max(-72,Math.min(72,value)));
        }
      }}
      onPointerUp={event => {
        const start = pointer.current;
        if (!start || event.pointerId !== start.id) return;
        pointer.current = null;
        const dx = event.clientX-start.x;
        const threshold = Math.max(48,Math.min(72,event.currentTarget.clientWidth*.12));
        if (start.axis === 'x' && Math.abs(dx) >= threshold && cards.length > 1) choose(index+(dx < 0 ? 1 : -1));
        else settle();
      }}>
      <motion.div className="scene-hand" style={{x:shift}}>
      {cards.map((item, position) => {
        let offset = position - index;
        if (offset > cards.length / 2) offset -= cards.length;
        if (offset < -cards.length / 2) offset += cards.length;
        const distance = Math.abs(offset);
        return <motion.button layoutId={'card-' + item.id} key={item.id} type="button" className="scene-card"
          ref={element => { if (element) cardButtons.current.set(item.id,element); else cardButtons.current.delete(item.id); }}
          initial={reduced ? false : { opacity:0, y:16 }}
          animate={{ opacity:distance > 2 ? 0 : 1, x:offset * 25 + '%', y:distance * 12, rotate:offset * 8, scale:1 - Math.min(distance, 3) * .12 }}
          transition={reduced ? { duration:0 } : {duration:.28,ease:[.22,1,.36,1]}}
          style={{zIndex:cards.length - distance, pointerEvents:distance > 2 ? 'none' : 'auto'}}
          aria-label={item.title} aria-pressed={position === index} aria-hidden={distance > 2 ? true : undefined} tabIndex={position === index ? 0 : -1}
          onClick={() => { if (dragged.current) { dragged.current = false; return; } if (position === index) activate(); else choose(position); }}>
          <ContentImage field={`deck.${kind}.${item.id}.image`} section="촬영 카드" src={item.image} alt="" draggable={false} />
        </motion.button>;
      })}
      </motion.div>
    </div>
    <GestureHint kind={kind} dismissed={hintDismissed || cards.length < 2} />
    <div className="scene-controls"><button type="button" aria-label="이전 카드" disabled={cards.length < 2} onClick={() => choose(index - 1)}><Text id="PhotoDeck.002" section="촬영 카드">{"‹"}</Text></button><button type="button" aria-label="다음 카드" disabled={cards.length < 2} onClick={() => choose(index + 1)}><Text id="PhotoDeck.003" section="촬영 카드">{"›"}</Text></button></div>
    </div>
    <div className="scene-caption">
      <span className="scene-count" role="status" aria-label={`${cards.length}개 중 ${index + 1}번째, ${card.title}`}>{String(index + 1).padStart(2, '0')}<Text id="PhotoDeck.004" section="촬영 카드">{" / "}</Text>{String(cards.length).padStart(2, '0')}</span>
      <button type="button" className="scene-title" aria-label={kind === 'concept' ? action : '패키지 자세히 보기'} aria-controls={kind === 'package' && expanded ? detailId : undefined} aria-expanded={kind === 'package' ? expanded : undefined} onClick={activate}><Text id={`deck.${kind}.${card.id}.title`} section="촬영 카드">{card.title}</Text>{kind === 'package' && <span aria-hidden="true">{expanded ? '−' : '+'}</span>}</button>
      {kind === 'package' && <><p className="scene-summary"><Text id={`deck.${kind}.${card.id}.story`} section="촬영 카드">{card.story}</Text></p><p className="scene-price"><Text id={`deck.${kind}.${card.id}.price`} section="촬영 카드">{card.price}</Text></p></>}
    </div>
    {kind === 'package' && expanded && <motion.div ref={detail} id={detailId} className="scene-detail" initial={reduced ? false : {opacity:0,y:8}} animate={{opacity:1,y:0}} transition={reduced ? {duration:0} : cardTransition}><p><Text id={`deck.${kind}.${card.id}.condition`} section="촬영 카드">{card.condition}</Text></p><button type="button" className="scene-confirm" onClick={() => onChoose(card.id)}><Text id={`deck.${kind}.action`} section="촬영 카드">{action}</Text><Text id="PhotoDeck.005" section="촬영 카드">{" ↗"}</Text></button></motion.div>}
  </section>;
}
