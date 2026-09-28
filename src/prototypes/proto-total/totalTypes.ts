import type { concepts, makeSlots, Photo } from "../../content/prototype-fixture";

export const TOTAL_GALLERY_PAGE_SIZE = 10;
export type TotalConcept = (typeof concepts)[number];
export type TotalSlot = ReturnType<typeof makeSlots>[number];
export type OpenPhoto = (photo: Photo) => void;
