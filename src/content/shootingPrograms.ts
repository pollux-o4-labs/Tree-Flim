export const shootingPrograms = [
  { id: 'wedding-couple', title: '웨딩 스냅', description: '두 사람의 하루에 맞춰 촬영 시간과 장소를 선택하세요.', timing: '희망일 상담', location: '대전 중심 · 다른 지역 촬영 협의 가능', price: '20만 / 35만 / 55만 원 · SNS·후기 동의 시 각 5만 원 할인', detail: '세 가지 상품의 시간·장소·보정 장수를 비교하고 문의할 수 있습니다. 커플 촬영은 일반 문의로 상담해 주세요.' },
  { id: 'seasonal-profile', title: '계절 개인 스냅', description: '꽃이 피고 눈이 내리는 시기에 만나는 개인 촬영입니다.', timing: '시즌별 모집 · 공지 확인 필요', location: '계절별 촬영 장소 별도 안내', price: '회차별 모집 안내에서 확인', detail: '벚꽃 3월 · 장미 5월 · 능소화 6월 · 배롱나무 8월 · 눈 12월. 실제 촬영일과 모집 여부는 별도 공지로 안내합니다.' },
] as const;

// Set only after the artist confirms the public contact URL.
export const photographyContact: { instagramUrl: string | null } = { instagramUrl: null };
