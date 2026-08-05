"use client";
import { useState } from "react";

import { BellIcon, X } from "lucide-react";

interface Notification {
  message: string;
  
}

export const NotificationBar = ({notification}: {notification?: Notification}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;




  return (
    <div className="fixed lg:bottom-4  flex w-80  top-18 lg:top-auto items-center gap-3  rounded-lg bg-black/20 p-4  shadow-lg">
    <BellIcon className="w-4 h-4" />
    <p className="text-sm">{notification?.message}</p>
    </div>
  );
};

