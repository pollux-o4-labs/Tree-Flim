import { useEffect, useState } from 'react';
import { readWorkspace } from '../content-editor/repository';
import type { JournalRecord } from '../content-editor/model';
import { concepts } from './prototype-fixture';

export type NewsPost = JournalRecord;
const seededAt = '2026-01-01T00:00:00.000Z';

// Undated archive material keeps its editorial order until publication dates are supplied.
export const newsPosts: NewsPost[] = [
  {
    id: 'dan-soon-hyang', category: 'STUDIO', title: '단순향 × 트리필름',
    subtitle: '홍콩의 무드, 우리의 장면',
    summary: '대전의 홍콩 무드 스튜디오 단순향과 함께하는 촬영 이야기.',
    image: concepts[1].photos[0].src, imageAlt: '트리필름 인물 사진',
    paragraphs: ['대전의 홍콩 무드 스튜디오, 단순향과 트리필름이 함께합니다.', '스튜디오 비용이 포함된 촬영으로, 트리필름 촬영 시 유료 소품과 의상을 무료로 이용할 수 있는 할인 이벤트를 안내했습니다.'],
    note: '이전 협업 안내입니다. 현재 진행 여부와 비용·혜택은 촬영 문의 시 확인해 주세요.', status: 'published', featured: true, createdAt: seededAt, updatedAt: seededAt,
  },
  {
    id: 'seasonal-profile', category: 'SEASONAL', title: '계절이 머무는 프로필',
    subtitle: '꽃이 피고, 눈이 내리는 사이',
    summary: '벚꽃부터 겨울의 눈까지. 짧게 찾아오는 계절 속에서 남기는 나의 모습.',
    image: concepts[1].photos[3].src, imageAlt: '트리필름 개인 스냅 사진',
    paragraphs: ['자연 속 개인 스냅은 특별한 계절에 맞춰 한정된 일정으로 진행합니다.', '벚꽃은 3월, 장미는 5월, 능소화는 6월, 배롱나무는 8월, 눈과 함께하는 촬영은 12월에 준비합니다.', '신청 방법과 세부 일정은 인스타그램 게시물 및 스토리로 공지합니다. 개인 스냅은 인스타그램 DM으로 신청해 주세요.'],
    note: '계절별 참고 일정입니다. 실제 개화·기상 상황과 모집 공지에 따라 달라질 수 있습니다.', status: 'published', featured: true, createdAt: seededAt, updatedAt: seededAt,
  },
  {
    id: 'first-exhibition', category: 'EXHIBITION', title: '트리필름의 첫 전시',
    subtitle: '천 개의 카메라, 하나의 시선',
    summary: '한국유네스코유산 기록프로젝트 5기. 익숙한 색감으로 바라본 충남의 사찰.',
    image: concepts[2].photos[8].src, imageAlt: '트리필름 사찰 사진',
    paragraphs: ['5기 한국유네스코유산 기록프로젝트 — 천 개의 카메라. 대전광역시와 충청남도를 기록하는 프로젝트에 참여했습니다.', '저의 주제는 충남의 사찰입니다.', '스냅 촬영 때의 색감으로 사진을 보정했습니다. 평소 사람을 담던 시선으로 사찰의 풍경을 바라보았기에, 저에게 의미 있는 첫 전시입니다.'], status: 'published', featured: true, createdAt: seededAt, updatedAt: seededAt,
  },
  {
    id: 'wedding-couple', category: 'STORY', title: '함께라서, 더 행복한',
    subtitle: 'Wedding & Couple',
    summary: '두 사람의 행복한 모습을 바라보며, 저도 함께 행복해지는 시간.',
    image: concepts[0].photos[0].src, imageAlt: '트리필름 웨딩 사진',
    paragraphs: ['웨딩과 커플 촬영에서 행복한 두 분의 모습을 보면 저도 행복합니다.', '대전을 중심으로 활동하며, 다른 지역으로도 이동할 수 있습니다. 스냅 촬영 문의는 인스타그램 DM으로 부탁드립니다.'], status: 'published', featured: false, createdAt: seededAt, updatedAt: seededAt,
  },
];

export const orderedNews = (posts: NewsPost[] = newsPosts) => [...posts]
  .filter(post => post.status === 'published')
  .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));

export function usePublishedNews() {
  const [posts, setPosts] = useState<NewsPost[]>(() => orderedNews());
  useEffect(() => {
    const preview = window.parent !== window && new URLSearchParams(location.search).has('editor');
    if (preview) {
      const receive = (event: MessageEvent) => {
        if (event.origin !== location.origin || event.source !== window.parent || event.data?.source !== 'tree-film-record-manager' || event.data?.type !== 'records-sync' || !Array.isArray(event.data.records)) return;
        setPosts([...event.data.records].sort((a, b) => Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt)));
      };
      window.addEventListener('message', receive);
      window.parent.postMessage({ source: 'tree-film-record-preview', type: 'ready' }, location.origin);
      return () => window.removeEventListener('message', receive);
    }
    let active = true; void readWorkspace().then(workspace => {
      if (active && workspace.newsPublished) setPosts(orderedNews(workspace.newsPublished));
    }).catch(() => undefined); return () => { active = false; };
  }, []);
  return posts;
}
