import { resolveAvatar } from "@/lib/game/avatars";

// Shows an uploaded photo if one exists, otherwise the emoji avatar. Plain
// <img> (not next/image) since Supabase Storage URLs are on a per-project
// domain that would need explicit allow-listing in next.config for
// next/image — not worth the extra setup step for a profile picture.
export default function AvatarDisplay({
  avatarUrl,
  avatar,
  size = 40,
  className = "",
  borderClass,
}: {
  avatarUrl?: string | null;
  avatar?: string | null;
  size?: number;
  className?: string;
  // Either a plain achievement border, e.g. "border-amber-400", or a Plus
  // vault ring, e.g. "shop-ring-inferno" — the animated conic-gradient
  // rings defined in globals.css. The two render differently: a vault ring
  // supplies its own padding/gradient layer via CSS, a plain border doesn't.
  borderClass?: string | null;
}) {
  const isVaultRing = Boolean(borderClass?.startsWith("shop-ring-"));
  const ringClass = !borderClass ? "" : isVaultRing ? `shop-ring ${borderClass}` : `${borderClass} border-[3px] rounded-full`;
  const wrapStyle = borderClass && !isVaultRing ? { padding: 2 } : undefined;

  if (avatarUrl) {
    return (
      <span className={`inline-block ${ringClass}`} style={wrapStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          className={`rounded-full object-cover ${className}`}
          style={{ width: size, height: size }}
        />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center ${ringClass} ${className}`}
      style={{
        fontSize: size * 0.75,
        lineHeight: 1,
        width: borderClass ? size * 1.2 : undefined,
        height: borderClass ? size * 1.2 : undefined,
      }}
    >
      {resolveAvatar(avatar)}
    </span>
  );
}
