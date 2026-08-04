/* eslint-disable */
/* auto-generated — do not edit manually */

export {
  IllustrationHeroManagement,
  IllustrationPrincipalSignUp,
  IllustrationSchool,
  IllustrationWomanCamera,
} from "./illustrations";

import type { FC, SVGProps } from "react";
import {
  IllustrationHeroManagement,
  IllustrationPrincipalSignUp,
  IllustrationSchool,
  IllustrationWomanCamera,
} from "./illustrations";

type ComponentProps = SVGProps<SVGSVGElement>;

export const RESOURCE_ILLUSTRATIONS = {
  "hero-management": IllustrationHeroManagement,
  "principal-sign-up": IllustrationPrincipalSignUp,
  "school": IllustrationSchool,
  "woman-camera": IllustrationWomanCamera,
} as const satisfies Record<string, FC<ComponentProps>>;

export type ResourceIllustrationName = keyof typeof RESOURCE_ILLUSTRATIONS;
