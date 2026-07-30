'use client'

interface ManageSubscriptionButtonProps {
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function ManageSubscriptionButton({
  className,
  disabled,
  children,
}: ManageSubscriptionButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      title="Disponible en phase 2 — intégration Stripe via Edge Function"
    >
      {children}
    </button>
  )
}
