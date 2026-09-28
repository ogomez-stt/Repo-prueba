import ChatBoxHeader from "@/use-cases/chat/chat-box/ChatBoxHeader";
import ChatBoxBody from "@/use-cases/chat/chat-box/ChatBoxBody";
import ChatBoxSendForm from "@/use-cases/chat/chat-box/ChatBoxSendForm";
import type { ChatMessage } from "@/use-cases/chat/chat-box/ChatBoxBody";

const chatList: ChatMessage[] = [
  {
    id: 1,
    name: "Kaiya George",
    profileImage: "/images/user/user-18.jpg",
    lastActive: "15 mins",
    message: "I want to make an appointment tomorrow from 2:00 to 5:00pm?",
    isSender: false,
  },
  {
    id: 2,
    name: "Lindsey Curtis",
    profileImage: "/images/user/user-17.jpg",
    lastActive: "30 mins",
    message: "I want to make an appointment tomorrow from 2:00 to 5:00pm?",
    isSender: false,
  },
  {
    id: 3,
    name: "You",
    profileImage: "",
    lastActive: "2 hours ago",
    message: "If don't like something, I'll stay away from it.",
    isSender: true,
  },
  {
    id: 4,
    name: "Lindsey Curtis",
    profileImage: "/images/user/user-17.jpg",
    lastActive: "2 hours ago",
    message: "I want more detailed information.",
    isSender: false,
  },
  {
    id: 5,
    name: "You",
    profileImage: "",
    lastActive: "2 hours ago",
    message: "They got there early, and got really good seats.",
    isSender: true,
  },
  {
    id: 6,
    name: "Lindsey Curtis",
    profileImage: "/images/user/user-17.jpg",
    lastActive: "2 hours ago",
    message: "Please preview the image",
    isSender: false,
    imagePreview: "/images/chat/chat.jpg",
  },
];

/**
 * @kgId 7416fc487449
 */
export default function ChatBox() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4">
      <ChatBoxHeader />
      <ChatBoxBody messages={chatList} />
      <ChatBoxSendForm />
    </div>
  );
}
