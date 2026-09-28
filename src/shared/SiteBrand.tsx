import { Text, ContentImage } from '../content-editor/Content';
import { Link } from "react-router-dom";
import { siteIdentity } from "../content/siteIdentity";

type SiteBrandProps = {
  compact?: boolean;
  subtitle?: string;
};

export default function SiteBrand({ compact = false, subtitle }: SiteBrandProps) {
  return (
    <Link className="brand" to="/">
      <Text id={"brand.studioName"} section="브랜드">{siteIdentity.studioName}</Text>
      {!compact && (
        <span><Text id={"brand.subtitle"} section="브랜드">{subtitle ?? `${siteIdentity.artistName} · ${siteIdentity.tagline}`}</Text></span>
      )}
    </Link>
  );
}
