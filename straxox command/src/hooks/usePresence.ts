import { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

export const usePresence = (room: string, userId: string) => {
  const { sendPulseMessage } = useSocket();
  const [presentUsers, setPresentUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!room || !userId) return;
    
    // Join room
    sendPulseMessage({ type: "join_room", room, userId });

    const handlePresence = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.room === room) {
        setPresentUsers(customEvent.detail.users);
      }
    };

    const handleTyping = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.room === room && customEvent.detail.userId !== userId) {
        setTypingUsers((prev) => [...new Set([...prev, customEvent.detail.userId])]);
        // clear after 3s
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== customEvent.detail.userId));
        }, 3000);
      }
    };

    window.addEventListener("pulse_presence", handlePresence);
    window.addEventListener("pulse_typing", handleTyping);

    return () => {
      sendPulseMessage({ type: "leave_room", room, userId });
      window.removeEventListener("pulse_presence", handlePresence);
      window.removeEventListener("pulse_typing", handleTyping);
    };
  }, [room, userId, sendPulseMessage]);

  const sendTyping = () => {
    sendPulseMessage({ type: "typing", room, userId });
  };

  return { presentUsers, typingUsers, sendTyping };
};
