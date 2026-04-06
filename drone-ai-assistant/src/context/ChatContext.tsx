import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
}

// 1. 明确区分“状态”与“操作”的类型
interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  isGenerating: boolean;
}

interface ChatDispatch {
  createSession: () => void;
  switchSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessageContent: (
    sessionId: string,
    messageId: string,
    content: string,
  ) => void;
  setGenerating: (status: boolean) => void;
  deleteSession: (id: string) => void;
}

// 2. 创建一读一写两个独立的 Context
const ChatStateContext = createContext<ChatState | undefined>(undefined);
const ChatDispatchContext = createContext<ChatDispatch | undefined>(undefined);

const LOCAL_STORAGE_KEY = "drone_chat_sessions";

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [sessions, setSessions] = useState<Session[]>(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (error) {
        console.warn("读取本地缓存失败，已重置为新对话:", error);
      }
    }
    return [{ id: Date.now().toString(), title: "新对话", messages: [] }];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessions[0]?.id || null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // 3. 极致优化：使用 useCallback + 函数式更新 (prev =>)
  // 这样这些方法就不会依赖外部的 sessions 状态，它们的引用地址永远不会变！
  const createSession = useCallback(() => {
    const newId = Date.now().toString();
    setSessions((prev) => [
      { id: newId, title: "新对话", messages: [] },
      ...prev,
    ]);
    setCurrentSessionId(newId);
  }, []);

  const switchSession = useCallback(
    (id: string) => setCurrentSessionId(id),
    [],
  );

  const addMessage = useCallback((sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s,
      ),
    );
  }, []);

  const updateMessageContent = useCallback(
    (sessionId: string, messageId: string, content: string) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m,
              ),
            };
          }
          return s;
        }),
      );
    },
    [],
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);

      // 边界情况 1：如果这是最后一条会话，删完就没了，强制建一个新的空对话
      if (filtered.length === 0) {
        const newId = Date.now().toString();
        setCurrentSessionId(newId);
        return [{ id: newId, title: "新对话", messages: [] }];
      }

      // 边界情况 2：如果删除的正好是当前正在看的会话，自动切换到列表里的第一个
      setCurrentSessionId((currentId) => {
        if (currentId === id) return filtered[0].id;
        return currentId;
      });

      return filtered;
    });
  }, []);

  // 4. 缓存 Provider Value
  const stateValue = useMemo(
    () => ({ sessions, currentSessionId, isGenerating }),
    [sessions, currentSessionId, isGenerating],
  );

  const dispatchValue = useMemo(
    () => ({
      createSession,
      switchSession,
      addMessage,
      updateMessageContent,
      setGenerating: setIsGenerating,
      deleteSession,
    }),
    [
      createSession,
      switchSession,
      addMessage,
      updateMessageContent,
      deleteSession,
    ],
  );

  // 5. 嵌套包裹，将 Provider 传递下去
  return (
    <ChatStateContext.Provider value={stateValue}>
      <ChatDispatchContext.Provider value={dispatchValue}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatStateContext.Provider>
  );
};

// 6. 导出分离的 Hooks
// eslint-disable-next-line react-refresh/only-export-components
export const useChatState = () => {
  const context = useContext(ChatStateContext);
  if (!context) throw new Error("useChatState 必须在 ChatProvider 内部使用");
  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatDispatch = () => {
  const context = useContext(ChatDispatchContext);
  if (!context) throw new Error("useChatDispatch 必须在 ChatProvider 内部使用");
  return context;
};
