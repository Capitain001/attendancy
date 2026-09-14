"use client"

import { useState } from "react"
import { ChevronUp } from "lucide-react"

import { SwipeNavigator, type SwipeNavState } from "@/components/swipe-navigator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ScheduleScreen() {
  const [screen, setScreen] = useState<SwipeNavState>("main")

  return (
    <SwipeNavigator
      value={screen}
      onValueChange={setScreen}
      main={<Schedule />}
      secondary={<Attendance />}
      hint={
        <>
          <ChevronUp className="h-4 w-4 animate-bounce" />
          <span className="text-xs">Glisser vers le haut pour l'appel</span>
        </>
      }
    />
  )
}

function Schedule() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold">Aujourd'hui</h1>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Réseaux & protocoles</p>
            <p className="text-xs text-muted-foreground">10:15 – 12:15 · Salle 214</p>
          </div>
          <Badge>En cours</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Architecture logicielle</p>
            <p className="text-xs text-muted-foreground">14:00 – 16:00 · Salle 108</p>
          </div>
          <Badge variant="secondary">À venir</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

function Attendance() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold">Feuille de présence</h2>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm">Ama Kodjo</p>
          <Badge variant="outline">Présente</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm">Sena Adjovi</p>
          <Badge variant="outline">Absent</Badge>
        </CardContent>
      </Card>
    </div>
  )
}