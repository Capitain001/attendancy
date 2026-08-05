export default function FormCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="group relative z-50 flex h-96 md:h-36 min-h-0 w-full md:min-w-[408px] flex-col items-center justify-center overflow-hidden rounded-lg border-4 bg-background dark:bg-background/70 bg-[url('/logo.svg')] bg-[length:40%] bg-[50%] bg-no-repeat px-8 py-8 transition-all duration-1000 ease-in-out hover:h-96 dark:grayscale dark:filter">
      <div className="w-full opacity-100 md:opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}
