import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import Link from "next/link"
  
  const items = [
    {
      id: "1",
      title: "Profile",
      content:
        "coss ui focuses on developer ",
    },
    {
      id: "2",
      title: "Etablissement",
      content:
        "Use our CSS variables for global styling, ",
    },
    {
      id: "3",
      title: "Paramettres",
      content:<Link href="/setting">Paramettres </Link>,
    },
   
  ]
  
  export  function AuthUserInfo() {
    return (
      <div className="space-y-4">
        <Accordion
          type="single"
          collapsible
          className="w-full -space-y-px"
          defaultValue="3"
        >
          {items.map((item) => (
            <AccordionItem
              value={item.id}
              key={item.id}
              className="relative border bg-background px-4 py-1 outline-none first:rounded-t-md last:rounded-b-md last:border-b has-focus-visible:z-10 has-focus-visible:border-ring has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
            >
              <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="pb-2 text-muted-foreground">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    )
  }
  