"use client"

import { useState } from "react"

import {Package, User } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

export interface UserData {
  name: string
  email: string
  avatar: string
}

export interface Order {
  id: string
  date: string
  status: "processing" | "shipped" | "delivered"
  progress: number
}

export interface UserAccountAvatarProps {
  user?: UserData
  orders?: Order[]
  onProfileSave?: (user: UserData) => void
  onOrderView?: (orderId: string) => void
  className?: string
}

const initialUserData: UserData = {
  name: "John Doe",
  email: "john@example.com",
  avatar:
    "https://res.cloudinary.com/dyzxnud9z/image/upload/w_90,h_90,c_fill,g_auto/v1759818651/smoothui/educalvolpz.jpg",
}

const mockOrders: Order[] = [
  { id: "ORD001", date: "2023-03-15", status: "delivered", progress: 100 },
  { id: "ORD002", date: "2023-03-20", status: "shipped", progress: 66 },
]

export default function UserAccountAvatar({
  user = initialUserData,
  orders = mockOrders,
  onProfileSave,
  onOrderView,
  className = "",
}: UserAccountAvatarProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData>(user)

  const handleSectionClick = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const handleProfileSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const updatedUser = {
      ...userData,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    }
    setUserData(updatedUser)
    if (onProfileSave) onProfileSave(updatedUser)
    setActiveSection(null)
  }

  const renderEditProfile = () => (
    <form onSubmit={handleProfileSave} className="flex flex-col gap-2 p-4">
      <label htmlFor="name" className="text-xs font-medium">
        Name
      </label>
      <input
        id="name"
        name="name"
        defaultValue={userData.name}
        className="rounded-sm border bg-background p-2 text-xs"
        placeholder="Name"
      />
      <label htmlFor="email" className="text-xs font-medium">
        Email
      </label>
      <input
        id="email"
        name="email"
        defaultValue={userData.email}
        className="rounded-sm border bg-background p-2 text-xs"
        placeholder="Email"
      />
      <button
        type="submit"
        className="cursor-pointer bg-muted rounded-sm  px-4 py-2 text-sm  "
      >
        Save
      </button>
    </form>
  )

  const renderLastOrders = () => (
    <div className="flex flex-col gap-2 p-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col items-center justify-between gap-3 rounded-sm border bg-background p-2 text-xs"
        >
          <div className="flex w-full items-center justify-between">
            <div className="font-medium">{order.id}</div>
            <div className="text-muted-foreground">{order.date}</div>
          </div>
        </div>
      ))}
    </div>
  )

  return (

          <motion.div
            initial={{ height: "auto" }}
            animate={{ height: "auto" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <div className="flex flex-col">
              <div
                className="hover:bg-muted cursor-pointer p-2"
                onClick={() => handleSectionClick("profile")}
              >
                <User size={16} className="mr-2 inline" />
                Edit Profile
              </div>
              <AnimatePresence initial={false}>
                {activeSection === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      filter: "blur(0px)",
                    }}
                    exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  >
                    {renderEditProfile()}
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                className="hover:bg-muted cursor-pointer p-2"
                onClick={() => handleSectionClick("orders")}
              >
                <Package size={16} className="mr-2 inline" />
                Last Orders
              </div>
              <AnimatePresence initial={false}>
                {activeSection === "orders" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      filter: "blur(0px)",
                    }}
                    exit={{ opacity: 0, height: 0, filter: "blur(10px)" }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  >
                    {renderLastOrders()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

  )
}
