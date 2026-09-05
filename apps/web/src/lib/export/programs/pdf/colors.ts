import type { RGB } from "../types";

export const PDF_PAGE = {
  width: 297,
  height: 210,
  margin: 18,
} as const;

export const PDF_COLORS: Record<string, RGB> = {
  text: [20, 20, 22],
  muted: [80, 80, 85],
  border: [160, 160, 165],
  headerBg: [215, 215, 220],
  ueBg: [230, 230, 235],
  rowAlt: [242, 242, 245],
};
