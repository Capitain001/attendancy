// "use client";

// import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// export function OnlineStatus({ userId }: { userId: string }) {
//   const isOnline = useOnlineStatus(userId);

//   return (
//     <span
//       className={`absolute bottom-0 end-0 size-3 rounded-full border-2 border-background ${
//         isOnline ? "bg-emerald-500" : "bg-slate-200"
//       }`}
//     >
//       <span className="sr-only">{isOnline ? "Online" : "Offline"}</span>
//     </span>
//   );
// }
