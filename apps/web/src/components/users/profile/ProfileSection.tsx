"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserInfo } from "@/types/user";
import { UserProfileCard } from "./UserProfileCard";
import { EditProfileForm } from "./EditProfileForm";

export function ProfileSection({ user }: { user: Partial<UserInfo> }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative w-full overflow-hidden pb-8">
      <AnimatePresence mode="wait" initial={false}>
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <UserProfileCard
              user={user}
              onEditProfile={() => setIsEditing(true)}
              onEditDetails={() => setIsEditing(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <EditProfileForm
              user={user}
              onCancel={() => setIsEditing(false)}
              onSuccess={() => setIsEditing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
