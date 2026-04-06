import React, { memo } from "react";
import { Outlet } from "react-router-dom";
import { Button, Tooltip } from "antd";
import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  ChatProvider,
  useChatState,
  useChatDispatch,
} from "./context/ChatContext";

// --- 子组件：单条会话项 (使用 memo 防止不必要的重渲染) ---
const SessionItem = memo(
  ({
    session,
    isActive,
    onSwitch,
    onDelete,
  }: {
    session: { id: string; title: string };
    isActive: boolean;
    onSwitch: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    return (
      <div
        onClick={() => onSwitch(session.id)}
        style={{
          margin: "4px 10px",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          background: isActive ? "#e6f4ff" : "transparent",
          color: isActive ? "#1677ff" : "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s",
          // 性能优化：告诉浏览器只在可见时渲染内容
          contentVisibility: "auto" as const,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflow: "hidden",
          }}
        >
          <MessageOutlined />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session.title}
          </span>
        </div>
        <Tooltip title="删除对话">
          <DeleteOutlined
            className="delete-icon"
            style={{ color: "#ff4d4f", opacity: isActive ? 1 : 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("确定要删除这条对话记录吗？")) {
                onDelete(session.id);
              }
            }}
          />
        </Tooltip>
      </div>
    );
  },
);

// --- 侧边栏组件 ---
const Sidebar = () => {
  const { sessions, currentSessionId, isGenerating } = useChatState();
  const { switchSession, createSession, deleteSession } = useChatDispatch();

  return (
    <aside
      style={{
        width: "260px",
        borderRight: "1px solid #eee",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>
          无人机智维助手
        </h3>
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={createSession}
          disabled={isGenerating}
        >
          新建对话
        </Button>
      </div>

      {/* 会话列表区域 */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: "8px" }}>
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            isActive={currentSessionId === session.id}
            onSwitch={switchSession}
            onDelete={deleteSession}
          />
        ))}
        {sessions.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#999", marginTop: "40px" }}
          >
            暂无对话记录
          </div>
        )}
      </div>
    </aside>
  );
};

// --- 主应用组件 ---
export default function App() {
  return (
    <ChatProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            background: "#fff",
          }}
        >
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}
