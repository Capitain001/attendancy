

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function AcademicLayout({ children, params }: LayoutProps) {


  return (
    <div className="flex-1 ">
      {children}
    </div>
  );
}