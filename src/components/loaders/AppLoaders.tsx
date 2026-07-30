
import { Skeleton, SkeletonCard } from '../ui/skeleton'
import { FormButton } from '../ux/FormButton';

export  function Loader() {
  return (

    <div className='h-screen flex justify-center items-center w-full'>
      <div className="flex flex-col justify-center gap-4  items-center w-full max-w-md ">
                    <FormButton loading text="Chargement…" />
      </div>
    </div>
  )
}



type ProgramUELoaderProps = {
  message: string;
};

export function ProgramUELoader({ message }: ProgramUELoaderProps) {
  return (
    <div className="flex p-2 border-2 h-72 rounded items-center justify-center bg-pattern-cross">
      {message}
    </div>
  );
}


export  function Cardloader() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <SkeletonCard key={i} className="h-48 w-full" />
    ))}
  </div>
  )
}


