// import { ThemeToggle } from "@/components/ThemeToggle";
import { button } from "@/styles/button";
import { card } from "@/styles/card";
import { input } from "@/styles/input";
import { layout } from "@/styles/layout";
import { typography } from "@/styles/typography";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={layout.section}>
      <div className="mb-4 flex items-center gap-3">
        <span className={typography.label}>{title}</span>
        <div className="flex-1 border-t border-dashed border-border/30" />
      </div>
      {children}
    </section>
  );
}

function Token({ name }: { name: string }) {
  return (
    <span className="text-[10px] font-mono text-text-disabled bg-fill-faint px-1.5 py-0.5 rounded">
      {name}
    </span>
  );
}

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/30 bg-background/80 backdrop-blur-md shadow-[var(--shadow-header)]">
        <div className={`${layout.page} flex h-12 items-center justify-between`}>
          <span className={typography.label}>Design Playground</span>
          {/* <ThemeToggle /> */}
        </div>
      </header>

      <main className={layout.page}>

        {/* ── Surfaces ── */}
        <Section title="Surfaces — hiérarchie">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { name: "background",  cls: "bg-background border border-border/30" },
              { name: "card",        cls: "bg-card border border-border/30" },
              { name: "muted",       cls: "bg-muted" },
              { name: "popover",     cls: "bg-popover border border-border/30" },
              { name: "sidebar",     cls: "bg-sidebar border border-border/30" },
              { name: "fill-faint",  cls: "bg-fill-faint border border-border/30" },
            ].map(({ name, cls }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-10 w-full rounded-lg ${cls}`} />
                <span className="text-[10px] font-mono text-text-subtle">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Couleurs d'action ── */}
        <Section title="Couleurs — action & état">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { name: "primary",       cls: "bg-primary" },
              { name: "fill-subtle",   cls: "bg-fill-subtle border border-border/30" },
              { name: "secondary",     cls: "bg-secondary border border-border/30" },
              { name: "accent",        cls: "bg-accent border border-border/30" },
              { name: "destructive",   cls: "bg-destructive" },
              { name: "ring",          cls: "ring-2 ring-ring bg-card" },
            ].map(({ name, cls }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-10 w-full rounded-lg ${cls}`} />
                <span className="text-[10px] font-mono text-text-subtle">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Texte — hiérarchie ── */}
        <Section title="Texte — 4 niveaux">
          <div className={`${layout.stack} divide-y divide-border/20`}>
            {[
              ["text-text-primary",  "text-text-primary",  "typography.label / metric / h1-h6"],
              ["text-text-secondary","text-text-secondary", "typography.body / large"],
              ["text-text-subtle",   "text-text-subtle",   "typography.sub / small / label"],
              ["text-text-disabled", "text-text-disabled", "placeholder / état désactivé"],
            ].map(([cls, label, desc]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${cls}`}>{label}</span>
                  <span className="text-xs text-text-disabled">{desc}</span>
                </div>
                <Token name={cls} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typographie dashboard ── */}
        <Section title="Typographie — dashboard">
          <div className={`${layout.stack} divide-y divide-border/20`}>
            <div className="flex items-baseline justify-between gap-4 pb-2.5">
              <span className={typography.label}>Section label uppercase</span>
              <Token name="typography.label" />
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <span className={typography.metric}>1 234</span>
              <Token name="typography.metric" />
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <span className={typography.body}>Texte de corps courant — lisible, sobre</span>
              <Token name="typography.body" />
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <span className={typography.sub}>Texte secondaire / helper</span>
              <Token name="typography.sub" />
            </div>
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <span className={typography.small}>Petit texte — info tertiaire</span>
              <Token name="typography.small" />
            </div>
          </div>
        </Section>

        {/* ── Typographie scale ── */}
        <Section title="Typographie — échelle marketing">
          <div className={`${layout.stack} divide-y divide-border/20`}>
            {(["h1","h2","h3","h4","h5","h6"] as const).map((k) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2">
                <span className={typography[k]}>Heading {k.toUpperCase()}</span>
                <Token name={`typography.${k}`} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Cards — variantes">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              ["base",        card.base,        "Border /30, bg-card"],
              ["soft",        card.soft,        "bg-muted/50, pas de border"],
              ["interactive", card.interactive, "Hover : border /60 + shadow-card"],
              ["glass",       card.glass,       "Backdrop blur, border /30"],
              ["elevated",    card.elevated,    "shadow-card, pas de border"],
            ] as const).map(([name, cls, desc]) => (
              <div key={name} className={cls}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className={typography.body}>card.{name}</span>
                  <Token name={`card.${name}`} />
                </div>
                <span className={typography.sub}>{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Metric cards ── */}
        <Section title="Metric cards — pattern dashboard">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Sessions actives",      value: "24",  sub: "+3 depuis hier" },
              { label: "Étudiants présents",    value: "318", sub: "92% de taux" },
              { label: "Retards",               value: "7",   sub: "–2 vs semaine passée" },
              { label: "Absences justifiées",   value: "12",  sub: "En attente : 4" },
            ].map(({ label, value, sub }) => (
              <div key={label} className={card.base}>
                <p className={`${typography.sub} mb-1.5`}>{label}</p>
                <p className={typography.metric}>{value}</p>
                <p className={`${typography.small} mt-0.5`}>{sub}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <button className={button.primary}>Primary</button>
            <button className={button.secondary}>Secondary</button>
            <button className={button.ghost}>Ghost</button>
          </div>
          <div className="mt-3">
            <button className={`${button.primary} ${button.fullWidth}`}>
              Primary full width
            </button>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Inputs">
          <div className={`${layout.stack} max-w-sm`}>
            <div>
              <label className={input.label}>Nom complet</label>
              <input className={input.base} placeholder="Jean Dupont" type="text" />
            </div>
            <div>
              <label className={input.label}>Notes</label>
              <textarea className={`${input.base} ${input.textarea}`} placeholder="Observation…" />
            </div>
          </div>
        </Section>

        {/* ── Radius ── */}
        <Section title="Radius scale">
          <div className="flex flex-wrap gap-4">
            {[
              ["rounded-sm",  "sm"],
              ["rounded",     "base"],
              ["rounded-md",  "md"],
              ["rounded-lg",  "lg  ← cards / inputs"],
              ["rounded-xl",  "xl"],
              ["rounded-full","full ← buttons"],
            ].map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center gap-2">
                <div className={`size-12 bg-fill-subtle border border-border/30 ${cls}`} />
                <span className="text-[10px] font-mono text-text-subtle">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Borders ── */}
        <Section title="Borders & dividers — manipulation au composant">
          <div className={layout.stack}>
            {[
              ["border-border",    "border-border    ← base (pleine intensité)"],
              ["border-border/60", "border-border/60 ← hover state"],
              ["border-border/30", "border-border/30 ← repos (cards, inputs)"],
              ["border-border/20", "border-border/20 ← séparateur de section"],
            ].map(([cls, desc]) => (
              <div key={cls} className={`border-t pt-2 ${cls}`}>
                <span className={typography.small}>{desc}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-border/30 pt-2">
              <span className={typography.small}>border-dashed border-border/30 ← label divider</span>
            </div>
          </div>
        </Section>

        <div className="py-12" />
      </main>
    </div>
  );
}
