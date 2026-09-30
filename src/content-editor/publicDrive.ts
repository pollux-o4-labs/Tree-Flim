export type PublicDriveItem = {
  id: string;
  name: string;
  kind: "folder" | "image";
  thumbnailUrl?: string;
  sourceUrl?: string;
};

export type DriveTrailItem = { id: string; name: string };

export const portfolioDriveRoot =
  "https://drive.google.com/drive/folders/1tiUDodIFps2SriCOHjht8JQKzUYYJo8g?usp=sharing";

export function driveFolderId(value: string) {
  const match =
    value.match(/folders\/([A-Za-z0-9_-]{10,})/) ??
    value.match(/^([A-Za-z0-9_-]{10,})$/);
  return match?.[1] ?? null;
}

// Restricted to the portfolio browser origins and the read-only public Drive API.
const publicDriveKey = "AIzaSyBkQjdb75ilMgnDXRdns3O-XY-jQzSWELQ";
export async function listPublicDriveFolder(value: string) {
  const folderId = driveFolderId(value);
  if (!folderId) throw new Error('Google Drive 폴더 링크를 붙여 넣어 주세요.');
  const items: PublicDriveItem[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ key: publicDriveKey, q: `'${folderId}' in parents and trashed = false`, fields: 'nextPageToken,files(id,name,mimeType)', pageSize: '100', orderBy: 'folder,name', ...(pageToken ? { pageToken } : {}) });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error('공개 폴더를 열지 못했습니다. 링크 공유 권한을 확인해 주세요.');
    for (const file of data.files ?? []) {
      if (file.mimeType === 'application/vnd.google-apps.folder') items.push({ id: file.id, name: file.name, kind: 'folder' });
      else if (file.mimeType.startsWith('image/')) items.push({ id: file.id, name: file.name, kind: 'image', thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w320`, sourceUrl: `https://lh3.googleusercontent.com/d/${file.id}=s0` });
    }
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return { folderId, items };
}
