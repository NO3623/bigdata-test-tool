# 大数据测试工具 (Big Data Test Tool)

面向大数据的线上测试平台，覆盖**测试资产 → 测试设计 → 测试执行 → 测试报告**全链路。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Vue 2.7 + Vue Router + Vuex |
| UI 库 | Element UI |
| 在线表格 | x-data-spreadsheet |
| 样式 | SCSS + CSS Variables |
| 构建 | Vue CLI 5 + Webpack 5 |

## 功能模块

### 测试资产
- **场景管理** — 场景 CRUD + 关键词搜索 + 名称唯一校验
- **数据资产** — 多条件筛选（场景/版本/表名/创建人/共享状态），资产详情含元数据画像、样例数据、共享评价
- **元数据画像** — AI 汇总表级 + 字段级画像，按版本号/表名查询

### 测试设计
- **程序清单** — 按版本库/分支/关键词/设计状态查询程序
- **作业内容** — 源表/目标表血缘管理（可增删），HQL 代码展示
- **测试要点** — 可编辑增删的要点列表
- **测试断言** — 结果集比对 OR 灵活断言 SQL（断言名称 + SQL + 比较符 + 预期值）
- **测试数据** — 左侧表切换面板 + 在线电子表格编辑 + 全屏模式 + AI 生成

### 测试执行
- 批次列表（多版本库/分支）+ 批量日期切换
- 作业级阶段进度（Steps）+ 可展开详细日志（终端风格深色查看器）
- 每阶段产物下载（Yarn 日志、表快照、断言报告）

### 测试报告
- 汇总统计卡片（程序数/通过/失败/通过率）
- 程序级通过率进度条 + 颜色分级（绿≥100% / 黄≥80% / 红<80%）

## 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:8080)
npm run serve

# 生产构建
npm run build
```

## 目录结构

```
src/
├── main.js                  # 入口
├── App.vue                  # 根组件
├── router/index.js          # 路由配置
├── store/index.js           # Vuex 状态
├── styles/
│   ├── variables.scss       # 设计 Token（色彩/间距/圆角/阴影）
│   └── global.scss          # ElementUI 覆盖 + 全局样式
├── utils/
│   ├── mock.js              # 全模块 Mock 数据
│   └── spreadsheet.js       # 表格数据格式转换工具
├── components/
│   ├── Breadcrumb.vue       # 面包屑导航
│   └── SpreadsheetEditor.vue # 在线电子表格组件（x-data-spreadsheet）
└── views/
    ├── Layout.vue            # 主布局（侧栏+顶栏+内容区）
    ├── assets/               # 测试资产
    │   ├── ScenarioManagement.vue
    │   ├── DataAssets.vue
    │   ├── DataAssetDetail.vue
    │   └── MetadataProfile.vue
    ├── design/               # 测试设计
    │   └── TestDesign.vue
    ├── execution/            # 测试执行
    │   └── TestExecution.vue
    └── report/               # 测试报告
        └── TestReport.vue
```

## 设计规范

- 主色：`#6662fe`（紫色渐变）
- 侧栏：`#0a0f1a` 深色
- 背景：`#f5f7f9` 浅灰
- 边框：`#e8eaee` 柔和分隔
- 成功/警告/失败：`#00b667` / `#faaf00` / `#ef4444`
- 页面标题渐变文字 + SVG 插画图标 + 浮动动画
- 卡片入场 fadeIn 动画（0.05s 间隔）

## 后续计划

- [ ] 替换 Mock 数据为真实后端 API
- [ ] 用户登录/权限管理
- [ ] 测试报告图表可视化（ECharts）
- [ ] WebSocket 实时执行状态推送
