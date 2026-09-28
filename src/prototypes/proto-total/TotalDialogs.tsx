import { Text, ContentImage, Attachment } from '../../content-editor/Content';
import { RotateCw, X } from "lucide-react";
import ConsultationPanel from './ConsultationPanel';
import { ConsultationModal } from '../../design-system/components';
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Photo } from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";

type Props = {
  photo: Photo | null;
  flipped: boolean;
  setFlipped: Dispatch<SetStateAction<boolean>>;
  inquiry: string;
  inquirySession: number;
  photoDialog: RefObject<HTMLDialogElement | null>;
  inquiryDialog: RefObject<HTMLDialogElement | null>;
};

export default function TotalDialogs({
  photo,
  flipped,
  setFlipped,
  inquiry,
  inquirySession,
  photoDialog,
  inquiryDialog,
}: Props) {
  return (
    <>
      <dialog
        ref={photoDialog}
        className="photo-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) photoDialog.current?.close();
        }}
      >
        <button
          className="dialog-close"
          onClick={() => photoDialog.current?.close()}
          aria-label="사진 닫기"
        >
          <X />
        </button>
        {photo && (
          <div className="photo-dialog-content">
            <p className="eyebrow"><Text id="TotalDialogs.001" section="사진 상세">{"A MOMENT TO KEEP"}</Text></p>
            <div
              className="card-perspective"
              onPointerMove={(event) => {
                if (
                  event.pointerType === "touch" ||
                  matchMedia("(prefers-reduced-motion: reduce)").matches
                ) return;
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty(
                  "--rx",
                  ((event.clientY - rect.top) / rect.height - 0.5) * -12 + "deg",
                );
                event.currentTarget.style.setProperty(
                  "--ry",
                  ((event.clientX - rect.left) / rect.width - 0.5) * 12 + "deg",
                );
              }}
              onPointerLeave={(event) => {
                event.currentTarget.style.setProperty("--rx", "0deg");
                event.currentTarget.style.setProperty("--ry", "0deg");
              }}
            >
              <div className={`photo-card ${flipped ? "is-flipped" : ""}`}>
                <div className="card-front" aria-hidden={flipped}>
                  <ContentImage field={`photo.${photo.id}.src`} section="사진 상세" src={photo.src} alt={photo.story} />
                  <span><Text id={`photo.${photo.id}.story`} section="사진 상세">{photo.story}</Text></span>
                  <small><Text id={"brand.artistNameLatin"} section="사진 상세">{siteIdentity.artistNameLatin}</Text><Text id="TotalDialogs.002" section="사진 상세">{" / "}</Text><Text id={`photo.${photo.id}.category`} section="사진 상세">{photo.category}</Text></small>
                </div>
                <div className="card-back" aria-hidden={!flipped}>
                  <p className="eyebrow"><Text id="TotalDialogs.003" section="사진 상세">{"ON THE OTHER SIDE"}</Text></p>
                  <h2><Text id={`photo.${photo.id}.story`} section="사진 상세">{photo.story}</Text></h2>
                  <dl>
                    <dt><Text id="TotalDialogs.004" section="사진 상세">{"COLLECTION"}</Text></dt>
                    <dd><Text id={`photo.${photo.id}.category`} section="사진 상세">{photo.category}</Text></dd>
                    <dt><Text id="TotalDialogs.005" section="사진 상세">{"LOCATION / DATE"}</Text></dt>
                    <dd><Text id={`photo.${photo.id}.location`} section="사진 상세">{"작가의 기록을 기다리는 중"}</Text></dd>
                    <dt><Text id="TotalDialogs.007" section="사진 상세">{"NOTE"}</Text></dt>
                    <dd><Text id={`photo.${photo.id}.note`} section="사진 상세">{"자연스러운 순간을 오래 간직하고 싶어서."}</Text></dd>
                  </dl>
                  <span className="signature"><Text id={"brand.signature"} section="사진 상세">{siteIdentity.signature}</Text></span>
                  <small><Text id="TotalDialogs.009" section="사진 상세">{"스토리와 메모는 프로토타입용 예시입니다."}</Text></small>
                </div>
              </div>
            </div>
            <button className="flip-button" onClick={() => setFlipped((value) => !value)}>
              <RotateCw size={16} />
              <Text id={`photo.action.${flipped ? 'front' : 'back'}`} section="사진 상세">{flipped ? "사진으로 돌아가기" : "뒷면의 기록 읽기"}</Text>
            </button>
            <Attachment id={`photo.${photo.id}.attachment`} section="작품 첨부" />
          </div>
        )}
      </dialog>
      <ConsultationModal panelRef={inquiryDialog} labelledBy="inquiry-title">
        <ConsultationPanel key={`${inquiry}-${inquirySession}`} initial={inquiry} />
      </ConsultationModal>
    </>
  );
}
