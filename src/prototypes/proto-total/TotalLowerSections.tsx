import { Text, ContentImage, Attachment } from '../../content-editor/Content';
import TotalPrograms from './TotalPrograms';
import { concepts } from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";
import { TotalNewsPreview } from './TotalNews';

type Props = { onOpenInquiry: (label: string) => void; onOpenNews: (id: string) => void };

export default function TotalLowerSections({ onOpenInquiry, onOpenNews }: Props) {
  return (
    <>
      <section className="about-section" id="about">
        <div className="about-photo reveal">
          <ContentImage field={"TotalLowerSections.001.image"} section="소개 · 촬영 안내"
            src={concepts[2].photos[6].src}
            alt="작가의 시선으로 바라본 일상의 기록"
            loading="eager" decoding="async"
          />
          <span><Text id="TotalLowerSections.002" section="소개 · 촬영 안내">{"A NOTE FROM THE PHOTOGRAPHER"}</Text></span>
        </div>
        <div className="about-copy reveal">
          <p className="eyebrow"><Text id="TotalLowerSections.003" section="소개 · 촬영 안내">{"BEHIND THE FRAME"}</Text></p>
          <h2><Text id="TotalLowerSections.004" section="소개 · 촬영 안내">{"당신이 당신의 모습을"}</Text><br />
            <em><Text id="TotalLowerSections.005" section="소개 · 촬영 안내">{"좋아하게 되는 일."}</Text></em>
          </h2>
          <p><Text id="TotalLowerSections.006" section="소개 · 촬영 안내">{"잘 나오는 각도를 찾습니다."}</Text><br /><Text id="TotalLowerSections.007" section="소개 · 촬영 안내">{"억지로 만든 표정보다,"}</Text><br /><Text id="TotalLowerSections.008" section="소개 · 촬영 안내">{"잠깐 방심한 순간을 좋아합니다."}</Text></p>
          <p><Text id="TotalLowerSections.009" section="소개 · 촬영 안내">{"자신의 사진을 보고 웃는 그 순간."}</Text><br /><Text id="TotalLowerSections.010" section="소개 · 촬영 안내">{"제가 사진을 찍는 이유입니다."}</Text></p>
          <span className="signature"><Text id={"brand.signature"} section="소개 · 촬영 안내">{siteIdentity.signature}</Text></span>
        </div>
      </section>
      <section className="contact-section" id="contact">
        <p className="eyebrow"><Text id="TotalLowerSections.011" section="소개 · 촬영 안내">{"LET'S MAKE YOUR NEXT MEMORY"}</Text></p>
        <h2><Text id="TotalLowerSections.012" section="소개 · 촬영 안내">{"다음 장면의 주인공은,"}</Text><br />
          <em><Text id="TotalLowerSections.013" section="소개 · 촬영 안내">{"당신이면 좋겠습니다."}</Text></em>
        </h2>
        <TotalPrograms onInquiry={onOpenInquiry} />
        <Attachment id="contact.attachment" section="촬영 안내" />
      </section>
      <TotalNewsPreview onOpen={onOpenNews} />
    </>
  );
}
