import ChatList from "@/use-cases/chat/chat-sidebar/ChatList";
import ChatHeader from "@/use-cases/chat/chat-sidebar/ChatHeader";
import { useState } from "react";

/**
 * @kgId 4d24b9067ecc
 */
export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 transition-all duration-300 bg-gray-900/50 z-999999"
          onClick={toggleSidebar}
        ></div>
      )}
      <div className="flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:flex xl:w-1/4">
        <ChatHeader onToggle={toggleSidebar} />
        <ChatList isOpen={isOpen} onToggle={toggleSidebar} />
      </div>
    </>
  );
}
