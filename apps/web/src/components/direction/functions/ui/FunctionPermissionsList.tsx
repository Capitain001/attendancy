import { Badge } from '@/components/ui/badge'
import { permissionLabel } from '@/services/permission'
import type { GetFunctionDetailDto } from '@/services/function'

export function FunctionPermissionsList({
  permissions,
}: {
  permissions: NonNullable<GetFunctionDetailDto>['permissions']
}) {
  if (permissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">Cette fonction ne porte aucune permission directe.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y rounded-lg border">
      {permissions.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{permissionLabel(p.action, p.resource, p.description)}</p>
            {p.expiresAt && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Expire le {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(p.expiresAt)}
              </p>
            )}
          </div>
          <Badge variant="outline">{p.action}</Badge>
        </li>
      ))}
    </ul>
  )
}