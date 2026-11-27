// packages/ui/src/styles/ui/chat.ts

// Classes propres au chat, construites uniquement avec les tokens sémantiques du design system
// (jamais de couleur en dur). Les états ne reposent pas sur la couleur seule : bordure
// pointillée, point creux, libellé texte.
import { cn } from '../../lib/utils'

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Sur écran à pointeur précis, les actions d'un message n'apparaissent qu'au survol ou au focus ;
// sur écran tactile elles restent visibles (pas de survol possible).
const hoverReveal = cn(
  '[@media(hover:hover)]:opacity-0',
  '[@media(hover:hover)]:group-hover:opacity-100',
  '[@media(hover:hover)]:group-focus-within:opacity-100',
)

// Bouton textuel compact : actions de message, bandeaux, liens d'état
const textButton = cn(
  'rounded-md px-2 py-1 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50',
  focus,
)

export const chat = {
  focus,
  textButton,

  shell: 'flex h-full min-h-0 flex-col bg-background text-foreground',
  header: 'flex items-center gap-3 border-b border-border px-4 py-3',
  backLink: cn('hidden items-center rounded-md px-2 py-1 text-foreground/70 hover:bg-secondary max-md:inline-flex', focus),
  dot: 'inline-block size-2 shrink-0 rounded-full border',
  banner: 'border-b border-border bg-secondary px-4 py-2 text-foreground',

  listWrap: 'relative min-h-0 flex-1',
  // overflow-anchor: la position est restaurée à la main (Safari ne l'implémente pas) ;
  // laisser le navigateur ancrer aussi corrigerait deux fois.
  scroller: 'h-full overflow-y-auto overscroll-contain px-4 py-4 [overflow-anchor:none]',
  day: 'my-4 flex justify-center',
  dayLabel: 'rounded-full bg-secondary px-3 py-1 text-foreground/70',
  note: 'py-2 text-center text-foreground/60',
  jumpPill: cn(
    'absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-card-foreground shadow-md',
    focus,
  ),

  row: 'group flex flex-col',
  author: 'mb-1 px-1 font-medium text-foreground/80',
  bubble: 'max-w-[min(36rem,85%)] break-words rounded-2xl px-3 py-2',
  bubbleOwn: 'rounded-br-md bg-secondary text-foreground',
  bubbleOther: 'rounded-bl-md border border-border bg-card text-card-foreground',
  bubbleSending: 'opacity-70',
  bubbleFailed: 'border border-destructive',
  bubbleUnverified: 'border-dashed',
  highlight: 'ring-2 ring-ring',
  quote: 'mb-2 block w-full border-l-2 border-border pl-2 text-left text-foreground/70',
  meta: 'mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-foreground/60',
  actions: cn('flex items-center gap-1', hoverReveal),
  editor: cn(
    'min-h-[2.5rem] w-full min-w-[16rem] resize-none rounded-[var(--radius)] border border-border bg-input-surface px-3 py-2 text-foreground focus-visible:border-input-focus',
    focus,
  ),

  composer: 'border-t border-border px-4 py-3',
  field: cn(
    'max-h-40 min-h-[2.5rem] w-full resize-none rounded-[var(--radius)] border border-border bg-input-surface px-3 py-2 text-foreground placeholder:text-foreground/50 focus-visible:border-input-focus',
    focus,
  ),
  replyBar: 'mb-2 flex items-start gap-2 border-l-2 border-border pl-2',
} as const