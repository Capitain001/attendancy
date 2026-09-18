

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<any>;
}

export default async function AcademicLayout({ children, params }: LayoutProps) {


  return (
    <div className="flex-1 ">
      {children}
    </div>
  );
}