# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指导。

> **重要**：当前项目主要使用 **apps/web-antd**，除配置项外其他子项目不要碰。所有开发工作仅在 `apps/web-antd` 中进行。

## 常用命令

```bash
# 开发
pnpm dev                    # 交互式选择应用启动
pnpm dev:antd               # 启动 antd 应用（还有 :ele, :naive, :tdesign, :play）

# 构建
pnpm build                  # 构建所有应用
pnpm build:antd             # 构建单个应用
pnpm build:analyze          # 构建并分析产物

# 测试
pnpm test:unit              # 运行所有 Vitest 单元测试（happy-dom）
pnpm test:e2e               # 运行所有 Playwright e2e 测试
pnpm -F @vben/utils run test   # 运行单个包的测试

# 检查与格式化
pnpm lint                   # 运行所有 linter
pnpm format                 # 格式化代码
pnpm check:type             # 全量 TypeScript 类型检查
pnpm check:circular         # 循环依赖检查

# 其他
pnpm clean                  # 清理 node_modules, dist, .turbo
pnpm reinstall              # 清理并重装依赖
pnpm commit                 # 交互式提交（czg）
```

## 架构

这是 **Vue Vben Admin v5.7.0**，基于 Vue 3、Vite、TypeScript 的 monorepo 后台模板，支持 Ant Design Vue、Element Plus、Naive UI、TDesign 等 UI 框架。

### 导入别名

- 应用内使用 `#/*` → `./src/*`
- 包之间使用 `@vben/*` 和 `@vben-core/*` 工作区引用

