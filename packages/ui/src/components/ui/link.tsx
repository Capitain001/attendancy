import * as React from "react";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  to?: string;
}

/**
 * Composant Link UI agnostique de framework (remplace next/link).
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, to, children, ...props }, ref) => {
    const targetHref = href ?? to ?? "#";
    return (
      <a ref={ref} href={targetHref} {...props}>
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";
