// import InvitationCard from '@/components/invitation/InvitationCard'
import PhoneMockupBasic from '@/components/design/phone/phone-mock-up'
import PhoneCarousel from '@/components/design/PhoneCarousel'
import React from 'react'

export default function page() {
  return (
    <div className='max-w-90 min-h-72'>

        <PhoneMockupBasic/>
      {/* <InvitationCard/> */}
      <PhoneCarousel images={[
        { src: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop", alt: "Lexis mobile" },
        { src: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=800&fit=crop", alt: "Dashboard" },
        { src: "https://images.unsplash.com/photo-1512941937669-95a1b58e7e9c?w=400&h=800&fit=crop", alt: "Lexis mobile" },
        { src: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=800&fit=crop", alt: "Dashboard" },
      ]}/>
    </div>
  )
}
