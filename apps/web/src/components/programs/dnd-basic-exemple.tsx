"use client"

import { useState } from "react"

const initialItems = ["A", "B", "C", "D"]

export default function DragDrop() {
  const [items, setItems] = useState(initialItems)
  const [dragged, setDragged] = useState<string | null>(null)

  function handleDragStart(id: string) {
    setDragged(id)
  }

  function handleDrop(targetId: string) {
    if (!dragged || dragged === targetId) return

    const oldIndex = items.indexOf(dragged)
    const newIndex = items.indexOf(targetId)

    const newItems = [...items]
    const [moved] = newItems.splice(oldIndex, 1)
    newItems.splice(newIndex, 0, moved)

    setItems(newItems)
  }

  return (
    <div className="w-64">
      {items.map((item) => (
        <div
          key={item}
          draggable
          onDragStart={() => handleDragStart(item)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(item)}
          className="p-3 mb-2 border bg-white cursor-move"
        >
          Item {item}
        </div>
      ))}
    </div>
  )
}