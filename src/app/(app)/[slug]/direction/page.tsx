import { connection } from 'next/server'
import React from 'react'

export default async function page() {
       await  connection()
  return (
    <div>
      direction 
    </div>
  )
}
