import { User } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

type AvatarProps = {
  /** Shown as initials when there is no photo, or the photo fails to load. */
  initials: string;
  imageUrl?: string | null;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * A circular avatar: the person's photo, else their initials, else a person
 * icon. Decorative — the name always sits beside it or in its control's label.
 */
export function Avatar({ initials, imageUrl, size = "sm", className }: AvatarProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(imageUrl) && !photoFailed;

  return (
    <span aria-hidden="true" className={cn("avatar", size === "lg" && "avatar--lg", className)}>
      {showPhoto ? (
        <img alt="" onError={() => setPhotoFailed(true)} src={imageUrl ?? undefined} />
      ) : initials ? (
        initials
      ) : (
        <User className="avatar__icon" />
      )}
    </span>
  );
}

export function AvatarSkeleton({ size = "sm" }: { size?: "sm" | "lg" }) {
  return <span aria-hidden="true" className={cn("avatar skeleton", size === "lg" && "avatar--lg")} />;
}
