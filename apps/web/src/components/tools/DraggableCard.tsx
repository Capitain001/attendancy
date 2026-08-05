//src/components/tools/DraggableCard.tsx
"use client";


import { motion } from "framer-motion";
import React, { useState } from "react";
import { useRealtimeDraggableItem } from "@/hooks/use-realtime-draggable-item";

export const DraggableCard = ({
  roomName,
  cardId,
}: {
  roomName: string;
  cardId: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = React.useRef({ x: 0, y: 0 });

  // Utilisation du hook générique pour les items
  const { position, broadcastPosition } = useRealtimeDraggableItem({
    roomName,
    itemId: cardId,
    throttleMs: 20, // optionnel, par défaut 50ms
    isDragging,
  });

  return (
    <motion.div
      className="absolute w-60 h-40 border-2 bg-card rounded-xl shadow-lg cursor-grab"
      drag
      dragMomentum={false}
      style={{
        x: position.x,
        y: position.y,
      }}
      onDragStart={() => {
        setIsDragging(true);
        startPosRef.current = { x: position.x, y: position.y };
      }}
      onDrag={(_, info) => {
        const newPos = {
          x: startPosRef.current.x + info.offset.x,
          y: startPosRef.current.y + info.offset.y
        }
        broadcastPosition(newPos);
      }}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        const finalPos = {
          x: startPosRef.current.x + info.offset.x,
          y: startPosRef.current.y + info.offset.y
        }
        broadcastPosition(finalPos);
      }}
    />
  );
};
