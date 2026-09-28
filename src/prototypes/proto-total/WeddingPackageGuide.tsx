import { Text } from '../../content-editor/Content';
import { formatWon, weddingPackages, weddingPolicies } from '../../content/weddingPackages';
import { concepts } from '../../content/prototype-fixture';
import { Disclosure } from '../../design-system/components';
import PhotoDeck from '../../design-system/PhotoDeck';

export default function WeddingPackageGuide({ onSelect }: { onSelect: (name: string) => void }) {
  const stories = ['가볍게 남기는 우리 · 90분 / 장소 1곳', '한 장소에서 여유 있게 · 3시간 / 장소 1곳', '두 장소를 잇는 하루 · 5시간 / 장소 2곳'];
  return <div className="wedding-guide">
    <PhotoDeck kind="package" action="이 패키지로 문의" onChoose={id => { const item = weddingPackages.find(value => value.id === id); if (item) onSelect('웨딩 스냅 · ' + item.name); }} cards={weddingPackages.map((item, index) => ({
      id: item.id, title: item.name, image: concepts[0].photos[index].src, story: stories[index],
      price: formatWon(item.price),
      condition: 'SNS·후기 동의 시 ' + formatWon(item.discountedPrice) + '. 원본 JPG 전체 + 보정본 ' + item.retouched + '장. 스튜디오·출장·입장료 별도.' + (item.id === 'halfday' ? ' 야외 2곳 또는 스튜디오 1곳 + 야외 1곳.' : ''),
    }))} />
    <p className="package-important"><Text id="WeddingPackageGuide.001" section="패키지">{"사진은 분위기 예시 · 기본 금액 기준 · 추가 비용 별도"}</Text></p>
    <div className="package-policies"><Disclosure title={<Text id="package.policies.heading" section="패키지">촬영 전 알아두실 내용</Text>}>{weddingPolicies.map((policy, policyIndex) => <Disclosure key={policy.title} title={<Text id={`policy.${policyIndex}.title`} section="촬영 정책">{policy.title}</Text>}><ul>{policy.lines.map((line, lineIndex) => <li key={line}><Text id={`policy.${policyIndex}.line.${lineIndex}`} section="패키지">{line}</Text></li>)}</ul></Disclosure>)}</Disclosure></div>
  </div>;
}
