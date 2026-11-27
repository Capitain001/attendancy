// packages/ui/src/components/chat/index.ts
//packages\ui\src\components\chat\index.ts
export { ChatThread } from './ChatThread'
export { MessageList, type MessageListProps } from './MessageList'
export { MessageBubble, type MessageBubbleProps } from './MessageBubble'
export { Composer, type ComposerProps } from './Composer'
export { useDelayedFlag } from './useDelayedFlag'
export {
  HostLan,
  type HubController,
  type HubInfo,
  type HubStartOptions,
} from './lan/HostLan'
export { JoinLan, type PairingScannerProps } from './lan/JoinLan'
export {
  describeLan,
  describeOmitted,
  parsePairingInput,
  plural,
  randomToken,
  type LanTone,
  type LanView,
} from './lan/lan-status'
export {
  DEFAULT_ANONYMOUS_NAME,
  DEFAULT_MESSAGE_MAX_LENGTH,
  type ChatMessage,
  type ChatThreadProps,
  type MessageActions,
  type MessageStatus,
  type ReplyPreview,
} from './types'
export {
  GROUP_WINDOW_MS,
  dayLabel,
  formatTime,
  isSameDay,
  startsGroup,
  typingLabel,
} from './utils'
