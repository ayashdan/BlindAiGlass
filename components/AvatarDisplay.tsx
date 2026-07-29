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
}: {
  avatarUrl?: string | null;
  avatar?: string | null;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className={className} style={{ fontSize: size * 0.75, lineHeight: 1 }}>
      {resolveAvatar(avatar)}
    </span>
  );
}
