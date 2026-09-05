import React from 'react';
import { UserPlus, Link } from 'lucide-react';
import { cn } from '@/lib/utils'; // Utilitaire de fusion des classes CSS (clsx + tailwind-merge)

interface AvatarPosition {
  id: string;
  src: string;
  alt: string;
  top: string;
  left: string;
}

const AVATARS: AvatarPosition[] = [
  { id: '1', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', alt: 'Membre 1', top: '30%', left: '12%' },
  { id: '2', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', alt: 'Membre 2', top: '14%', left: '21%' },
  { id: '3', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', alt: 'Membre 3', top: '11%', left: '37%' },
  { id: '4', src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', alt: 'Membre 4', top: '18%', left: '61%' },
  { id: '5', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80', alt: 'Membre 5', top: '8%', left: '79%' },
  { id: '6', src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80', alt: 'Membre 6', top: '24%', left: '76%' },
  { id: '7', src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80', alt: 'Membre 7', top: '45%', left: '75%' },
  { id: '8', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', alt: 'Membre 8', top: '46%', left: '20%' },
  { id: '9', src: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', alt: 'Membre 9', top: '37%', left: '31%' },
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
        "relative flex flex-col items-center justify-center w-full p-8 mx-auto overflow-hidden bg-background rounded-2xl border border-border shadow-sm select-none",
        className
      )}
    >
      {/* Cercle concentrique & Avatars */}
      <div className="relative flex items-center justify-center w-full max-w-lg aspect-square -mb-16 sm:-mb-32">
        
        {/* Anneaux concentriques */}
        <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border border-border/40" />
        <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-full border border-border/50" />
        <div className="absolute inset-0 m-auto w-[46%] h-[46%] rounded-full border border-border/60" />
        <div className="absolute inset-0 m-auto w-[24%] h-[24%] rounded-full border border-border/70" />

        {/* Icône Centrale */}
        <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-muted/60 text-foreground rounded-2xl border border-border/50 backdrop-blur-sm shadow-xs">
          <UserPlus className="w-6 h-6 stroke-[1.75]" />
        </div>

        {/* Avatars autour */}
        {AVATARS.map((avatar) => (
          <div
            key={avatar.id}
            className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
            style={{ top: avatar.top, left: avatar.left }}
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden ring-2 ring-background border border-border shadow-xs bg-muted">
              <img
                src={avatar.src}
                alt={avatar.alt}
                className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Titre et sous-titre */}
      <div className="relative z-20 text-center max-w-md space-y-1.5 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-base text-muted-foreground font-normal">
          {subtitle}
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onCreateLink}
          type="button"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 border border-border rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Link className="w-4 h-4" />
          <span>Create invite link</span>
        </button>
      </div>

    </div>
  );
};

export default InviteUserPlaceholder;
