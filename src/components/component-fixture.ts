import { concepts } from "../content/prototype-fixture";

export const componentPhotos = concepts.flatMap((concept) =>
  concept.photos
    .slice(0, 5)
    .map((photo) => ({ ...photo, concept: concept.name })),
);

export const marqueePath =
  "M1 209C120 310 300 310 420 190C540 70 680 65 995 156";
