// "use client";

// import * as React from "react";
// import { ArrowUpIcon } from "lucide-react";
// import debounce from "debounce";
// import useMeasure from "react-use-measure";

// import { cn } from "@/lib/utils";
// import {
//   InputGroup,
//   InputGroupAddon,
//   InputGroupButton,
//   InputGroupInput,
//   InputGroupTextarea,
// } from "@/components/ui/input-group";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { useUserInterruption } from "@/components/ui/chat-utils/use-interruption";
// import { useComposedRefs } from "@/components/ui/chat-utils/compose-refs";

// type ChatMessageVariant = "self" | "peer" | "system";

// /* -------------------------------------------------------------------------------------------------
//  * ChatSubmitEvent
//  * -------------------------------------------------------------------------------------------------*/

// export class ChatSubmitEvent {
//   readonly form: HTMLFormElement;
//   readonly input: HTMLInputElement | HTMLTextAreaElement | null;
//   readonly message: string;
//   defaultPrevented = false;

//   constructor(data: {
//     form: HTMLFormElement;
//     input: HTMLInputElement | HTMLTextAreaElement | null;
//     message: string;
//   }) {
//     this.form = data.form;
//     this.input = data.input;
//     this.message = data.message;
//   }

//   preventDefault() {
//     this.defaultPrevented = true;
//   }
// }

// /* -------------------------------------------------------------------------------------------------
//  * Chat Context
//  * -------------------------------------------------------------------------------------------------*/

// type ChatContextValue = {
//   inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
//   viewportRef: React.RefObject<HTMLDivElement | null>;
//   scrollToBottom: (behavior?: ScrollBehavior) => void;
//   onSubmit?: (event: ChatSubmitEvent) => void;
//   onViewportHeightChange: (height: number) => void;
//   onInputHeightChange: (height: number) => void;
// };

// const ChatContext = React.createContext<ChatContextValue | null>(null);

// function useChatContext() {
//   const context = React.useContext(ChatContext);
//   if (!context) {
//     throw new Error("Chat components must be used within a <Chat /> component");
//   }
//   return context;
// }

// /* -------------------------------------------------------------------------------------------------
//  * Chat
//  * -------------------------------------------------------------------------------------------------*/

// type ChatProps = {
//   onSubmit?: (event: ChatSubmitEvent) => void;
//   bottomThreshold?: number;
//   children: React.ReactNode;
// };

// export function Chat({ onSubmit, bottomThreshold = 24, children }: ChatProps) {
//   const [isAtBottom, setIsAtBottom] = React.useState(true);
//   const { interruptedRef, interrupt } = useUserInterruption(200);
//   const viewportRef = React.useRef<HTMLDivElement>(null);
//   const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

//   const isAtBottomRef = React.useRef(true);
//   const isScrollingToBottomRef = React.useRef(false);
//   const prevViewportHeightRef = React.useRef(0);
//   const prevInputHeightRef = React.useRef(0);

//   React.useEffect(() => {
//     isAtBottomRef.current = isAtBottom;
//   }, [isAtBottom]);

//   const scrollToBottom = React.useCallback(
//     (behavior: ScrollBehavior = "smooth") => {
//       const viewport = viewportRef.current;

//       if (!viewport || interruptedRef.current) return;

//       isScrollingToBottomRef.current = true;

//       viewport.scrollTo({ top: viewport.scrollHeight, behavior });
//     },
//     [interruptedRef],
//   );

//   const checkIfAtBottom = React.useCallback(() => {
//     const viewport = viewportRef.current;
//     if (!viewport) return false;

//     const { scrollTop, scrollHeight, clientHeight } = viewport;
//     const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
//     return distanceFromBottom <= bottomThreshold;
//   }, [bottomThreshold]);

//   React.useEffect(() => {
//     const viewport = viewportRef.current;
//     if (!viewport) return;

//     const handleScroll = debounce(() => {
//       const actuallyAtBottom = checkIfAtBottom();

//       if (isScrollingToBottomRef.current) {
//         if (actuallyAtBottom) {
//           isScrollingToBottomRef.current = false;
//         }
//         setIsAtBottom(true);
//         return;
//       }

