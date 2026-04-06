import { useChatState, useChatDispatch } from "../../context/ChatContext";
import { MessageList } from "../../components/MessageList";
import { ChatBox } from "../../components/ChatBox";
import React, { useRef, useEffect } from "react";

const ChatPage: React.FC = () => {
  const { sessions, currentSessionId, isGenerating } = useChatState();
  const { addMessage, updateMessageContent, setGenerating } = useChatDispatch();

  // 创建一个中止控制器引用
  const abortControllerRef = useRef<AbortController | null>(null);

  // 监听会话切换，如果切走了，直接掐断上一个没完的网络请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentSessionId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // const handleSend = async (text: string) => {
  //   if (!currentSessionId) return;

  //   // 1. 渲染用户消息
  //   const userMessage = {
  //     id: Date.now().toString(),
  //     role: "user" as const,
  //     content: text,
  //   };
  //   addMessage(currentSessionId, userMessage);

  //   // 2. 提前在界面上渲染一个空的 AI 消息占位
  //   const aiMessageId = Date.now().toString() + "_ai";
  //   addMessage(currentSessionId, {
  //     id: aiMessageId,
  //     role: "assistant",
  //     content: "",
  //   });

  //   setGenerating(true);

  //   try {
  //     // 3. 携带历史记录发起 Fetch 请求
  //     const response = await fetch("http://localhost:3000/api/chat/stream", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         // 剔除前端用的 id，只传 role 和 content 给大模型
  //         messages: [...messages, userMessage].map((m) => ({
  //           role: m.role,
  //           content: m.content,
  //         })),
  //       }),
  //     });

  //     if (!response.body) throw new Error("无数据流返回");

  //     // 4. 解析 ReadableStream
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder("utf-8");
  //     let aiFullContent = "";

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;

  //       const chunkText = decoder.decode(value, { stream: true });

  //       // 解析 OpenAI 标准的 SSE 格式 (data: {...}\n\n)
  //       const lines = chunkText.split("\n");
  //       for (const line of lines) {
  //         if (line.startsWith("data: ") && line !== "data: [DONE]") {
  //           try {
  //             const data = JSON.parse(line.slice(6));
  //             const deltaContent = data.choices?.[0]?.delta?.content;
  //             if (deltaContent) {
  //               aiFullContent += deltaContent;
  //               // 实时更新 Context 中的 AI 消息内容，触发 UI 渲染
  //               updateMessageContent(
  //                 currentSessionId,
  //                 aiMessageId,
  //                 aiFullContent,
  //               );
  //             }
  //           } catch {
  //             // 忽略截断导致的 JSON 解析错误，等待下一个 chunk
  //           }
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.error("大模型请求失败:", error);
  //     updateMessageContent(
  //       currentSessionId,
  //       aiMessageId,
  //       "（网络请求失败，请检查 Node.js 中间层或 API Key 配置）",
  //     );
  //   } finally {
  //     setGenerating(false);
  //   }
  // };
  const handleSend = async (text: string) => {
    if (!currentSessionId) return;

    // 1. 渲染用户消息
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: text,
    };
    addMessage(currentSessionId, userMessage);

    // 2. 提前在界面上渲染一个空的 AI 消息占位
    const aiMessageId = Date.now().toString() + "_ai";
    addMessage(currentSessionId, {
      id: aiMessageId,
      role: "assistant",
      content: "",
    });

    setGenerating(true);
    // 每次发请求前，实例化一个新的控制器
    abortControllerRef.current = new AbortController();

    // try {
    //   // (注意：如果你还在用前面的 setTimeout 纯前端模拟，把那段模拟代码包在 try 里面也可以，但真实开发中这里是 fetch)
    //   // 如果你是在向真实的 Node.js 发 fetch 请求，请加上 signal 参数：
    //   const response = await fetch('http://localhost:3000/api/chat/stream', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
    //     }),
    //     signal: abortControllerRef.current.signal //把遥控器交给 fetch
    //   });
    try {
      // 3. 准备一段模拟的无人机排障回复文案
      const mockResponse = `收到您的日志片段。根据分析，发现以下潜在问题：

**1. 故障现象**：
飞行器在 14:02:33 时刻，GPS 搜星数量骤降至 4 颗，触发了 'EKF Failsafe'（扩展卡尔曼滤波失效）。

**2. 可能原因**：
- 无人机当时可能飞入了高楼密集区或桥梁下方，导致多径效应严重。
- GPS 天线接线存在偶发性接触不良。
- 罗盘受到严重磁场干扰（附近有高压线或金属铁塔）。

**3. 排障建议**：
建议您先在开阔无遮挡的地带进行一次校准测试。如果问题依然存在，请拆机检查飞控上方的 GPS 端子排线是否松动。需要我为您提供详细的拆机检查图文指南吗？`;

      // 4. 纯前端模拟流式打字机效果
      let currentText = "";

      for (let i = 0; i < mockResponse.length; i++) {
        // 每次循环追加一个字符
        currentText += mockResponse[i];

        // 实时更新 Context 中的 AI 消息内容，触发 UI 渲染
        updateMessageContent(currentSessionId, aiMessageId, currentText);

        // 模拟网络延迟和打字停顿：随机等待 20 毫秒到 60 毫秒
        const randomDelay = Math.floor(Math.random() * 40) + 20;
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
      }
    } catch (error) {
      console.error("模拟请求失败:", error);
      updateMessageContent(
        currentSessionId,
        aiMessageId,
        "（模拟输出出错，请重试）",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header style={{ padding: "16px 20px", borderBottom: "1px solid #eee" }}>
        <h2 style={{ fontSize: "16px", margin: 0 }}>
          {currentSession?.title || "新对话"}
        </h2>
      </header>
      <MessageList messages={messages} />
      <ChatBox onSend={handleSend} isGenerating={isGenerating} />
    </div>
  );
};

export default ChatPage;
