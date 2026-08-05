import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const classes = await prisma.class.findMany({
    select: { id: true, name: true },
    take: 10,
  })
  return NextResponse.json({ data: classes })
}
