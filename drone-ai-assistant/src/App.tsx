import { Outlet } from "react-router-dom";
import { Button } from "antd";
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
//引入 react-window 虚拟列表组件
//import { FixedSizeList as List } from "react-window";
import * as ReactWindow from "react-window";
const List = ReactWindow.FixedSizeList;

// 将侧边栏抽离成一个小组件
const Sidebar = () => {
  //  读写分离获取数据
  const { sessions, currentSessionId, isGenerating } = useChatState();
  const { switchSession, createSession, deleteSession } = useChatDispatch();

  // 2. 提取单行渲染组件 (Row 组件)
  // react-window 会将 index 和 style 通过 props 传给这个函数
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const session = sessions[index];
    const isActive = currentSessionId === session.id;

    return (
      <div style={{ ...style, padding: "0 10px" }}>
        <div
          onClick={() => switchSession(session.id)}
          style={{
            padding: "0 12px",
            borderRadius: "6px",
            cursor: "pointer",
            background: isActive ? "#e6f4ff" : "transparent",
            color: isActive ? "#1677ff" : "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // 👇 两端对齐
            height: "100%",
            boxSizing: "border-box",
            gap: "8px",
          }}
        >
          {/* 左侧：图标 + 标题 */}
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

          {/* 右侧：悬浮删除按钮 (当前激活的对话才显示，或者鼠标悬浮显示，这里简单起见一直显示) */}
          <DeleteOutlined
            style={{ color: "#ff4d4f", padding: "4px" }}
            onClick={(e) => {
              e.stopPropagation(); // 👇 核心：阻止事件冒泡，防止触发外层的 switchSession
              // 可以加个简单的二次确认
              if (window.confirm("确定要删除这条对话记录吗？")) {
                deleteSession(session.id);
              }
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <aside
      style={{
        width: "260px",
        borderRight: "1px solid #eee",
        background: "#fafafa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid #eee" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>无人机智维助手</h3>
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

      {/* 3. 使用 FixedSizeList 替换原本的 map 遍历 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* 外层容器必须铺满，可以通过 CSS 或者直接传具体数值给 List */}
        <List
          height={window.innerHeight - 100} // 视口高度减去顶部标题和按钮的高度 (粗略计算)
          itemCount={sessions.length} // 告诉列表总共有多少条数据
          itemSize={48} // 每行的高度固定为 48px
          width={260} // 侧边栏的宽度
        >
          {Row}
        </List>
      </div>
    </aside>
  );
};

function App() {
  return (
    <ChatProvider>
      <div
        className="app-container"
        style={{ display: "flex", height: "100vh", width: "100vw" }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
