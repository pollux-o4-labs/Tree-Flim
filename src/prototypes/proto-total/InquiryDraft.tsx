import { Text, ContentTextarea, useContentValue, useContentEditing } from '../../content-editor/Content';
import { useState } from 'react';
import { useConsultationValue } from '../../design-system/ConsultationSession';
import { photographyContact, shootingPrograms } from '../../content/shootingPrograms';
import { formatWon, weddingPackages } from '../../content/weddingPackages';

export default function InquiryDraft({ inquiry }: { inquiry: string }) {
  const content = useContentValue();
  const editing = useContentEditing();
  const program = shootingPrograms.find(item => inquiry.startsWith(item.title));
  const programTitleId = program?.id === 'wedding-couple' ? 'deck.concept.wedding.title' : program?.id === 'seasonal-profile' ? 'deck.concept.seasonal.title' : 'inquiry.general.title';
  const [packageId, setPackageId] = useState(weddingPackages.find(item => inquiry.endsWith(`· ${item.name}`))?.id ?? '');
  const selected = weddingPackages.find(item => item.id === packageId);
  const [message, setMessage] = useConsultationValue('message:' + (program?.id ?? 'general'), '');
  const [status, setStatus] = useState('');
  return <div className="inquiry-draft">
    <div className="inquiry-editor">
    <div className="inquiry-subject"><span><Text id={programTitleId} section="문의">{program?.title ?? inquiry}</Text></span>{selected && <strong><Text id={`deck.package.${selected.id}.title`} section="문의">{selected.name}</Text><small><Text id={`deck.package.${selected.id}.price`} section="문의">{formatWon(selected.price)}</Text></small></strong>}</div>
    {program?.id === 'wedding-couple' && <div className="inquiry-package-options" aria-label="촬영 상품">{[{id:'',name:'상담 후 결정'},...weddingPackages].map(item => <button key={item.id} aria-pressed={packageId === item.id} onClick={() => { setPackageId(item.id); setStatus(''); }}><Text id={`deck.package.${item.id || "undecided"}.title`} section="문의">{item.name}</Text></button>)}</div>}
    {selected && <p className="inquiry-explanation"><Text id="InquiryDraft.001" section="문의">{"SNS·후기 동의 시 "}</Text><Text id={`package.${selected.id}.discount`} section="문의">{formatWon(selected.discountedPrice)}</Text><Text id="InquiryDraft.002" section="문의">{" · 추가 비용 별도"}</Text></p>}
    <label htmlFor="inquiry-message"><Text id="InquiryDraft.003" section="문의">{"남기고 싶은 이야기"}</Text><ContentTextarea field="inquiry.placeholder" id="inquiry-message" rows={3} placeholder={'원하는 날짜와 장소, 궁금한 점을\n편하게 적어주세요.'} value={message} onChange={event => { setMessage(event.target.value); setStatus(''); }} /></label>
    </div>
    <footer className="inquiry-action-bar">
    <button className="submit-button" disabled={!editing && !message.trim()} onClick={async () => {
      if (editing || !message.trim()) return;
      try { await navigator.clipboard.writeText(`${program?.title ?? inquiry}${selected ? ` · ${content(`deck.package.${selected.id}.title`, selected.name)} (기본 ${content(`deck.package.${selected.id}.price`, formatWon(selected.price))}, SNS·후기 동의 시 ${content(`package.${selected.id}.discount`, formatWon(selected.discountedPrice))}, 추가 비용 별도)` : ''}\n${message}`); setStatus('선택한 촬영과 문의 내용을 복사했습니다.'); }
      catch { setStatus('복사하지 못했습니다. 위 내용을 직접 복사해 주세요.'); }
    }}><Text id="InquiryDraft.004" section="문의">{"문의 내용 복사 "}</Text><span aria-hidden="true"><Text id="InquiryDraft.005" section="문의">{"↗"}</Text></span></button>
    <p className="inquiry-explanation"><Text id="InquiryDraft.006" section="문의">{"내용 복사만 가능합니다. 실제 접수·예약은 준비 중입니다."}</Text></p>
    {photographyContact.instagramUrl && <a className="news-text-link" href={photographyContact.instagramUrl} target="_blank" rel="noreferrer"><Text id="InquiryDraft.007" section="문의">{"인스타그램에서 문의하기 ↗"}</Text></a>}
    <p className="inquiry-feedback" role="status">{status}</p>
    </footer>
  </div>;
}
