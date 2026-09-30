import type { ArchiveWork } from './model';

type GalleryPhoto = { id: string; src: string; story: string; category: string; note?: string; location?: string };
type GalleryCollection = { id: string; name: string; en: string; intro: string; photos: readonly GalleryPhoto[] };

export function buildPublishedCollections(
  works: ArchiveWork[] | null,
  order: readonly string[],
  fallback: readonly GalleryCollection[],
): GalleryCollection[] {
  const photos = works === null
    ? fallback.flatMap(collection => collection.photos.map(photo => ({ ...photo, category: collection.name })))
    : works.filter(work => work.status === 'published' && work.image).map(work => ({
        id: `archive-${work.id}`, src: work.image, story: work.title, category: work.category, note: work.note, location: work.location ?? '',
      }));
  const names = [...new Set([...order, ...photos.map(photo => photo.category)])];
  return names.flatMap(name => {
    const collectionPhotos = photos.filter(photo => photo.category === name);
    if (!collectionPhotos.length) return [];
    const original = fallback.find(collection => collection.name === name);
    return [{
      id: original?.id ?? `collection-${encodeURIComponent(name)}`,
      name, en: original?.en ?? 'Collection', intro: original?.intro ?? '', photos: collectionPhotos,
    }];
  });
}
