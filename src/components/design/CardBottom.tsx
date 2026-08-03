import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card'
import UserIcon from '../users/UserIcon'

export const CardBottom = () => {
  return (
    <Card className='max-w-md pb-0'>
      <CardHeader className='p-4 gap-0'>
        <div className='flex gap-4 items-center '>
          <UserIcon/>
          <CardTitle>Komi Etru </CardTitle>
        </div>
        
        <CardDescription>A vibrant and abstract background with smooth gradient curves.</CardDescription>
      </CardHeader>
      <CardContent className='px-0'>
        <img
          src='https://cdn.shadcnstudio.com/ss-assets/components/card/image-1.png?height=280&format=auto'
          alt='Banner'
          className='aspect-video h-70 rounded-b-xl object-cover'
        />
      </CardContent>
    </Card>
  )
}


