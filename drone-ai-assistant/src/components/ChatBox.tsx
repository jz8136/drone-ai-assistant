import React, { useState } from "react";
import { Button, Upload, message, Tooltip, Input } from "antd";
import { SendOutlined, PaperClipOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";

const { TextArea } = Input;

// 1. 明确传入的 Props，统一使用 isGenerating 来控制禁用状态
interface ChatBoxProps {
  onSend: (text: string) => void;
  isGenerating: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ onSend, isGenerating }) => {
  // 2. 统一整合状态
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 3. 统一整合发送逻辑
  const handleSend = () => {
    if (!text.trim() || isGenerating || isUploading) return;
    onSend(text);
    setText("");
  };

  // 4. 监听键盘事件：回车发送，Shift+回车换行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // 阻止默认换行
      handleSend();
    }
  };

  // 5. 配置 Ant Design Upload 组件属性
  const uploadProps: UploadProps = {
    name: "file",
    action: "http://localhost:3000/api/upload-log",
    accept: ".ulog,.bin,.csv",
    showUploadList: false,
    beforeUpload: (file) => {
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("飞控日志文件必须小于 50MB!");
        return Upload.LIST_IGNORE;
      }
      setIsUploading(true);
      return true;
    },
    onChange(info) {
      if (info.file.status === "done") {
        setIsUploading(false);
        message.success(`${info.file.name} 解析成功！`);

        const extractedData = info.file.response.data;
        const prompt = `我上传了一份无人机飞控日志(${info.file.name})。请作为大疆/PX4飞控专家，根据以下后端提取的核心遥测数据分析坠机原因，并给出排障步骤：\n\n\`\`\`json\n${JSON.stringify(extractedData, null, 2)}\n\`\`\``;

        onSend(prompt);
      } else if (info.file.status === "error") {
        setIsUploading(false);
        message.error(`${info.file.name} 上传或解析失败。`);
      }
    },
  };

  // 6. 清理并合并 JSX 结构
  return (
    <div
      style={{
        padding: "20px",
        borderTop: "1px solid #eee",
        background: "#fff",
        display: "flex",
        gap: "10px",
        alignItems: "flex-end", // 重点：内容底部对齐，防止 TextArea 变高时左右按钮跑到上面去
      }}
    >
      {/* 附件上传按钮 */}
      <Upload {...uploadProps}>
        <Tooltip title="上传飞控日志 (.ulog, .bin)">
          <Button
            size="large"
            icon={<PaperClipOutlined />}
            loading={isUploading}
            disabled={isGenerating}
          />
        </Tooltip>
      </Upload>

      {/* 文本输入区域：使用 TextArea 替代普通 Input */}
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="描述无人机故障现象，或者上传日志片段 (Shift + Enter 换行)"
        autoSize={{ minRows: 1, maxRows: 6 }}
        disabled={isGenerating || isUploading}
        style={{ flex: 1 }}
      />

      {/* 发送按钮 */}
      <Button
        type="primary"
        size="large"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={!text.trim() || isGenerating || isUploading}
      >
        发送
      </Button>
    </div>
  );
};
