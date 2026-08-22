interface StepCardProps {
    title: string
    children: React.ReactNode
  }
  
  export function StepCard({ title, children }: StepCardProps) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-semibold mb-6 text-center">{title}</h3>
        {children}
      </div>
    )
  }