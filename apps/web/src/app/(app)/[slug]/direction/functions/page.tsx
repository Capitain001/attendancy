import { Suspense } from 'react'
import { connection } from 'next/server'
import { getFunctionsAction } from '@/services/function'
import { FunctionDirectionPage } from '@/components/direction/functions/FunctionDirectionPage'
import { Loader } from '@/components/loaders/AppLoaders'

async function FunctionsContent() {
  const result = await getFunctionsAction()
  const functions = 'error' in result ? [] : result.data
  return <FunctionDirectionPage initialFunctions={functions} />
}

export default async function FunctionsPage() {
  await connection()

  return (
    <Suspense fallback={<Loader />}>
      <FunctionsContent />
    </Suspense>
  )
}
