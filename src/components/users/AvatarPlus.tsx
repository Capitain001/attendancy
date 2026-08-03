import { PlusCircleIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const AvatarPlus = ({url}:{url?:string}) => {
  return (
    <div className='relative w-fit'>
      <Avatar className='size-10'>
        <AvatarImage src={url||'https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png'} alt='Hallie Richards' />
        <AvatarFallback className='text-xs'>HR</AvatarFallback>
      </Avatar>
      <button className='focus-visible:ring-ring/50 absolute -right-1 -bottom-1 inline-flex cursor-pointer items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:outline-none'>
        <PlusCircleIcon className='text-background size-5 fill-slate-400' />
        <span className='sr-only'>Add</span>
      </button>
    </div>
  )
}

export default AvatarPlus



import { CheckIcon } from 'lucide-react'


export const AvatarStatusRingDemo = () => {
  return (
    <div className='relative w-fit'>
      <Avatar className='ring-offset-background ring-2 ring-green-600 ring-offset-2 dark:ring-green-400'>
        <AvatarImage src='https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-5.png' alt='Hallie Richards' />
        <AvatarFallback className='text-xs'>HR</AvatarFallback>
      </Avatar>
      <span className='absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-green-600 dark:bg-green-400'>
        <CheckIcon className='size-3 text-white' />
      </span>
    </div>
  )
}

  
