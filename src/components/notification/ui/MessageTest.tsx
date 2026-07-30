import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw, Send } from 'lucide-react'
import { type UserNotificationState } from '@/hooks/notification/useUserNotification'

type MessageTestProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => Promise<void> | void
  state: UserNotificationState
  isLoading: boolean
}

export function MessageTest({ value, onChange, onSend, state, isLoading }: MessageTestProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Notification de test
        </CardTitle>
        <CardDescription>
          Envoyer une notification de test
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Saisissez votre message de test..."
            className="flex-1"
          />
          <Button
            onClick={onSend}
            disabled={isLoading || !state.subscription || (state.subscriptions?.length ?? 0) === 0}
            className="gap-2 w-full"
            size="lg"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Envoyer une notification
          </Button>
        </div>
        
        {(!state.subscription || (state.subscriptions?.length ?? 0) === 0) && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              ⚠️ Activez les notifications pour tester l&apos;envoi
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}