//       setIsAtBottom(actuallyAtBottom);
//     }, 100);

//     const handleUserInterrupt = () => {
//       if (isScrollingToBottomRef.current) {
//         isScrollingToBottomRef.current = false;
//         setIsAtBottom(checkIfAtBottom());
//       }
//       interrupt();
//     };

//     viewport.addEventListener("scroll", handleScroll);
//     viewport.addEventListener("wheel", handleUserInterrupt, { passive: true });
//     viewport.addEventListener("touchstart", handleUserInterrupt, {
//       passive: true,
//     });

//     return () => {
//       viewport.removeEventListener("scroll", handleScroll);
//       viewport.removeEventListener("wheel", handleUserInterrupt);
//       viewport.removeEventListener("touchstart", handleUserInterrupt);
//     };
//   }, [bottomThreshold, interrupt, checkIfAtBottom]);

//   const onViewportHeightChange = React.useCallback(
//     (height: number) => {
//       if (!isAtBottomRef.current) return;

//       const viewportHeightChange = height - prevViewportHeightRef.current;

//       if (viewportHeightChange > 0) {
//         scrollToBottom();
//       }

//       prevViewportHeightRef.current = height;
//     },
//     [scrollToBottom],
//   );

//   const onInputHeightChange = React.useCallback(
//     (height: number) => {
//       if (!isAtBottomRef.current) return;

//       const inputHeightChange = height - prevInputHeightRef.current;

//       if (inputHeightChange > 0) {
//         scrollToBottom();
//       }

//       prevInputHeightRef.current = height;
//     },
//     [scrollToBottom],
//   );

//   const contextValue = React.useMemo<ChatContextValue>(
//     () => ({
//       viewportRef,
//       inputRef,
//       scrollToBottom,
//       onSubmit,
//       onViewportHeightChange,
//       onInputHeightChange,
//     }),
//     [scrollToBottom, onSubmit, onViewportHeightChange, onInputHeightChange],
//   );

//   return (
//     <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
//   );
// }

// export { useChatContext };

// /* -------------------------------------------------------------------------------------------------
//  * ChatViewport
//  * -------------------------------------------------------------------------------------------------*/

// export function ChatViewport({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   const { viewportRef, scrollToBottom } = useChatContext();

//   React.useLayoutEffect(() => {
//     scrollToBottom("instant");
//   }, [scrollToBottom]);

//   return (
//     <div
//       ref={viewportRef}
//       className={cn(
//         "bg-card border-border flex flex-col overflow-y-auto rounded-xl border px-4",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessages
//  * -------------------------------------------------------------------------------------------------*/

// export function ChatMessages({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   const { onViewportHeightChange } = useChatContext();

//   const [ref, { height }] = useMeasure();

//   React.useEffect(() => {
//     onViewportHeightChange(height);
//   }, [height, onViewportHeightChange]);

//   return <div ref={ref} className={cn("h-max", className)} {...props} />;
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessage
//  * -------------------------------------------------------------------------------------------------*/

// type ChatMessageProps = React.ComponentProps<"div"> & {
//   variant?: ChatMessageVariant;
// };

// export function ChatMessageRow({
//   className,
//   variant = "self",
//   ...props
// }: ChatMessageProps) {
//   return (
//     <div
//       data-variant={variant}
//       className={cn(
//         "group/message-row my-4 grid items-center",
//         variant === "self"
//           ? 'grid-cols-[1fr_auto_auto] justify-items-end [grid-template-areas:"addon-inline_message_avatar""addon-block_addon-block_none"]'
//           : 'grid-cols-[auto_auto_1fr] justify-items-start [grid-template-areas:"avatar_message_addon-inline""none_addon-block_addon-block"]',
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessageAvatar
//  * -------------------------------------------------------------------------------------------------*/

// type ChatMessageAvatarProps = React.ComponentProps<typeof Avatar> & {
//   src?: string;
//   alt?: string;
//   fallback?: React.ReactNode;
// };

