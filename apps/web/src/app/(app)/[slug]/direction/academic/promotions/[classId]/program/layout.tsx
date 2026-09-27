// src/app/(app)/[slug]/direction/academic/promotions/[classId]/program/layout.tsx
import { ShowHideModal } from '@/components/layout/ShowHideModal'

export default function ProgramLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal?: React.ReactNode
}) {
  return (
    <>
      <ShowHideModal>{modal}</ShowHideModal>
      {children}
    </>
  )
}