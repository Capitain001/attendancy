"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { BellIcon, X } from "lucide-react"
import { useState, useEffect } from "react"

interface Notification {
  id: string
  message: string
}

interface Props {
  notification?: Notification | null
  isCollapsed?: boolean
  show?: boolean
  onClose?: () => void
  onToggle?: () => void
}

export default function NotificationBar({
  notification,
  isCollapsed = true,
  show = true,
  onClose = () => {},
  onToggle = () => {},
}: Props) {
  const [toggle, setToggle] = useState(isCollapsed)

  useEffect(() => {
    setToggle(isCollapsed)
  }, [isCollapsed])

  return (
    <div className={cn(!show || !notification ? "hidden" : "block")}>
      <div>
        <motion.div
          className={cn("flex h-full w-[380px] md:w-[460px] items-center justify-center rounded-full")}
          layout
        >
          <motion.div
            className="h-fit relative"
            style={{ borderRadius: 9999, width: 56 }}
            initial={{ scale: 0, y: "100%" }}
            transition={{ type: "spring", bounce: 0.16 }}
            animate={{ scale: 1, y: 0, width: !toggle ? 56 : "100%" }}
          >
            <div className="flex justify-center items-center w-full gap-4 h-12">
              <div className="bg-black/20 hover:bg-foreground/20 transition-colors duration-1000 flex h-full w-[300px] md:w-[400px] items-center justify-center gap-2 rounded-lg">
                {toggle ? (
                  <motion.div
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center w-full px-4 gap-2"
                  >
                    <BellIcon className="w-4 h-4" />
                    <p className="text-sm text-center font-semibold w-full">{notification?.message}</p>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => {
                      setToggle(true)
                      onToggle()
                    }}
                    className="cursor-pointer w-full h-full flex justify-center items-center"
                  >
                    <BellIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {toggle && (
                <button
                  onClick={() => {
                    setToggle(false)
                    onClose()
                  }}
                  className="flex h-12 bg-black/20 hover:bg-foreground/20 transition-colors duration-1000 aspect-square cursor-pointer items-center justify-center gap-2 rounded-lg"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                    className="flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4 text-foreground/80" />
                  </motion.div>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