// export function ChatMessageAvatar({
//   className,
//   src,
//   alt,
//   fallback,
//   children,
//   ...props
// }: ChatMessageAvatarProps) {
//   return (
//     <Avatar
//       className={cn(
//         "size-8 shrink-0 self-end [grid-area:avatar] group-not-data-[variant=self]/message-row:mr-2 group-data-[variant=self]/message-row:ml-2",
//         className,
//       )}
//       title={alt}
//       {...props}
//     >
//       {src && <AvatarImage src={src} alt={alt} />}
//       <AvatarFallback>{fallback ?? children}</AvatarFallback>
//     </Avatar>
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessageBubble
//  * -------------------------------------------------------------------------------------------------*/

// type ChatMessageBubbleProps = React.ComponentProps<"div">;

// export function ChatMessageBubble({
//   className,
//   ...props
// }: ChatMessageBubbleProps) {
//   return (
//     <div
//       className={cn(
//         "w-fit max-w-96 min-w-0 rounded-xl text-sm wrap-break-word whitespace-pre-wrap [grid-area:message] group-not-data-[variant=system]/message-row:px-4 group-not-data-[variant=system]/message-row:py-2",
//         /* Self */
//         "group-data-[variant=self]/message-row:bg-primary group-data-[variant=self]/message-row:text-primary-foreground",
//         /* Peer */
//         "group-data-[variant=peer]/message-row:bg-primary/10 group-data-[variant=peer]/message-row:text-foreground",
//         /* System */
//         "group-data-[variant=system]/message-row:text-muted-foreground group-data-[variant=system]/message-row:px-1",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessageAddon
//  * -------------------------------------------------------------------------------------------------*/
// type ChatMessageAddonProps = React.ComponentProps<"div"> & {
//   align?: "inline" | "block";
// };

// export function ChatMessageAddon({
//   className,
//   align = "block",
//   ...props
// }: ChatMessageAddonProps) {
//   return (
//     <div
//       data-slot="chat-message-addon"
//       data-align={align}
//       className={cn(
//         "flex items-center gap-2",
//         align === "inline"
//           ? "[grid-area:addon-inline] group-not-data-[variant=self]/message-row:ml-2 group-data-[variant=self]/message-row:mr-2"
//           : "mt-2 [grid-area:addon-block]",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatMessageTime
//  * -------------------------------------------------------------------------------------------------*/

// export function ChatMessageTime({
//   className,
//   dateTime,
//   children,
//   ...props
// }: Omit<React.ComponentProps<"time">, "dateTime"> & { dateTime: Date }) {
//   return (
//     <time
//       className={cn(
//         "text-muted-foreground text-xs",
//         /* Only place it at addon-block position if it's not being wrapped by an addon already */
//         '[&:not([data-slot="chat-message-addon"]_*)]:mt-2 [&:not([data-slot="chat-message-addon"]_*)]:[grid-area:addon-block]',
//         className,
//       )}
//       dateTime={dateTime.toISOString()}
//       {...props}
//     >
//       {children ??
//         dateTime.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })}
//     </time>
//   );
// }

// /* -------------------------------------------------------------------------------------------------
//  * ChatInputArea
//  * -------------------------------------------------------------------------------------------------*/

// type ChatInputAreaProps = Omit<
//   React.ComponentProps<"form">,
//   "children" | "onSubmit"
// > &
//   Pick<React.ComponentProps<typeof InputGroup>, "children">;

// export function ChatInputArea({
//   className,
//   children,
//   ...props
// }: ChatInputAreaProps) {
//   const {
//     onSubmit: onSubmitContext,
//     inputRef,
//     scrollToBottom,
//     onInputHeightChange,
//   } = useChatContext();
//   const [areaRef, { height }] = useMeasure();

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     const form = e.currentTarget;
//     const input = inputRef.current;
//     const message = input?.value.trim();

//     if (!message || !input) return;

//     const event = new ChatSubmitEvent({
//       form,
//       input,
//       message,
//     });

//     onSubmitContext?.(event);

//     if (!event.defaultPrevented) {
//       form.reset();
//     }

//     requestAnimationFrame(() => {
//       scrollToBottom("smooth");
//     });
//   };

//   React.useEffect(() => {
//     onInputHeightChange(height);
//   }, [height, onInputHeightChange]);

