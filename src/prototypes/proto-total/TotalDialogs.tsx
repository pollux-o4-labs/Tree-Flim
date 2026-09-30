import PhotoCardView from '../../shared/PhotoCardView';
import { Text, ContentImage, Attachment, useContentEditing, useContentValue } from '../../content-editor/Content';
import { X } from "lucide-react";
import ConsultationPanel from './ConsultationPanel';
import { ConsultationModal } from '../../design-system/components';
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Photo } from "../../content/prototype-fixture";
import { siteIdentity } from "../../content/siteIdentity";
import PhotoCardBack from '../../shared/PhotoCardBack';

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
  const editing = useContentEditing();
  const value = useContentValue();
  const showLocation = photo && (editing || value(`photo.${photo.id}.location`, photo.location ?? '').trim());
  const showNote = photo && (editing || value(`photo.${photo.id}.note`, photo.note ?? '').trim());
  return (
    <>
      <dialog
        ref={photoDialog}
        className="photo-dialog ui-scrollbar"
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
          <PhotoCardView flipped={flipped} onFlip={() => setFlipped(value => !value)}
            eyebrow={<Text id="TotalDialogs.001" section="사진 상세">A MOMENT TO KEEP</Text>}
            flipLabel={<Text id={`photo.action.${flipped ? 'front' : 'back'}`} section="사진 상세">{flipped ? "사진으로 돌아가기" : "뒷면의 기록 읽기"}</Text>}
            front={<>
                  <ContentImage previewWidth={null} field={`photo.${photo.id}.src`} section="사진 상세" src={photo.src} alt={photo.story} />
                  <span><Text id={`photo.${photo.id}.story`} section="사진 상세">{photo.story}</Text></span>
                  <small><Text id={"brand.artistNameLatin"} section="사진 상세">{siteIdentity.artistNameLatin}</Text><Text id="TotalDialogs.002" section="사진 상세">{" / "}</Text><Text id={`photo.${photo.id}.category`} section="사진 상세">{photo.category}</Text></small>
</>
} back={<PhotoCardBack className="card-back" ariaHidden={!flipped}
                  eyebrow={<Text id="TotalDialogs.003" section="사진 상세">{"ON THE OTHER SIDE"}</Text>}
                  title={<Text id={`photo.${photo.id}.story`} section="사진 상세">{photo.story}</Text>}
                  category={<Text id={`photo.${photo.id}.category`} section="사진 상세">{photo.category}</Text>}
                  locationLabel={<Text id="TotalDialogs.005" section="사진 상세">{"LOCATION / DATE"}</Text>}
                  location={showLocation ? <Text id={`photo.${photo.id}.location`} section="사진 상세">{photo.location ?? ''}</Text> : undefined}
                  noteLabel={<Text id="TotalDialogs.007" section="사진 상세">{"NOTE"}</Text>}
                  note={showNote ? <Text id={`photo.${photo.id}.note`} section="사진 상세">{photo.note ?? ''}</Text> : undefined}
                  signature={<Text id={"brand.signature"} section="사진 상세">{siteIdentity.signature}</Text>}
                  footer={<Text id="TotalDialogs.009" section="사진 상세">{''}</Text>} />}>
            <Attachment id={`photo.${photo.id}.attachment`} section="작품 첨부" />
          </PhotoCardView>
        )}
      </dialog>
      <ConsultationModal panelRef={inquiryDialog} labelledBy="inquiry-title">
        <ConsultationPanel key={`${inquiry}-${inquirySession}`} initial={inquiry} />
      </ConsultationModal>
    </>
  );
}
