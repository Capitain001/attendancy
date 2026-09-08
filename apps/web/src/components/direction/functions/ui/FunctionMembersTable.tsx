'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { UserX } from 'lucide-react'
import { useFunctionMembers } from '@/hooks/data/functions/useFunctionMembers'
import type { GetFunctionDetailDto } from '@/services/function'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif', INACTIVE: 'Inactif', SUSPENDED: 'Suspendu', ON_LEAVE: 'En congé', PENDING: 'En attente',
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default', INACTIVE: 'outline', SUSPENDED: 'destructive', ON_LEAVE: 'secondary', PENDING: 'secondary',
}

function fullName(u: { firstName: string | null; lastName: string | null }) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Sans nom'
}

function initials(u: { firstName: string | null; lastName: string | null }) {
  return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export function FunctionMembersTable({
  functionId,
  members: initialMembers,
}: {
  functionId: string
  members: NonNullable<GetFunctionDetailDto>['users']
}) {
  const { members, revoke, isRevoking } = useFunctionMembers(functionId, initialMembers)

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">Personne n'a encore cette fonction.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Attribuée par</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={m.user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(m.user)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{fullName(m.user)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[m.user.status] ?? 'outline'}>{STATUS_LABEL[m.user.status] ?? m.user.status}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {m.assignedByUser ? fullName(m.assignedByUser) : '—'}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{dateFormat.format(m.assignedAt)}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    disabled={isRevoking(m.user.id)}
                  >
                    <UserX className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Retirer cette fonction ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {fullName(m.user)} perdra immédiatement les permissions attachées à cette fonction.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revoke(m.user.id)}>Retirer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}