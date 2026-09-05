export function getUnreadBadgeInfo(count: number) {
  switch (true) {
    case count > 99:
      return {
        label: "99+",
        variant: "destructive" as const,
      };

    case count > 9:
      return {
        label: count,
        variant: "default" as const,
      };

    default:
      return {
        label: count,
        variant: "secondary" as const,
      };
  }
}
