import React, { useRef, useEffect } from "react";
import type { Message } from "../context/ChatContext";

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // 1. 创建一个引用，指向列表底部
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. 监听 messages 的变化，触发平滑滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ccc",
        }}
      >
        上传飞控日志或直接输入问题开始排障分析
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              maxWidth: "70%",
              padding: "12px 16px",
              borderRadius: "8px",
              background: msg.role === "user" ? "#1677ff" : "#f0f0f0",
              color: msg.role === "user" ? "#fff" : "#000",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap", // 确保大模型的换行符能正常显示
            }}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {/* 3. 在列表最末尾放置一个不可见的锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
};
