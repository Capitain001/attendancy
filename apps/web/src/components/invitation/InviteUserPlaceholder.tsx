import React from 'react';
import { Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarItem {
  id: string;
  src: string;
  alt: string;
  rotate: string; // Rotation individuelle pour donner un effet d'éventail/stack naturel
  scale: string;
}

const AVATARS: AvatarItem[] = [
  { id: '1', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', alt: 'Membre 1', rotate: '-rotate-12', scale: 'scale-90' },
  { id: '2', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', alt: 'Membre 2', rotate: 'rotate-6', scale: 'scale-95' },
  { id: '3', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', alt: 'Membre 3', rotate: '-rotate-3', scale: 'scale-100' },
  { id: '4', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', alt: 'Membre 4', rotate: 'rotate-12', scale: 'scale-105' },
];

interface InviteUserPlaceholderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  onCreateLink?: () => void;
}

export const InviteUserPlaceholder: React.FC<InviteUserPlaceholderProps> = ({
  title = "Invite your first user",
  subtitle = "Add your team members and external users.",
  className,
  onCreateLink,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-6 sm:p-8 mx-auto overflow-hidden bg-background rounded-2xl border border-border shadow-xs select-none",
        className
      )}
    >
      {/* Graphic Area : Anneaux concentriques + Stack central d'avatars */}
      <div className="relative flex items-center justify-center size-48 sm:size-56 shrink-0 -mt-4 -mb-6">
        {/* Anneaux concentriques */}
        <div className="absolute inset-0 m-auto size-[100%] rounded-full border border-border/40" />
        <div className="absolute inset-0 m-auto size-[75%] rounded-full border border-border/50" />
        <div className="absolute inset-0 m-auto size-[50%] rounded-full border border-border/60" />
        <div className="absolute inset-0 m-auto size-[28%] rounded-full border border-border/70" />

        {/* Pile d'avatars empilés au CENTRE exact (Superposition 3D) */}
        <div className="relative z-10 flex items-center justify-center size-12">
          {AVATARS.map((avatar, index) => (
            <div
              key={avatar.id}
              className={cn(
                "absolute size-11 sm:size-12 rounded-xl overflow-hidden ring-2 ring-background border border-border shadow-md transition-all duration-300 hover:scale-125 hover:z-30 hover:rotate-0",
                avatar.rotate,
                avatar.scale
              )}
              style={{ zIndex: index + 1 }}
            >
              <img
                src={avatar.src}
                alt={avatar.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Titre et sous-titre */}
      <div className="relative z-20 text-center max-w-md space-y-1 my-3">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          {subtitle}
        </p>
      </div>

      {/* Bouton d'action */}
      {onCreateLink && (
        <div className="relative z-20 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-1">
          <button
            onClick={onCreateLink}
            type="button"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Link className="size-4" />
            <span>Créer un lien d'invitation</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default InviteUserPlaceholder;