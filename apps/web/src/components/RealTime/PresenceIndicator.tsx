// // components/PresenceIndicator.tsx
// 'use client';

// import { usePresenceStatus } from '@/hooks/usePresenceStatus';

// export const PresenceIndicator = ({ userId }: { userId: string }) => {
//   const isOnline = usePresenceStatus(userId);

//   return (
//     <span className={`
//       absolute bottom-0 right-0
//       w-3 h-3 rounded-full border-2 border-white
//       ${isOnline ? 'bg-green-500' : 'bg-gray-300'}
//     `}>
//       <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
//     </span>
//   );
// };