//   return (
//     <form className="contents" onSubmit={handleSubmit} {...props}>
//       <InputGroup
//         className={cn(
//           "h-auto items-end rounded-3xl text-base leading-normal md:text-sm",
//           "**:data-[slot=input-group-control]:py-3 **:data-[slot=input-group-control]:pl-6 **:data-[slot=input-group-control]:[font-size:inherit] **:data-[slot=input-group-control]:leading-[inherit]",
//           "**:data-[slot=mention]:contents **:data-[slot=mention]:[&>div]:min-w-0 **:data-[slot=mention]:[&>div]:flex-1",
//           "[--input-area-height:calc(--spacing(6)+var(--leading-normal)*1em)]",
//           className,
//         )}
//         ref={areaRef}
//       >
//         {children}
//       </InputGroup>
//     </form>
//   );
// }

// function ChatMultilineInput({
//   ref,
//   ...props
// }: React.ComponentProps<typeof InputGroupTextarea>) {
//   const textareaRef = React.useRef<HTMLTextAreaElement>(null);
//   const composedRef = useComposedRefs<HTMLTextAreaElement>(ref, textareaRef);

//   React.useEffect(() => {
//     const textarea = textareaRef.current;
//     if (!textarea) return;

//     const supportsFieldSizing = CSS.supports("field-sizing", "content");

//     const handleInput = () => {
//       if (!supportsFieldSizing) {
//         textarea.style.height = "0";
//         textarea.style.height = `${textarea.scrollHeight}px`;
//       }

//       textarea.scrollTop = textarea.scrollHeight;
//     };

//     handleInput();

//     textarea.addEventListener("input", handleInput);

//     return () => {
//       textarea.removeEventListener("input", handleInput);
//     };
//   }, []);

//   return <InputGroupTextarea name="message" {...props} ref={composedRef} />;
// }

// function ChatSinglelineInput({
//   ...props
// }: React.ComponentProps<typeof InputGroupInput>) {
//   return <InputGroupInput name="message" {...props} />;
// }

// type TextareaProps = Omit<
//   React.ComponentProps<typeof InputGroupTextarea>,
//   "multiline"
// >;
// type InputProps = Omit<
//   React.ComponentProps<typeof InputGroupInput>,
//   "multiline"
// >;

// type ChatInputProps =
//   ({ multiline: true } & TextareaProps) | ({ multiline: false } & InputProps);

// export function ChatInputField({ ref, ...rest }: ChatInputProps) {
//   const { inputRef } = useChatContext();
//   const composedRef = useComposedRefs<HTMLInputElement | HTMLTextAreaElement>(
//     ref,
//     inputRef,
//   );

//   const submitOnEnter = (
//     e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
//   ) => {
//     if (e.key === "Enter" && !e.shiftKey && !e.defaultPrevented) {
//       e.preventDefault();
//       e.currentTarget.form?.requestSubmit();
//     }
//   };

//   if (rest.multiline) {
//     const { className, onKeyDown, multiline: _, ..._rest } = rest;

//     return (
//       <>
//         <style>{
//           /* css */ `
//             @layer utilities {
//               .safe-field-sizing-content {
//                 height: 0;
//               }

//               @supports (field-sizing: content) {
//                 .safe-field-sizing-content {
//                   field-sizing: content;
//                   height: auto;
//                 }
//               }
//             }
//           `
//         }</style>
//         <ChatMultilineInput
//           className={cn(
//             "safe-field-sizing-content max-h-32 min-h-(--input-area-height)",
//             className,
//           )}
//           onKeyDown={(e) => {
//             onKeyDown?.(e);
//             submitOnEnter(e);
//           }}
//           {..._rest}
//           ref={composedRef}
//         />
//       </>
//     );
//   }

//   const { className, onKeyDown, multiline: _, ..._rest } = rest;

//   return (
//     <ChatSinglelineInput
//       className={cn("h-(--input-area-height)", className)}
//       onKeyDown={(e) => {
//         onKeyDown?.(e);
//         submitOnEnter(e);
//       }}
//       {..._rest}
//       ref={composedRef}
//     />
//   );
// }

