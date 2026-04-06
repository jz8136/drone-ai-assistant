import React, { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Spin } from "antd";
import App from "../App";

//懒加载页面组件
const ChatPage = React.lazy(() => import("../pages/Chat"));
const HistoryPage = React.lazy(() => import("../pages/History"));
const SettingsPage = React.lazy(() => import("../pages/Settings"));
//全局loading组件
const PageLoading = () => (
  <div
    style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Spin size="large" tip="页面正在加载中..." />
  </div>
);
//路由配置表
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: "chat",
        element: (
          <Suspense fallback={<PageLoading />}>
            <ChatPage />
          </Suspense>
        ),
      },
      {
        path: "history",
        element: (
          <Suspense fallback={<PageLoading />}>
            <HistoryPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<PageLoading />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);
