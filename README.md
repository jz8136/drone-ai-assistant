# 🚁 无人机智维助手 (Drone AI Assistant)

> **本项目是一个专为无人机场景打造的 Web AI 系统，深度集成无人机垂直领域工作流，通信工程领域的 AI 落地实践。
> **通过全链路架构，实现了从**海量二进制飞控日志上传 -> Node.js 核心数据及异常特征降维提取 -> 动态 Prompt 组装 -> AI 专家分析 -> 前端 SSE 实时流式渲染**的完整闭环。

------

## ✨ 核心亮点 

本项目深入解决了复杂 AI 前端交互中的多项工程化痛点：

- ⚡ **海量对话长列表优化**：采用 `react-window` 实现虚拟列表 (Virtual List)，使包含上千条记录的历史会话侧边栏维持**毫秒级切换**，真实 DOM 节点始终控制在个位数，彻底杜绝页面卡顿。
- 🔄 **Context 性能极致压榨**：面对流式输出时高频触发的全局状态更新，采用 **Context 读写分离架构 (Read/Write Split)** 结合 `useMemo/useCallback`，消除组件雪崩式无效重渲染。
- 🌊 **SSE 实时流渲染与防御机制**：基于 Server-Sent Events 实现平滑的打字机输出效果。引入 `AbortController` 机制，在用户高频切换会话时精准掐断底层网络流，彻底杜绝“幽灵打字”与内存泄漏。
- 📦 **企业级构建分包策略**：深入配置 Vite 的 `manualChunks` 策略，剥离 React 核心、Ant Design 等大体积第三方依赖，配合 `rollup-plugin-visualizer` 进行产物分析，实现生产环境代码极致压缩与首屏秒开。
- 🛡️ **高可用中间层设计**：Node.js 后端不仅负责文件 `multer` 接收与降维解析，还实现了**指数退避 (Exponential Backoff) + Jitter 随机抖动**算法的防弱网重试机制，有效保护第三方 AI 接口配额。

## 🏗️ 系统架构

```
    A[前端 React] -- 1. 切片上传 50MB 飞控日志 --> B(Node.js 中间层)
    B -- 2. 模拟二进制解码 & 提取关键异常帧 --> B
    B -- 3. 浓缩为 5KB JSON 注入 Prompt --> C{大模型 LLM API}
    C -- 4. 推理分析结果 --> B
    B -- 5. SSE 数据流推送 --> A
    A -- 6. 虚拟列表 & 打字机渲染 --> A
```

## 🛠️ 技术栈

### 前端 

- **核心骨架**: React 18 + TypeScript + Vite
- **UI 规范**: Ant Design 5.x
- **状态管理**: 优化后的 React Context API (读写隔离)
- **性能优化**: `react-window` (虚拟列表), 路由懒加载, 自定义 Rollup 分包
- **通信协议**: Fetch API + Server-Sent Events (SSE) + AbortController

### 后端 

- **核心引擎**: Node.js + Express
- **文件处理**: `multer` (处理 multipart/form-data)
- **网络容错**: 自定义指数退避重试算法
- **跨域策略**: CORS 中间件配置

## 🚀 快速启动

### 1. 克隆项目

```
git clone https://github.com/jz8136/drone-ai-assistant.git
```

### 2. 后端服务启动

进入后端目录，配置大模型 API Key 后启动 Node.js 中间层：

```
cd drone-server
npm install
# 在根目录新建 .env 文件，写入大模型 API_KEY (如: LLM_API_KEY=sk-xxxx)
npm run dev
# 服务将运行在 http://localhost:3000
```

### 3. 前端服务启动

打开新的终端标签页，进入前端项目：

```
cd drone-ai-assistant
npm install
npm run dev
# 浏览器打开 http://localhost:5173 即可体验
```

### 4. 生产环境构建体验

```
npm run build
npm run preview
```

## 🧪 核心使用场景展示

1. **日常排障问答**：在底部的输入框内输入故障现象（如：“电机起飞时发出异响，且伴随 GPS 丢失”），体验极速的流式打字机回复。
2. **日志深度解析**：点击输入框左侧的 📎 按钮，上传一份无人机飞控日志 `.ulog` 文件，等待系统自动提取数据并输出极具专业性的排障指引。
3. **会话管理**：随意新建、切换、删除侧边栏的历史记录，体验在极端复杂状态下的丝滑 UI。

## 🔮 未来演进 

- [ ] 接入 Python `pyulog` 脚本，实现真正意义上的硬件二进制日志实时硬解码。
- [ ] 引入 RAG（检索增强生成），将大疆 / 极飞等官方维修手册向量化，提升专业度。
- [ ] 前端支持飞控日志数据的 ECharts 时序折线图可视化渲染。

------

*If you find this project helpful, please give it a ⭐️!*
觉得有用欢迎 Star 支持✨
