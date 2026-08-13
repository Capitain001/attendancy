
interface LayoutProps {
  children: React.ReactNode;
}

export default async function DirectionPromotionLayout({ children }: LayoutProps) {


  return (
    <div className="flex flex-col min-h-screen gap-4">
      <div className="flex-1 ">
        {children}
      </div>
    </div>
  );
}