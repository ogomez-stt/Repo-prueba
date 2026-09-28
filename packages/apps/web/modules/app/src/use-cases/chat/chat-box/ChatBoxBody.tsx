/**
 * ChatBoxBody — Message thread display area for a chat conversation.
 *
 * Renders a scrollable list of chat messages with sender/receiver
 * differentiation, profile avatars, timestamps, and optional image
 * previews. Sender messages align right with brand color; receiver
 * messages align left with gray background and avatar.
 * @kgId a61122f2124b
 */

export interface ChatMessage {
  /** Unique identifier for the message. */
  id: number;
  /** Display name of the message author. */
  name: string;
  /** URL to the author's profile image. Empty string for the current user (sender). */
  profileImage: string;
  /** Human-readable time since the message was sent (e.g. "15 mins", "2 hours ago"). */
  lastActive: string;
  /** Text content of the message. */
  message: string;
  /** Whether this message was sent by the current user. Controls alignment and styling. */
  isSender: boolean;
  /** Optional image attachment URL displayed above the message text. */
  imagePreview?: string;
}

/**
 * @kgId 68ed663ee9d5
 */
export interface ChatBoxBodyProps {
  /** Array of messages to display in the conversation thread. */
  messages: ChatMessage[];
  /** Additional CSS classes for the scrollable container. */
  className?: string;
}

/**
 * @kgId 8c3a1f5e7d42
 */
export default function ChatBoxBody({ messages, className }: ChatBoxBodyProps) {
  return (
    <div className={`flex-1 max-h-full p-5 space-y-6 overflow-auto custom-scrollbar xl:space-y-8 xl:p-6 ${className ?? ""}`}>
      {messages.map((chat) => (
        <div
          key={chat.id}
          className={`flex ${
            chat.isSender ? "justify-end" : "items-start gap-4"
          }`}
        >
          {!chat.isSender && (
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={chat.profileImage}
                alt={`${chat.name} profile`}
                className="object-cover object-center w-full h-full"
              />
            </div>
          )}
          <div className={`${chat.isSender ? "text-right" : ""}`}>
            {chat.imagePreview && (
              <div className="mb-2 w-full max-w-[270px] overflow-hidden rounded-lg">
                <img
                  src={chat.imagePreview}
                  alt="chat"
                  className="object-cover"
                />
              </div>
            )}
            <div
              className={`px-3 py-2 rounded-lg ${
                chat.isSender
                  ? "bg-brand-500 text-white dark:bg-brand-500"
                  : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-white/90"
              } ${chat.isSender ? "rounded-tr-sm" : "rounded-tl-sm"}`}
            >
              <p className="text-sm">{chat.message}</p>
            </div>
            <p className="mt-2 text-gray-500 text-theme-xs dark:text-gray-400">
              {chat.isSender
                ? chat.lastActive
                : `${chat.name}, ${chat.lastActive}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
