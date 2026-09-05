import type { ResourceIllustrationName } from "@/components/illustrations/generated";
import { RESOURCE_ILLUSTRATIONS } from "@/components/illustrations/generated";
import type { SVGProps } from "react";

type ResourceIllustrationProps = SVGProps<SVGSVGElement> & {
  name: ResourceIllustrationName;
  className?: string;
  alt?: string;
};

export function ResourceIllustration({ name, className, alt, ...props }: ResourceIllustrationProps) {
  const Illustration = RESOURCE_ILLUSTRATIONS[name];

  return (
    <Illustration
      className={`transition ${className ?? ""}`}
      aria-label={alt ?? `${name} illustration`}
      {...props}
    />
  );
}
