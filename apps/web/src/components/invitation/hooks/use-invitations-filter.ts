import { useState, useMemo } from 'react';
import type { InvitationListItem } from '@/modules/invitation';
import { resolveInvitationStatus, type InvitationStatus } from '@/modules/invitation/status';
import { Role } from '@/generated/prisma/client';

export function useInvitationsFilter(initialInvitations: InvitationListItem[]) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<InvitationStatus | 'all'>('all');

  const filteredInvitations = useMemo(() => {
    return initialInvitations.filter(inv => {
      // Recherche par email (ou par rôle dans les détails si l'email ne match pas)
      if (query) {
        const q = query.toLowerCase();
        const matchesEmail = inv.email.toLowerCase().includes(q);
        // Sometimes role is inside details, so it's good to allow search on it too
        const invRole = inv.role || inv.details?.role;
        const matchesRoleText = invRole && invRole.toLowerCase().includes(q);
        
        if (!matchesEmail && !matchesRoleText) {
          return false;
        }
      }

      // Filtre par rôle
      if (role) {
        const invRole = inv.role || inv.details?.role;
        if (invRole !== role) {
          return false;
        }
      }

      // Filtre par statut
      if (status !== 'all') {
        const invStatus = resolveInvitationStatus(inv);
        if (invStatus !== status) {
          return false;
        }
      }

      return true;
    });
  }, [initialInvitations, query, role, status]);

  return {
    query,
    setQuery,
    role,
    setRole,
    status,
    setStatus,
    filteredInvitations
  };
}
