import { Text, ContentImage } from '../../content-editor/Content';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { cardTransition } from '../../design-system/motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { shootingCollections } from '../../content/shootingCollections';
import PhotoDeck from '../../design-system/PhotoDeck';
import WeddingPackageGuide from './WeddingPackageGuide';
import InquiryDraft from './InquiryDraft';
import { shootingPrograms } from '../../content/shootingPrograms';
import { weddingPolicies, weddingPackages } from '../../content/weddingPackages';
import { concepts } from '../../content/prototype-fixture';
import { Disclosure } from '../../design-system/components';

export default function ConsultationPanel({ initial }: { initial: string }) {
  const [subject, setSubject] = useState(['촬영 안내', '촬영 일정 문의'].includes(initial) ? '' : initial);
  const [category, setCategory] = useState('');
  const groupId = useId();
  const reduced = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const faq = subject === '자주 묻는 질문';
  const draft = Boolean(subject) && !faq;
  useLayoutEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [subject, category]);
  const chosenPackage = weddingPackages.find(item => subject.endsWith('· ' + item.name));
  const collection = shootingCollections.find(item => item.id === category);
  const seasonal = shootingPrograms[1];
  const title = faq ? subject : draft ? '당신의 이야기를 들려주세요.' : category === 'wedding' ? '우리에게 맞는 시간.' : category === 'seasonal' ? '계절이 머무는 동안.' : '어떤 장면을 남길까요?';
  return <LayoutGroup id={groupId}><div className="consultation-layout" data-mode={draft ? 'draft' : 'guide'}>
    <header className="consultation-heading"><p className="eyebrow"><Text id="ConsultationPanel.001" section="촬영 상담">{"TREE FILM / "}</Text><Text id={`consultation.${faq ? "faq" : draft ? "draft" : "index"}.eyebrow`} section="촬영 상담">{faq ? 'BEFORE THE SHOOT' : draft ? 'YOUR STORY' : 'COLLECTIONS'}</Text></p><h2 ref={heading} tabIndex={-1} id="inquiry-title"><Text id={`consultation.${faq ? "faq" : draft ? "draft" : category || "index"}.title`} section="촬영 상담">{title}</Text></h2>{!subject && <p><Text id={`consultation.${category || "index"}.description`} section="촬영 상담">{category ? '필요한 만큼의 시간, 오래 남을 사진.' : '좋아하는 분위기에서, 우리의 이야기가 시작됩니다.'}</Text></p>}</header>
    <div ref={body} className="consultation-body" >
      {(category || draft) && <button className="panel-back" onClick={() => { if (draft) setSubject(''); else setCategory(''); }}><ArrowLeft size={14} /><Text id={`consultation.back.${draft ? "draft" : category || "index"}`} section="촬영 상담">{draft && category ? '패키지 다시 보기' : category === 'wedding' ? '웨딩 스냅 · 다른 촬영 고르기' : '촬영 둘러보기'}</Text></button>}
      {category && !draft && <motion.button layoutId={'card-' + category} transition={reduced ? { duration:0 } : cardTransition} className="chosen-origin" onClick={() => setCategory('')}><ArrowLeft size={14} aria-hidden="true" /><ContentImage field={`deck.concept.${category}.image`} section="촬영 상담" src={collection?.image} alt="" /><span><Text id={`deck.concept.${category}.title`} section="촬영 상담">{collection?.title}</Text><Text id="ConsultationPanel.003" section="촬영 상담">{" · 다른 촬영 보기"}</Text></span></motion.button>}
      {draft && chosenPackage && <motion.div layoutId={'card-' + chosenPackage.id} transition={reduced ? { duration:0 } : cardTransition} className="chosen-origin"><ContentImage field={`deck.package.${chosenPackage.id}.image`} section="촬영 상담" src={concepts[0].photos[weddingPackages.indexOf(chosenPackage)].src} alt="" /><span><Text id={`deck.package.${chosenPackage.id}.title`} section="촬영 상담">{chosenPackage.name}</Text><small><Text id={`package.${chosenPackage.id}.duration`} section="촬영 상담">{chosenPackage.duration}</Text><Text id="ConsultationPanel.005" section="촬영 상담">{" · 선택한 패키지"}</Text></small></span></motion.div>}
      {faq ? <div className="consultation-faq"><p className="panel-intro"><Text id="ConsultationPanel.006" section="촬영 상담">{"웨딩 스냅 기준 안내입니다. 계절 촬영과 협업 조건은 별도로 확인해 주세요."}</Text></p><div className="package-policies">{weddingPolicies.map((policy, policyIndex) => <Disclosure key={policy.title} title={<Text id={`policy.${policyIndex}.title`} section="촬영 정책">{policy.title}</Text>}><ul>{policy.lines.map((line, lineIndex) => <li key={line}><Text id={`policy.${policyIndex}.line.${lineIndex}`} section="촬영 상담">{line}</Text></li>)}</ul></Disclosure>)}</div></div>
      : draft ? <InquiryDraft key={subject} inquiry={subject} />
      : !category ? <PhotoDeck onChoose={setCategory} cards={shootingCollections} />
      : collection?.kind === 'wedding' ? <WeddingPackageGuide onSelect={setSubject} />
      : <div className="panel-seasonal"><h3><Text id="ConsultationPanel.007" section="촬영 상담">{"꽃이 피고, 눈이 내리는 사이"}</Text></h3><p><Text id={"seasonal.description"} section="촬영 상담">{seasonal.description}</Text></p><p><Text id={"seasonal.detail"} section="촬영 상담">{seasonal.detail}</Text></p><dl><dt><Text id="ConsultationPanel.008" section="촬영 상담">{"모집"}</Text></dt><dd><Text id={"seasonal.timing"} section="촬영 상담">{seasonal.timing}</Text></dd><dt><Text id="ConsultationPanel.009" section="촬영 상담">{"장소"}</Text></dt><dd><Text id={"seasonal.location"} section="촬영 상담">{seasonal.location}</Text></dd><dt><Text id="ConsultationPanel.010" section="촬영 상담">{"비용"}</Text></dt><dd><Text id={"seasonal.price"} section="촬영 상담">{seasonal.price}</Text></dd></dl><button className="news-text-link" onClick={() => setSubject(seasonal.title)}><Text id="ConsultationPanel.011" section="촬영 상담">{"이 계절에 대해 문의 "}</Text><ArrowUpRight size={16} /></button></div>}
    </div>
  </div></LayoutGroup>;
}
