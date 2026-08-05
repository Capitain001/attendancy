
import SignupForm from './SignupForm'
import { TextShimmer } from '@/components/ui/text-shimmer'

export default function SignupSection({ email, orgName }: { email: string, orgName?: string }) {
  return (
    <div className='p-4 flex flex-col gap-4'>
      <div className='border border-dashed flex justify-center items-center h-20 '>
        <TextShimmer className='text-2xl font-bold text-accent/80' duration={5} >
          {`Inscrivez-vous a ${orgName?.toUpperCase()}`}
        </TextShimmer>
      </div>
      <SignupForm />
    </div>
  )
}
