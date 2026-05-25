# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

打卡精灵 — 儿童语音打卡 PWA 应用，部署在 iPad 上。儿童通过语音交互完成每日任务打卡，家长通过管理界面配置任务和查看积分。

## 常用命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 类型检查 (vue-tsc -b) + 构建 (vite build)
npm run preview   # 预览构建产物
```

## 编码规范
- 删除任何文件之前先询问
- 不要执行git push



项目无测试框架。

## 架构

纯客户端应用，无后端。所有数据存储在浏览器 IndexedDB 中。

### 双视图路由

- `/` → ChildView（儿童语音打卡主界面，默认首页）
- `/parent` → ParentView（家长管理界面，需密码验证）
- 使用 `createWebHashHistory()` 适配 GitHub Pages

### 数据流

```
语音输入 → useSpeechRecognition 捕获文本
  → parseVoiceCommand() 解析指令（query_tasks / complete_task / query_remaining / query_points）
  → executeVoiceCommand() 执行（操作 Store / 生成回复文本）
  → useSpeechSynthesis.speak() 语音播报
  → voiceStore 记录对话历史
```

手动点击打卡也走同一流程（onManualComplete → parseVoiceCommand → executeVoiceCommand → speak）。

### 关键模块

- **stores/**: 4 个 Pinia store（tasks / records / settings / voice），全部使用 Composition API 风格
- **db/index.ts**: IndexedDB 数据访问层（idb 库），数据库 `daka精灵`，含 tasks / records / settings 三个 Object Store
- **composables/**: 语音识别（useSpeechRecognition）、语音合成（useSpeechSynthesis）、语音指令解析与执行（useVoiceCommands）
- **types/index.ts**: 全局类型定义

### iOS Safari 适配要点

语音合成需特别处理多个 iOS Safari bug：
- `prime()` 在用户手势中预触发，否则后续异步 speak 无声
- `cancel()` 后需延迟 100ms 再 `speak()`
- 显式选择中文语音（`getChineseVoice()`），防止使用默认无声音
- `startResumeKeeper()` 每 3 秒检测并 `resume()`，防止播报 15 秒后自动暂停
- VoiceButton 用 `touchUsed` 标志避免 touch 事件后重复触发 click

## 部署

GitHub Pages（`/daka-jingling/` 子路径），推送 main 分支触发 GitHub Actions 自动部署。