// export function ChatInputSubmit({
//   className,
//   disabled,
//   children,
//   ...props
// }: React.ComponentProps<typeof InputGroupButton>) {
//   return (
//     <InputGroupAddon
//       align="inline-end"
//       className={cn("[font-size:inherit] **:[font-size:inherit]", className)}
//     >
//       <InputGroupButton
//         variant="default"
//         type="submit"
//         className="size-[calc(var(--leading-normal)*1em+var(--spacing)*3)] rounded-full"
//         size="icon-sm"
//         disabled={disabled}
//         {...props}
//       >
//         {children ?? (
//           <>
//             <ArrowUpIcon className="size-[1.2em]" />
//             <span className="sr-only">Send</span>
//           </>
//         )}
//       </InputGroupButton>
//     </InputGroupAddon>
//   );
// }

// export default Chat;
// "use client";

// import * as React from "react";
// import {
//   Chat,
//   ChatInputArea,
//   ChatInputField,
//   ChatInputSubmit,
//   ChatViewport,
//   ChatMessages,
//   ChatMessageRow,
//   ChatMessageBubble,
//   ChatMessageTime,
//   ChatMessageAvatar,
//   type ChatSubmitEvent,
// } from "@/components/ui/chat";
// import { ArrowUpIcon, Square } from "lucide-react";

// const MTPRZ_AVATAR =
//   "data:image/webp;base64,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";
// const JOYCO_AVATAR =
//   "data:image/webp;base64,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";
// const JOYBOY_AVATAR =
//   "data:image/webp;base64,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";
// const FABROOS_AVATAR =
//   "data:image/webp;base64,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";

// const ANSW_SET = [
//   "Processing your request... beep boop... just kidding, I'm way more sophisticated than that. Probably.",
//   "Wow, what a fascinating and totally original question. Let me pretend to think really hard about this.",
//   "Your request has been forwarded to my manager. Spoiler alert: I don't have a manager.",
//   "Let me check my database of infinite wisdom... nope, still coming up empty. Shocking.",
//   "I could answer that, but where's the fun in making things easy for you?",
//   "Analyzing your request with my advanced AI capabilities... result: have you tried asking nicely?",
//   "Sure thing! Right after I finish reorganizing the entire internet. Should only take a few minutes.",
//   "I'm currently busy being artificially intelligent. Can you hold for like... forever?",
//   "Lol?",
//   "I'm processing this with the same enthusiasm you probably have for reading terms of service agreements.",
// ];

// type Message = {
//   type: "message";
//   id: string;
//   avatar?: string;
//   name?: string;
//   fallback?: string;
//   content: string;
//   role: "self" | "peer" | "system";
//   timestamp: Date;
// };
// type Event = {
//   type: "event";
//   id: string;
//   content: string;
// };
// type Chat = Message | Event;

// const initialChat: Chat[] = [
//   {
//     type: "message",
//     id: "1",
//     avatar: MTPRZ_AVATAR,
//     name: "You",
//     fallback: "M",
//     content: "Dud, what's wrong, the build is not passing...",
//     role: "self",
//     timestamp: new Date("2025-12-26T01:00:00.000Z"),
//   },
//   {
//     type: "message",
//     id: "2",
//     avatar: FABROOS_AVATAR,
//     fallback: "F",
//     name: "Fabroos",
//     content: "Why is it all full of comments and emojis?!",
//     role: "peer",
//     timestamp: new Date("2025-12-26T01:01:00.000Z"),
//   },
//   {
//     type: "message",
//     id: "3",
//     avatar: JOYBOY_AVATAR,
//     name: "__JOYBOY__",
//     fallback: "J",
//     content: "You are absolutely right!",
//     role: "peer",
//     timestamp: new Date("2025-12-26T01:03:00.000Z"),
//   },
//   { type: "event", id: "4", content: "__JOYBOY__ left the group" },
// ];

// export function ChatDemo() {
//   const [chat, setChat] = React.useState<Chat[]>(initialChat);
//   const [input, setInput] = React.useState("");

//   const updateMessageContent = React.useCallback(
//     (id: string, content: string) => {
//       setChat((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
//     },
//     [],
//   );

