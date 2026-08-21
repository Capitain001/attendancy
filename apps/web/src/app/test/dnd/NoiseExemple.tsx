// app/example-noise-usage.tsx
// import { BackgroundPattern, NoiseFilterDefs } from "@/components/design/BackgroundPattern";

import { BackgroundPattern } from "@/components/design/BackgroundPattern";

export default function ExampleNoiseUsage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/*
        À monter UNE SEULE FOIS dans le layout racine (app/layout.tsx)
        si tu utilises shared={true} quelque part dans l'app.
        Inutile si tu n'utilises que le mode par-instance.
      */}
      {/* <NoiseFilterDefs baseFrequency={0.8} numOctaves={3} /> */}

      {/* ── 1. Pattern image existant, comportement inchangé ── */}
      <div className="relative h-40 rounded-xl  overflow-hidden">
        <BackgroundPattern pattern="pattern-dots" className="graycicale" opacity={0.3} />
        <p className="relative p-4 text-white">Pattern dots (existant, inchangé)</p>
      </div>

      <div className="relative h-40 rounded-xl  overflow-hidden">
        <BackgroundPattern pattern="pattern-noise" opacity={0.55} />
        <p className="relative p-4 text-white">Pattern noise PNG (existant, inchangé)</p>
      </div>

      {/* ── 2. Nouveau noise SVG, mode par-instance (paramétrable) ── */}
      <div className="relative h-40 rounded-xl bg-neutral-900 overflow-hidden">
        <BackgroundPattern
          pattern="pattern-noise-svg"
          baseFrequency={0.9}
          numOctaves={4}
          opacity={0.15}
          className="w-full"
        />
        <p className="relative p-4 text-white">Noise SVG — grain fin, instance dédiée</p>
      </div>

      <div className="relative h-40 rounded-xl  overflow-hidden">
        <BackgroundPattern
          pattern="pattern-noise-svg"
          baseFrequency={0.5}
          numOctaves={2}
          opacity={0.5}
        />
        <p className="relative p-4 text-white">Noise SVG — grain fort, instance dédiée</p>
      </div>

      {/* ── 3. Noise SVG, mode partagé (perf : un seul filtre pour toutes) ── */}
      <div className="relative h-32 rounded-xl bg-neutral-800 overflow-hidden">
        <BackgroundPattern pattern="pattern-noise-svg" shared opacity={0.2} />
        <p className="relative p-4 text-white">Card A — filtre partagé</p>
      </div>

      <div className="relative h-32 rounded-xl bg-neutral-800 overflow-hidden">
        <BackgroundPattern pattern="pattern-noise-svg" shared opacity={0.4} />
        <p className="relative p-4 text-white">Card B — même filtre partagé, opacité différente</p>
      </div>

      {/* ── 4. Désactiver l'inversion dark mode sur le noise SVG ── */}
      <div className="relative h-32 rounded-xl  overflow-hidden">
        <BackgroundPattern
          pattern="pattern-noise-svg"
          shared
          opacity={0.3}
          invertOnDark={false}
        />
        <p className="relative p-4 text-white">Noise SVG — identique en light/dark (invertOnDark=false)</p>
      </div>

      {/* ── 5. Style custom (z-index, blend mode, etc.) ── */}
      <div className="relative h-32 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden">
        <BackgroundPattern
          pattern="pattern-noise-svg"
          shared
          opacity={0.35}
          style={{ mixBlendMode: "overlay" }}
        />
        <p className="relative p-4 text-white">Noise SVG en overlay sur un gradient</p>
      </div>
    </div>
  );
}