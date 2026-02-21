<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OO7qN7uDblAiJYPVxgi4TA8I9CVSUKxn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 📂 项目结构

```
├── components/        # React 组件
├── contexts/          # React Context 状态管理
├── hooks/             # 自定义 React Hooks
├── lib/               # 工具库和配置
├── utils/             # 工具函数
├── src/               # 源代码和样式
├── public/            # 静态资源
├── scripts/           # 构建和初始化脚本
├── docs/              # 📚 项目文档（配置、特性、指南）
└── dev-tools/         # 🛠️ 开发工具和测试文件
```

**文档**: 查看 [docs/](docs/) 文件夹了解详细的配置和功能文档  
**开发工具**: 查看 [dev-tools/](dev-tools/) 文件夹了解可用的开发和测试工具
