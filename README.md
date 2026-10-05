# 灵感分享平台

面向创作者和灵感需求者的内容分享与交易平台。用户可以发布原创灵感、浏览检索、点赞收藏、私信沟通并完成购买；管理员负责内容审核、用户管理、订单管理和提现审核。

## 目录

- [项目预览](#项目预览)
- [技术栈](#技术栈)
- [功能模块](#功能模块)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [核心设计](#核心设计)
- [数据库设计](#数据库设计)
- [TODO](#todo)
- [License](#license)

## 项目预览

> 在线地址：（部署后填写）
>
> 
>首页
> ![首页](https://github.com/user-attachments/assets/5e7c6bcf-d7be-4ff0-8ccc-e7f378c19ec6)
>详情页
> ![详情页](https://github.com/user-attachments/assets/e02a9d18-dfda-416f-ba17-4ae4c3578124)
>私信
> ![私信](https://github.com/user-attachments/assets/1104da2d-fc48-42f3-ade8-3d040f71e99f)
>管理端
> ![管理端](https://github.com/user-attachments/assets/b85e7c4b-04ec-4090-8875-c7bf28d58869)

## 技术栈

### 前端

- Vue 3（Composition API）
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Socket.IO Client
- mitt
- dayjs

### 后端

- Node.js
- Express
- MySQL（mysql2）
- JWT（jsonwebtoken）
- bcryptjs
- Socket.IO
- zod
- dotenv

### 数据库

- MySQL 8.0

## 功能模块

### 用户端

- 注册 / 登录 / 退出（JWT 鉴权）
- 灵感广场：无限滚动、关键词搜索、分类筛选、原创筛选、骨架屏、图片懒加载
- 灵感详情：点赞、收藏、私信作者、购买
- 个人中心：资料修改、我的发布、我的收藏、我买到的
- 发布灵感：分类、标签、封面、AI 自动估值
- 私信：会话列表、实时聊天（Socket.IO）
- 通知中心：审核结果、订单、私信实时推送
- 钱包：余额、提现申请、提现记录
- 订单：下单、支付（模拟）、取消、查看

### 管理端

- 灵感审核（通过 / 拒绝 + 拒绝理由）
- 用户管理（封禁 / 解封 / 重置密码）
- 订单管理
- 提现审核（通过 / 拒绝）

## 项目结构

    magic/
    ├── frontend/                 # 前端 Vue3 项目
    │   ├── src/
    │   │   ├── api/              # axios 封装、socket 封装、事件总线
    │   │   ├── components/       # 公共组件（NavBar 等）
    │   │   ├── views/            # 页面
    │   │   ├── router/           # 路由配置 + 路由守卫
    │   │   ├── utils/            # 工具（防抖 / 节流 / 格式化）
    │   │   └── main.js
    │   ├── .env.development
    │   ├── .env.production
    │   └── vite.config.js
    │
    ├── backend/                  # 后端 Node.js 项目
    │   ├── src/
    │   │   ├── routes/           # 路由（auth / list / profile / order / wallet）
    │   │   ├── middlewares/      # 中间件（checkToken / adminOnly / validate）
    │   │   ├── schemas/          # zod 参数校验规则
    │   │   ├── utils/            # AI 工具、JWT 工具
    │   │   ├── db/               # 数据库连接池
    │   │   └── app.js
    │   ├── sql/init.sql          # 建表 SQL
    │   └── .env
    │
    └── README.md

## 快速开始

### 1. 克隆项目

    git clone https://github.com/你的用户名/magic.git
    cd magic

### 2. 初始化数据库

    CREATE DATABASE magic DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

执行 `backend/sql/init.sql` 建表。

### 3. 后端启动

    cd backend
    npm install

新建 `backend/.env` 文件：

    PORT=3000
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=你的数据库密码
    DB_NAME=magic
    JWT_SECRET=一个随机字符串
    JWT_EXPIRES_IN=7d

    # AI 接口（如使用）
    DASHSCOPE_API_KEY=你的key

启动后端：

    npm run dev

### 4. 前端启动

    cd frontend
    npm install

新建 `frontend/.env.development`：

    VITE_API_BASE_URL=http://localhost:3000/api

启动前端：

    npm run dev

浏览器访问 `http://localhost:5173`。

## 核心设计

### 1. 权限控制

- 基于 JWT 的认证，前端 Axios 拦截器自动携带 token
- 后端 `checkToken` 中间件验证 token
- 后端 `adminOnly` 中间件限制管理员接口
- 前端路由守卫按角色控制页面访问

### 2. 订单状态机

    待付款 → 已付款 → 已完成
       ↓         ↓
    已取消     已退款

通过 MySQL 事务保证「下单 + 标记灵感已售 + 卖家入账 + 站内通知」的数据一致性。

### 3. 并发下单防超卖

使用原子操作：

    UPDATE inspirations SET is_sold = 1 WHERE id = ? AND is_sold = 0

通过 `affectedRows` 判断是否抢占成功，失败则退款。

### 4. 实时通信

- Socket.IO 按用户 id 加入房间（`user_${userId}`）
- 后端通过 `io.to('user_x').emit(...)` 定向推送
- 前端通过 `socket.on('new-message' / 'notification')` 接收
- 前端组件间通过 mitt 事件总线同步未读状态

### 5. 参数校验

- 后端使用 zod 定义 schema，中间件统一校验
- 前端做基础校验提升体验

### 6. 性能优化

- 首页无限滚动 + 节流
- 图片懒加载（原生 `loading="lazy"`）
- 首次加载骨架屏

## 数据库设计

共 11 张表：

| 表名 | 说明 |
|------|------|
| `users` | 用户 |
| `categories` | 分类 |
| `inspirations` | 灵感 |
| `tags` | 标签 |
| `inspiration_tags` | 灵感-标签关联 |
| `likes` | 点赞 |
| `favorites` | 收藏 |
| `messages` | 私信 |
| `orders` | 订单 |
| `notifications` | 通知 |
| `withdrawals` | 提现记录 |

## TODO

- [ ] 接入真实支付（微信 / 支付宝）
- [ ] 使用 Redis 缓存热点数据
- [ ] 增加单元测试
- [ ] 部署上线（Nginx + PM2）
- [ ] 接入 Elasticsearch 优化搜索

## License

MIT
