'use client'

interface SubscribeButtonProps {
  planId: string
  className?: string
  disabled?: boolean
  children: React.ReactNode
}

export function SubscribeButton({
  planId: _planId,
  className,
  disabled,
  children,
}: SubscribeButtonProps) {
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
