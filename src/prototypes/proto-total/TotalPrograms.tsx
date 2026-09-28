import { Text } from '../../content-editor/Content';
import { ArrowUpRight } from 'lucide-react';
import { ActionRow } from '../../design-system/components';
export default function TotalPrograms({ onInquiry }: { onInquiry: (label: string) => void }) {
  return <div className="contact-navigation">
    <div className="contact-rows">
      {[['촬영 안내', '패키지 · 가격 안내'], ['촬영 일정 문의', '촬영 일정 문의'], ['일반 문의', '일반 문의']].map(([action, title], index) =>
        <ActionRow key={action} number={index + 1} onClick={() => onInquiry(action)} aria-haspopup="dialog"><Text id={`contact.${index}.title`} section="촬영 안내">{title}</Text></ActionRow>
      )}
    </div>
    <button className="contact-faq-link" onClick={() => onInquiry('자주 묻는 질문')} aria-haspopup="dialog"><Text id="TotalPrograms.001" section="촬영 안내">{"촬영 전 궁금한 점이 있다면 "}</Text><span><Text id="TotalPrograms.002" section="촬영 안내">{"자주 묻는 질문 "}</Text><ArrowUpRight size={13} /></span></button>
  </div>;
}
