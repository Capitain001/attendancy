

export const DesignSection = ({title, children}:{title?:string, children?:React.ReactNode}) => {
  return (
    <section className="mt-24 flex flex-col gap-4 sm:px-16 md:px-20 lg:px-32 xl:px-52">
      <header className="flex items-center gap-4">
        <h2>{title}</h2>
      </header>
      <div className="relative flex min-w-[500px] aspect-video  flex-col items-center justify-center gap-12 bg-accent p-6">
        
      {children}
      </div>
    </section>
  )
}


