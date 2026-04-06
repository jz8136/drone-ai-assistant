//接收前端传来的消息数组和日志数据，组合成 Prompt 请求大模型，并将返回的 Stream 直接 pipe（流式写入）给前端

import type { Request, Response } from "express";
export const chatStreamHandler = async (req: Request, res: Response) => {
  const { messages, logData } = req.body;
  //设置响应头，开启sse
  //Content-Type：声明是 SSE 流
  //SSE 数据格式示例：data: hello，每一块数据都以 data: 开头
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  //Cache-Control：禁止缓存；防止浏览器缓存响应，确保每次都是实时数据
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 2. 日志协议解析与 Prompt 组装 (模拟)
  let systemPrompt =
    "你是专业的无人机智维助手，擅长分析飞控日志并提供排障建议。";
  if (logData) {
    // 实际项目中，这里可以是对 .bin 或 .csv 日志进行清洗和关键字段提取的逻辑
    systemPrompt += `\n[系统注入上下文] 这是当前无人机的飞控日志分析摘要：\n${logData}`;
  }

  // 组装最终发送给大模型的 payload
  const payload = {
    model: "gpt-3.5-turbo", // 根据你的实际模型调整
    messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
    stream: true, // 必须开启流式
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
  };

  // 3. 弱网异常重试机制：指数退避 (Exponential Backoff) + Jitter
  let response: globalThis.Response | null = null;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      response = await fetch(process.env.LLM_API_URL as string, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      // 如果请求成功，或者遇到 4xx 客户端错误（如参数错、API Key 错），直接跳出，不再盲目重试
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        break;
      }

      throw new Error(`HTTP 异常状态码: ${response.status}`);
    } catch (error) {
      console.warn(
        `[请求大模型失败] 第 ${attempt + 1} 次尝试报错:`,
        (error as Error).message,
      );

      if (attempt >= maxRetries) {
        res.write(
          `data: ${JSON.stringify({ error: "网络严重抖动，已达到最大重试次数，请稍后重试" })}\n\n`,
        );
        return res.end();
      }

      // 核心公式：基础等待时间 * 2的attempt次方 + 随机抖动(0~500ms)
      // 第0次失败等待约 1s，第1次约 2s，第2次约 4s
      const baseDelay = 1000;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;

      console.log(`[指数退避] 等待 ${Math.round(delay)}ms 后进行下一次重试...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }

  if (!response || !response.body) {
    res.end();
    return;
  }

  // 4. SSE 数据流式转发
  try {
    // 获取原生 fetch 返回的 ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // 大模型输出结束信号
        res.write("data: [DONE]\n\n");
        res.end();
        break;
      }
      // 将二进制块解码为字符串
      const chunk = decoder.decode(value, { stream: true });
      // 原样转发 SSE 数据块到前端
      res.write(chunk);
    }
  } catch (error) {
    console.error("数据转发流异常中断:", error);
    res.end();
  }
};
//指数级延时： 使用 Math.pow(2, attempt)，重试等待时间会从 1000ms 翻倍增长到 2000ms、4000ms，给网络恢复留下足够的喘息时间。

//引入 Jitter (随机抖动)： 加上了 Math.random() * 500。如果有成百上千个无人机同时断网又同时恢复，加上这几百毫秒的随机错峰，能有效避免把对方的大模型 API 瞬间打垮。

//精准放过 4xx 错误： 如果是配置写错了（如 API Key 报错 401，参数报错 400），代码会直接 break 丢给前端显示，而不是傻傻地再去重试 3 次，节约了不必要的性能开销。