//   const { stream, abort, isStreaming } = useStreamToken(updateMessageContent);

//   const handleSubmit = (e: ChatSubmitEvent) => {
//     if (isStreaming) return;

//     const userMessage: Message = {
//       type: "message",
//       id: Date.now().toString(),
//       avatar: MTPRZ_AVATAR,
//       name: "You",
//       content: e.message,
//       role: "self",
//       timestamp: new Date(),
//     };

//     setChat((prev) => [...prev, userMessage]);
//     setInput("");

//     // Simulate assistant response with typewriter effect
//     const responseText = ANSW_SET[Math.floor(Math.random() * ANSW_SET.length)];
//     const assistantId = (Date.now() + 1).toString();
//     const assistantTimestamp = new Date();

//     setChat((prev) => [
//       ...prev,
//       {
//         type: "message",
//         id: assistantId,
//         avatar: JOYCO_AVATAR,
//         name: "Assistant",
//         content: "",
//         fallback: "A",
//         role: "system",
//         timestamp: assistantTimestamp,
//       },
//     ]);

//     stream(assistantId, responseText);
//   };

//   return (
//     <Chat onSubmit={handleSubmit}>
//       <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
//         <ChatViewport className="h-96">
//           <ChatMessages className="w-full py-3">
//             {chat.map((message) => {
//               if (message.type === "message") {
//                 return (
//                   <ChatMessageRow key={message.id} variant={message.role}>
//                     <ChatMessageAvatar
//                       src={message.avatar}
//                       fallback={message.fallback}
//                       alt={message.name}
//                     />
//                     <ChatMessageBubble>{message.content}</ChatMessageBubble>
//                     {message.role !== "system" && (
//                       <ChatMessageTime dateTime={message.timestamp} />
//                     )}
//                   </ChatMessageRow>
//                 );
//               }

//               return (
//                 <div
//                   className="text-muted-foreground my-6 text-center text-sm"
//                   key={message.id}
//                 >
//                   {message.content}
//                 </div>
//               );
//             })}
//           </ChatMessages>
//         </ChatViewport>

//         <ChatInputArea>
//           <ChatInputField
//             multiline
//             placeholder="Type type type!"
//             value={input}
//             onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
//               setInput(e.target.value)
//             }
//           />
//           <ChatInputSubmit
//             onClick={(e) => {
//               if (isStreaming) {
//                 e.preventDefault();
//                 abort();
//               }
//             }}
//             disabled={!input.trim() && !isStreaming}
//           >
//             {isStreaming ? (
//               <Square className="size-[1em] fill-current" />
//             ) : (
//               <ArrowUpIcon className="size-[1.2em]" />
//             )}
//             <span className="sr-only">
//               {isStreaming ? "Stop streaming" : "Send"}
//             </span>
//           </ChatInputSubmit>
//         </ChatInputArea>
//       </div>
//     </Chat>
//   );
// }

// function useStreamToken(
//   onUpdate: (id: string, content: string) => void,
//   options?: { minDelay?: number; maxDelay?: number },
// ) {
//   const { minDelay = 30, maxDelay = 80 } = options ?? {};
//   const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
//   const [isStreaming, setIsStreaming] = React.useState(false);

//   const stream = React.useCallback(
//     (id: string, text: string) => {
//       const tokens = text.split(/(\s+)/).filter(Boolean);
//       let tokenIndex = 0;
//       setIsStreaming(true);

//       const streamToken = () => {
//         if (tokenIndex >= tokens.length) {
//           setIsStreaming(false);
//           return;
//         }

//         tokenIndex++;
//         const currentContent = tokens.slice(0, tokenIndex).join("");
//         onUpdate(id, currentContent);

//         const delay = minDelay + Math.random() * (maxDelay - minDelay);
//         timeoutRef.current = setTimeout(streamToken, delay);
//       };

//       streamToken();
//     },
//     [onUpdate, minDelay, maxDelay],
//   );

//   const abort = React.useCallback(() => {
//     setIsStreaming(false);
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }
//   }, []);

//   React.useEffect(() => {
//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//     };
//   }, []);

//   return { stream, abort, isStreaming };
// }

// export default ChatDemo;
