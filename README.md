# 🏭 YOLO工业缺陷检测系统

基于Vue 3 + Vite + Ant Design Vue构建的工业缺陷检测前端系统，专为YOLO模型的人机协作缺陷识别场景设计。

## 🎯 项目概述

本系统是一个专业的工业缺陷检测前端应用，采用现代化的Web技术栈，提供直观的用户界面用于图片管理、缺陷标注、人工审核等功能。系统支持与基于Python+Flask+MySQL的后端服务进行数据交互。

## ✨ 核心功能

### 📸 图片管理
- 图片上传与批量导入
- 按日期、缺陷类型、审核状态筛选
- 列表视图与缩略图视图切换
- 图片删除与批量操作
- 检测结果导出

### 🔍 缺陷检测与标注
- YOLO模型检测结果可视化
- 缺陷标注框显示与编辑
- 支持5种缺陷类型：孔洞、裂痕、气泡、锈蚀、磨损
- 置信度显示与调整
- 手动添加/删除标注

### 👥 人机协作审核
- 人工审核确认/驳回
- 审核备注与修改记录
- 审核状态跟踪
- 快捷键操作支持

### 🖼️ 图像查看器
- 图片缩放、平移、适应窗口
- 标注框交互式编辑
- 鼠标绘制新标注
- 标注选择与属性编辑

## 🏗️ 技术栈

### 前端框架
- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器

### UI组件库
- **Ant Design Vue** - 基于Vue 3的企业级UI组件库
- **@ant-design/icons-vue** - Ant Design图标库

### 图像处理
- **Fabric.js** - 强大的2D画布库，用于图像标注

### HTTP客户端
- **Axios** - Promise based HTTP客户端

### 开发工具
- **Vite Plugin Vue DevTools** - Vue开发者工具
- **ESLint** - 代码质量检查

## 🎨 界面设计

### 布局结构
- **三栏布局**：左侧图片管理区 + 中间图像显示区 + 右侧缺陷操作区
- **顶部菜单栏**：导航与用户操作
- **底部状态栏**：系统状态与统计信息

### 视觉风格
- **现代白色主题**：清爽专业的界面设计
- **统一控件风格**：一致的按钮、输入框、表格样式
- **响应式设计**：支持>=1600x1200分辨率
- **流畅动画**：现代化的交互体验

## 🔌 后端接口对接点

### 认证接口
```javascript
// 用户登录
POST /api/auth/login
{
  "username": "string",
  "password": "string"
}

// 用户登出
POST /api/auth/logout

// 获取用户信息
GET /api/auth/user
```

### 图片管理接口
```javascript
// 获取图片列表
GET /api/images?page=1&limit=20&date_start=2024-01-01&date_end=2024-01-31&defect_type=hole&review_status=pending

// 上传图片
POST /api/images/upload
Content-Type: multipart/form-data

// 删除图片
DELETE /api/images/{image_id}

// 批量删除图片
DELETE /api/images/batch
{
  "image_ids": [1, 2, 3]
}

// 获取图片详情
GET /api/images/{image_id}
```

### YOLO检测接口
```javascript
// 触发YOLO检测
POST /api/detection/analyze/{image_id}

// 获取检测结果
GET /api/detection/results/{image_id}

// 批量检测
POST /api/detection/batch
{
  "image_ids": [1, 2, 3]
}
```

### 标注管理接口
```javascript
// 获取图片标注
GET /api/annotations/{image_id}

// 保存标注
POST /api/annotations/{image_id}
{
  "annotations": [
    {
      "defect_type": "hole",
      "bbox": [x, y, width, height],
      "confidence": 0.95
    }
  ]
}

// 更新单个标注
PUT /api/annotations/{annotation_id}
{
  "defect_type": "crack",
  "bbox": [x, y, width, height],
  "confidence": 0.87
}

// 删除标注
DELETE /api/annotations/{annotation_id}
```

### 审核管理接口
```javascript
// 提交审核
POST /api/review/{image_id}
{
  "action": "approve|reject|modify",
  "comment": "审核备注",
  "modifications": [
    {
      "annotation_id": 1,
      "defect_type": "rust",
      "confidence": 0.92
    }
  ]
}

// 获取审核历史
GET /api/review/history/{image_id}

// 获取审核统计
GET /api/review/statistics
```

### 数据导出接口
```javascript
// 导出检测结果
GET /api/export/results?format=json|csv|xml&date_start=2024-01-01&date_end=2024-01-31

// 导出审核报告
GET /api/export/review-report?format=pdf|excel&image_ids=1,2,3
```

### WebSocket实时通信
```javascript
// 连接WebSocket
ws://localhost:5000/ws

// 检测进度推送
{
  "type": "detection_progress",
  "image_id": 1,
  "progress": 75,
  "status": "processing"
}

// 审核状态更新
{
  "type": "review_update",
  "image_id": 1,
  "status": "approved",
  "reviewer": "admin"
}
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```
访问 http://localhost:3000

### 生产环境构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📁 项目结构

```
yolo-defect-detection/
├── public/                 # 静态资源
│   ├── images/samples/    # 示例图片
│   └── favicon.ico
├── src/
│   ├── components/        # 组件目录
│   │   ├── ImageManager.vue    # 图片管理组件
│   │   ├── ImageViewer.vue     # 图片查看器组件
│   │   └── DefectPanel.vue     # 缺陷面板组件
│   ├── views/            # 页面目录
│   │   ├── MainLayout.vue      # 主布局页面
│   │   ├── Dashboard.vue       # 仪表板页面
│   │   └── Login.vue          # 登录页面
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── styles/           # 样式文件
│   │   └── global.css
│   ├── App.vue          # 根组件
│   └── main.js          # 应用入口
├── package.json         # 项目配置
├── vite.config.js      # Vite配置
└── README.md           # 项目文档
```

## 🔧 配置说明

### 开发服务器配置
- 端口：3000
- 自动打开浏览器
- 热重载支持
- 路径别名：`@` 指向 `src` 目录

### 后端服务配置
在 `src/main.js` 中配置后端API基础URL：
```javascript
// 开发环境
axios.defaults.baseURL = 'http://localhost:5000/api'

// 生产环境
axios.defaults.baseURL = 'https://your-api-domain.com/api'
```

## 🎯 开发建议

### 推荐IDE设置
- **VSCode** + **Volar** 扩展（禁用Vetur）
- **Vue Language Features (Volar)**
- **TypeScript Vue Plugin (Volar)**

### 代码规范
- 使用ESLint进行代码检查
- 遵循Vue 3 Composition API最佳实践
- 组件命名采用PascalCase
- 文件命名采用kebab-case

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论区

---

**YOLO人机协作缺陷识别系统** - 让工业检测更智能、更高效！
