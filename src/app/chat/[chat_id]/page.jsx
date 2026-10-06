"use client";
// app/chat/[chat_id]/page.jsx — Specific Conversation Stage (/chat/[chat_id])
import ChatStage from "@/components/ChatStage";
import { useParams } from "next/navigation";

export default function ChatSessionPage() {
  const params = useParams();
  const rawId = params?.chat_id;
  const chatId = Array.isArray(rawId) ? rawId[0] : rawId;

  return <ChatStage initialSessionId={chatId || null} />;
}
