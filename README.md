# Web for myself

可扩展的网站大全项目，当前首版上线模块为“个人工具”，并预留后续模块：工作效率、娱乐创意、学习教育、社交互动。

## 本地开发

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 构建与静态导出

```bash
npm run lint
npm run build
```

项目使用 Next.js `output: "export"`，构建后静态文件输出在 `out/`。

## GitHub Pages 自动部署

仓库已包含工作流文件：`.github/workflows/deploy.yml`。

首次启用请在 GitHub 仓库设置中操作：

1. 打开 Settings -> Pages。
2. Build and deployment 的 Source 选择 GitHub Actions。
3. 推送到 `main` 分支后会自动触发部署。

工作流会在构建时自动读取仓库名并注入 `NEXT_PUBLIC_REPO_NAME`，用于 `basePath`。

## 项目结构

- `app/`：页面路由与布局
- `components/`：通用布局组件
- `features/site-directory/`：站点目录功能组件
- `data/`：模块数据源（JSON）
- `types/`：类型定义
- `lib/`：模块元数据、数据读取与校验

## 新增模块（后续扩展）

1. 在 `data/` 新增同构 JSON。
2. 在 `lib/modules.ts` 注册模块信息。
3. 在 `lib/site-data.ts` 注册数据映射。
4. 访问 `/category/<slug>/` 验证展示。
