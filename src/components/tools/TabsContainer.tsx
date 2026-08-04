///src/components/tools/tabsContainer
"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import React from "react";

type Tab = {
  label: string;
  value: string;
  content: React.ReactNode;
};

type TabsContainerProps = {
  tabs: Tab[];
  defaultValue?: string;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export function TabsContainer({
  tabs,
  defaultValue,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}: TabsContainerProps) {
  return (
    <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex justify-end">
        <TabsList className={cn("rounded-b-none", listClassName)}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(triggerClassName)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div  className=" flex-1 flex items-center justify-center">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className={cn("w-full h-full  rounded-none m-0", contentClassName)}
          >
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}



/* exemple usage */

const tabs = [
  {
    label: "Overview",
    value: "overview",
    content: (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <p>Contenu de l’onglet overview.</p>
      </div>
    ),
  },
  {
    label: "Settings",
    value: "settings",
    content: (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p>Contenu de l’onglet settings.</p>
      </div>
    ),
  },
  {
    label: "Logs",
    value: "logs",
    content: (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Logs</h2>
        <p>Contenu de l’onglet logs.</p>
      </div>
    ),
  },
] satisfies {
  label: string;
  value: string;
  content: React.ReactNode;
}[];

export default function ExampleTabs() {
  return (
    <div className="h-100 w-full">
      <TabsContainer
        tabs={tabs}
        defaultValue="overview"
        listClassName="bg-muted"
        triggerClassName="data-[state=active]:bg-background"
        contentClassName="border"
      />
    </div>
  );
}
