import { concepts } from './prototype-fixture';

// Add concepts here; the photo browser supports arbitrary card counts.
export const shootingCollections = [
  { id: 'wedding', title: '웨딩 스냅', image: concepts[0].photos[0].src, kind: 'wedding' as const, description: '두 사람의 자연스러운 하루를 남깁니다.' },
  { id: 'seasonal', title: '계절 개인 스냅', image: concepts[1].photos[3].src, kind: 'consultation' as const, description: '꽃이 피고, 눈이 내리는 사이. 계절 속에서 지금의 나를 남깁니다.' },
];
