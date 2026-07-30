'use client'

interface CreateStripeButtonProps {
  className?: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

export function CreateStripeButton({
  className,
  onClick,
  disabled,
  children,
}: CreateStripeButtonProps) {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
