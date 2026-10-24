import type { Avatar as AvatarData } from "../../storage/db.ts";

export function Avatar({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={["avatar", className ?? ""].join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.38, background: avatar.color }}
      aria-hidden="true"
    >
      {avatar.hat === "hat" && <span className="hat" style={{ width: size * 0.7, height: size * 0.28, top: -size * 0.2 }} />}
      {initial}
    </div>
  );
}
