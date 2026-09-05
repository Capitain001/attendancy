import type { ResourceIconName } from "@/components/icons/generated";
import { RESOURCE_ICONS } from "@/components/icons/generated";
import { cn } from "@/lib/utils";

type ResourceIconProps = {
  name: ResourceIconName;
  size?: number;
  className?: string;
  alt?: string;
};

export function ResourceIcon({ name, size = 24, className, alt }: ResourceIconProps) {
  const Icon = RESOURCE_ICONS[name];

  return (
    <Icon
      size={size}
      className={cn("transition dark:invert", className)}
      aria-label={alt ?? `${name} icon`}
    />
  );
}
