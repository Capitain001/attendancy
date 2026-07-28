/**
 * GooeyPopover — Usage examples
 * ============================================================
 */

// ── 1. Standalone uncontrolled ────────────────────────────────────────────
//
// Le composant gère son propre état. Aucun Provider requis.
//
//   import { GooeyPopover } from "@/components/gooey-popover";
//
//   <GooeyPopover>
//     <p className="text-sm">Contenu</p>
//   </GooeyPopover>


// ── 2. Standalone controlled ──────────────────────────────────────────────
//
//   const [open, setOpen] = useState(false);
//
//   <GooeyPopover isOpen={open} onOpenChange={setOpen}>
//     <p className="text-sm">Contenu</p>
//   </GooeyPopover>


// ── 3. Liste de cards — un seul popover ouvert à la fois ─────────────────
//
// Pattern : GooeyPopoverProvider garantit qu'un seul id est ouvert.
// Chaque card porte son propre GooeyPopover en `position: absolute`
// relatif à elle-même — zéro JS de positionnement, layout CSS pur.
//
// ┌─ GooeyPopoverProvider ───────────────────────────────────────────────┐
// │  ┌─ Card A ─────────────────────────────────────────┐               │
// │  │  [content]   [GooeyPopover — absent si pas open] │               │
// │  └──────────────────────────────────────────────────┘               │
// │  ┌─ Card B ─────────────────────────────────────────┐               │
// │  │  [content]   [GooeyPopover — monté + animé]      │  ← seul ouvert│
// │  └──────────────────────────────────────────────────┘               │
// │  ┌─ Card C ─────────────────────────────────────────┐               │
// │  │  [content]   [GooeyPopover — absent si pas open] │               │
// │  └──────────────────────────────────────────────────┘               │
// └──────────────────────────────────────────────────────────────────────┘
//
// "use client";
// import {
//   GooeyPopover,
//   GooeyPopoverProvider,
//   useGooeyPopoverItem,
// } from "@/components/gooey-popover";
//
// ── Page ──
//
// export default function CardListPage() {
//   const cards = [...];
//   return (
//     <GooeyPopoverProvider>
//       <div className="grid grid-cols-3 gap-4">
//         {cards.map((card) => (
//           <Card key={card.id} card={card} />
//         ))}
//       </div>
//     </GooeyPopoverProvider>
//   );
// }
//
// ── Card ──
//
// function Card({ card }: { card: CardData }) {
//   // isOpen / onOpenChange câblés sur le contexte partagé :
//   // ouvrir cette card ferme automatiquement l'ancienne.
//   const { isOpen, toggle } = useGooeyPopoverItem(card.id);
//
//   return (
//     <div className="relative rounded-xl border p-4 flex items-center justify-between">
//       <span>{card.title}</span>
//
//       <GooeyPopover
//         isOpen={isOpen}
//         onOpenChange={(open) => { if (!open) toggle(); }}
//         trigger={<span>⋯</span>}
//         side="top"
//       >
//         <p className="text-sm font-medium">{card.title}</p>
//         <p className="text-xs opacity-70">{card.description}</p>
//       </GooeyPopover>
//     </div>
//   );
// }
//
// Note : toggle() sans argument → useGooeyPopoverItem expose aussi
// une surcharge toggle() qui close si l'id courant est déjà ouvert.
