"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

// Données propres à notre variante, transmises à CalendarDayButton via un
// contexte : définir DayButton en ligne recréerait le composant à chaque rendu.
type CalendarExtras = {
  /** Contenu affiché sous le numéro du jour (point coloré, compteur...). Un tiret s'affiche si rien n'est retourné. */
  dayFooter?: (date: Date) => React.ReactNode
  /** Texte de la bulle au-dessus du jour courant. */
  todayLabel: string
}

const CalendarExtrasContext = React.createContext<CalendarExtras>({
  todayLabel: "Auj.",
})

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  dayFooter,
  todayLabel = "Auj.",
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
} & Partial<CalendarExtras>) {
  const defaultClassNames = getDefaultClassNames()

  const extras = React.useMemo(
    () => ({ dayFooter, todayLabel }),
    [dayFooter, todayLabel]
  )

  return (
    <CalendarExtrasContext.Provider value={extras}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn(
          "bg-background group/calendar p-3 [--cell-size:--spacing(10)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
          String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
          className
        )}
        captionLayout={captionLayout}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString("default", { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
          month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
          // Navigation en haut à droite (le titre est aligné à gauche)
          nav: cn(
            "absolute top-0 right-0 flex items-center gap-1",
            defaultClassNames.nav
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            "size-8 rounded-full p-0 select-none aria-disabled:opacity-50",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            "size-8 rounded-full p-0 select-none aria-disabled:opacity-50",
            defaultClassNames.button_next
          ),
          // Titre à gauche, en grand
          month_caption: cn(
            "flex h-(--cell-size) w-full items-center justify-start pr-20",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "flex h-(--cell-size) items-center justify-start gap-1.5 text-sm font-medium",
            defaultClassNames.dropdowns
          ),
          dropdown_root: cn(
            "relative rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50",
            defaultClassNames.dropdown_root
          ),
          dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
          caption_label: cn(
            "select-none font-bold capitalize",
            captionLayout === "label"
              ? "text-xl"
              : "flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
            defaultClassNames.caption_label
          ),
          month_grid: "w-full border-collapse",
          weekdays: cn("flex", defaultClassNames.weekdays),
          weekday: cn(
            "flex-1 select-none text-center text-xs font-medium text-muted-foreground",
            defaultClassNames.weekday
          ),
          // mt-6 : laisse la place à la bulle "aujourd'hui" au-dessus de la cellule
          week: cn("mt-6 flex w-full", defaultClassNames.week),
          week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
          week_number: cn("select-none text-[0.8rem] text-muted-foreground", defaultClassNames.week_number),
          day: cn("group/day relative w-full select-none px-0.5 p-0 text-center", defaultClassNames.day),
          // Les états de plage sont dessinés sur le cercle (voir CalendarDayButton)
          range_start: cn(defaultClassNames.range_start),
          range_middle: cn(defaultClassNames.range_middle),
          range_end: cn(defaultClassNames.range_end),
          today: cn(defaultClassNames.today),
          outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
          disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => (
            <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
          ),
          Chevron: ({ className, orientation, ...props }) => {
            if (orientation === "left") {
              return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            }
            if (orientation === "right") {
              return <ChevronRightIcon className={cn("size-4", className)} {...props} />
            }
            return <ChevronDownIcon className={cn("size-4", className)} {...props} />
          },
          DayButton: CalendarDayButton,
          WeekNumber: ({ children, ...props }) => (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          ),
          ...components,
        }}
        {...props}
      />
    </CalendarExtrasContext.Provider>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const { dayFooter, todayLabel } = React.useContext(CalendarExtrasContext)

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "group/btn relative flex h-auto w-full min-w-(--cell-size) flex-col items-center gap-1 rounded-md p-0 leading-none font-normal hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 dark:hover:bg-transparent",
        className
      )}
      {...props}
    >
      {/* Bulle "aujourd'hui" */}
      {modifiers.today && (
        <span
          className={cn(
            "pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap text-background",
            "after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-4 after:border-t-4 after:border-x-transparent after:border-t-foreground after:content-['']"
          )}
        >
          {todayLabel}
        </span>
      )}

      {/* Cercle du jour */}
      <span
        className={cn(
          "flex size-(--cell-size) items-center justify-center rounded-full bg-muted text-sm font-semibold transition-colors",
          "group-hover/btn:bg-accent",
          "group-data-[selected-single=true]/btn:bg-primary group-data-[selected-single=true]/btn:text-primary-foreground",
          "group-data-[range-start=true]/btn:bg-primary group-data-[range-start=true]/btn:text-primary-foreground",
          "group-data-[range-end=true]/btn:bg-primary group-data-[range-end=true]/btn:text-primary-foreground",
          "group-data-[range-middle=true]/btn:bg-accent group-data-[range-middle=true]/btn:text-accent-foreground",
          "group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50"
        )}
      >
        {day.date.getDate()}
      </span>

      {/* Ligne sous le jour : contenu fourni, ou tiret par défaut */}
      {dayFooter && (
        <span className="flex h-3 items-center justify-center text-[10px] text-muted-foreground">
          {dayFooter(day.date) ?? "–"}
        </span>
      )}
    </Button>
  )
}

export { Calendar, CalendarDayButton }