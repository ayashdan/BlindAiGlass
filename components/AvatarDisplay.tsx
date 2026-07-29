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
  borderClass?: string | null; // an equipped cosmetic border, e.g. "border-amber-400"
}) {
  const ring = borderClass ? `${borderClass} border-[3px] rounded-full` : "";

  if (avatarUrl) {
    return (
      <span className={`inline-block ${ring}`} style={{ padding: borderClass ? 2 : 0 }}>
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
      className={`inline-flex items-center justify-center ${ring} ${className}`}
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
