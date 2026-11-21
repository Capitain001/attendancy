import React from 'react'
import { Link as TanStackLink } from '@tanstack/react-router'

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, children, ...props }, ref) => {
    return (
      <TanStackLink 
        ref={ref} 
        to={href} 
        preload="intent"
        {...props}
      >
        {children}
      </TanStackLink>
    )
  }
)

Link.displayName = 'Link'

export default Link
