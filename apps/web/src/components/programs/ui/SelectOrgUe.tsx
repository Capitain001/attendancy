"use client"

import { useState } from "react"
import SelectUe from "./SelectUe"
import { OrgUEDTO } from "@/services/ue/types"


interface SelectOrgUeProps {
  ues: OrgUEDTO
}

export default function SelectOrgUe({ ues }: SelectOrgUeProps) {
  const [selected, setSelected] = useState<string>("")

  return (
    <div className="space-y-6 w-fit">
      <SelectUe
        ues={ues}
        value={selected}
        onChange={setSelected}
      />

      <div className="text-sm text-muted-foreground">
        UE sélectionnée :
        <span className="font-medium ml-2">
          {selected || "Aucune"}
        </span>
      </div>
    </div>
  )
}
