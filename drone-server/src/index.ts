import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chatStreamHandler } from "./controllers/chat.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; //引入 url 模块

// 2. 模拟 __dirname 的行为
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config(); //加载环境变量
const app = express(); //创建一个 Web 服务器实例（应用对象）
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  }),
);
// 解析 JSON 请求体
app.use(express.json());

// 注册对话流式接口
app.post("/api/chat/stream", chatStreamHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 无人机智维中间层已启动：http://localhost:${PORT}`);
});
// 1. 配置 Multer：将上传的文件临时存放在 uploads 目录下
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// 2. 新增文件上传与解析接口
app.post("/api/upload-log", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "未找到上传的文件" });
    }

    console.log(
      `[接收到飞控日志] 文件名: ${file.originalname}, 大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    );

    // ==========================================
    // 真实场景下，这里会通过 child_process 调用 Python 脚本
    // const { exec } = require('child_process');
    // exec(`python parse_ulog.py ${file.path}`, ...)
    // ==========================================

    // 3. 模拟算法降维与关键帧提取：经过 2 秒的处理，提取出了 5KB 的核心异常 JSON
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const extractedData = {
      flightTime: "14分23秒",
      firmware: "PX4 v1.13.2",
      hardware: "Pixhawk 4",
      criticalError: "ERR_EKF_GSF",
      lastTelemetry: {
        alt: "45.2m",
        satellites: 4, // 搜星骤降
        battery_voltage: "21.4V",
        motor_current_spikes: true,
      },
    };

    // 4. 清理临时文件，释放服务器空间
    fs.unlinkSync(file.path);

    // 5. 返回浓缩后的数据给前端
    res.json({
      success: true,
      message: "日志解析成功，已提取关键异常帧",
      data: extractedData,
    });
  } catch (error) {
    console.error("日志解析失败:", error);
    res.status(500).json({ error: "日志解析失败" });
  }
});
