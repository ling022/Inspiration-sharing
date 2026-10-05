-- ============================================
-- 灵感分享平台 数据库初始化脚本
-- 数据库: magic
-- 字符集: utf8mb4
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------
-- 1. users 用户表
-- --------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`      VARCHAR(50)  NOT NULL                COMMENT '用户名(登录用)',
  `password_hash` VARCHAR(255) NOT NULL                COMMENT '密码哈希(bcrypt)',
  `nickname`      VARCHAR(50)  DEFAULT NULL            COMMENT '昵称(展示用)',
  `email`         VARCHAR(100) DEFAULT NULL            COMMENT '邮箱',
  `avatar`        VARCHAR(255) DEFAULT NULL            COMMENT '头像URL',
  `bio`           VARCHAR(255) DEFAULT NULL            COMMENT '个人简介',
  `role`          TINYINT      NOT NULL DEFAULT 0      COMMENT '0=普通用户 1=管理员',
  `balance`       DECIMAL(10,2) NOT NULL DEFAULT 0.00  COMMENT '钱包余额',
  `status`        TINYINT      NOT NULL DEFAULT 1      COMMENT '1=正常 0=封禁',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- --------------------------------------------
-- 2. categories 分类表
-- --------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`       VARCHAR(50) NOT NULL                COMMENT '分类名',
  `sort_order` INT         NOT NULL DEFAULT 0      COMMENT '排序(越小越前)',
  `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- --------------------------------------------
-- 3. inspirations 灵感表(核心)
-- --------------------------------------------
DROP TABLE IF EXISTS `inspirations`;
CREATE TABLE `inspirations` (
  `id`             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`        BIGINT        NOT NULL                COMMENT '发布者ID',
  `category_id`    BIGINT        NOT NULL                COMMENT '分类ID',
  `title`          VARCHAR(100)  NOT NULL                COMMENT '标题',
  `content`        TEXT          NOT NULL                COMMENT '详细内容',
  `cover_image`    VARCHAR(255)  DEFAULT NULL            COMMENT '封面图URL',
  `price`          DECIMAL(10,2) NOT NULL DEFAULT 0.00   COMMENT '作者定价',
  `ai_price`       DECIMAL(10,2) DEFAULT NULL            COMMENT 'AI建议价格',
  `ai_score`       TINYINT       DEFAULT NULL            COMMENT 'AI原创性评分(0-100)',
  `ai_reason`      VARCHAR(500)  DEFAULT NULL            COMMENT 'AI分析理由',
  `is_original`    TINYINT       NOT NULL DEFAULT 1      COMMENT '是否原创 1=是 0=否',
  `status`         TINYINT       NOT NULL DEFAULT 0      COMMENT '0=待审核 1=已通过 2=已拒绝 3=已下架',
  `reject_reason`  VARCHAR(255)  DEFAULT NULL            COMMENT '拒绝理由',
  `view_count`     INT           NOT NULL DEFAULT 0      COMMENT '浏览量',
  `like_count`     INT           NOT NULL DEFAULT 0      COMMENT '点赞数(冗余)',
  `favorite_count` INT           NOT NULL DEFAULT 0      COMMENT '收藏数(冗余)',
  `is_sold`        TINYINT       NOT NULL DEFAULT 0      COMMENT '是否已被购买 1=是 0=否',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_created` (`status`, `created_at`),
  KEY `idx_category_status` (`category_id`, `status`),
  KEY `idx_user` (`user_id`),
  FULLTEXT KEY `ft_title_content` (`title`, `content`),
  CONSTRAINT `fk_insp_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_insp_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='灵感表';

-- --------------------------------------------
-- 4. tags 标签表
-- --------------------------------------------
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id`   BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(30) NOT NULL                COMMENT '标签名',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- --------------------------------------------
-- 5. inspiration_tags 灵感-标签关联表
-- --------------------------------------------
DROP TABLE IF EXISTS `inspiration_tags`;
CREATE TABLE `inspiration_tags` (
  `inspiration_id` BIGINT NOT NULL COMMENT '灵感ID',
  `tag_id`         BIGINT NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`inspiration_id`, `tag_id`),
  KEY `idx_tag` (`tag_id`),
  CONSTRAINT `fk_it_insp` FOREIGN KEY (`inspiration_id`) REFERENCES `inspirations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_it_tag`  FOREIGN KEY (`tag_id`)         REFERENCES `tags`(`id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='灵感标签关联表';

-- --------------------------------------------
-- 6. likes 点赞表
-- --------------------------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id`             BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`        BIGINT   NOT NULL                COMMENT '点赞人ID',
  `inspiration_id` BIGINT   NOT NULL                COMMENT '灵感ID',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_insp` (`user_id`, `inspiration_id`),
  KEY `idx_insp` (`inspiration_id`),
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`)        REFERENCES `users`(`id`)         ON DELETE CASCADE,
  CONSTRAINT `fk_like_insp` FOREIGN KEY (`inspiration_id`) REFERENCES `inspirations`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- --------------------------------------------
-- 7. favorites 收藏表
-- --------------------------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id`             BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`        BIGINT   NOT NULL                COMMENT '收藏人ID',
  `inspiration_id` BIGINT   NOT NULL                COMMENT '灵感ID',
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_insp` (`user_id`, `inspiration_id`),
  KEY `idx_insp` (`inspiration_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`)        REFERENCES `users`(`id`)         ON DELETE CASCADE,
  CONSTRAINT `fk_fav_insp` FOREIGN KEY (`inspiration_id`) REFERENCES `inspirations`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- --------------------------------------------
-- 8. messages 私信表
-- --------------------------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id`          BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键',
  `sender_id`   BIGINT   NOT NULL                COMMENT '发送者ID',
  `receiver_id` BIGINT   NOT NULL                COMMENT '接收者ID',
  `content`     TEXT     NOT NULL                COMMENT '消息内容',
  `is_read`     TINYINT  NOT NULL DEFAULT 0      COMMENT '0=未读 1=已读',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_sender_receiver` (`sender_id`, `receiver_id`, `created_at`),
  KEY `idx_receiver_read`   (`receiver_id`, `is_read`),
  CONSTRAINT `fk_msg_sender`   FOREIGN KEY (`sender_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='私信表';

-- --------------------------------------------
-- 9. orders 订单表
-- --------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`             BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no`       VARCHAR(32)   NOT NULL                COMMENT '订单号(对外)',
  `buyer_id`       BIGINT        NOT NULL                COMMENT '买家ID',
  `seller_id`      BIGINT        NOT NULL                COMMENT '卖家ID',
  `inspiration_id` BIGINT        NOT NULL                COMMENT '灵感ID',
  `amount`         DECIMAL(10,2) NOT NULL                COMMENT '成交金额',
  `status`         TINYINT       NOT NULL DEFAULT 0      COMMENT '0=待付款 1=已付款 2=已完成 3=已取消 4=已退款',
  `paid_at`        DATETIME      DEFAULT NULL            COMMENT '支付时间',
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_buyer`  (`buyer_id`),
  KEY `idx_seller` (`seller_id`),
  KEY `idx_insp`   (`inspiration_id`),
  CONSTRAINT `fk_order_buyer`  FOREIGN KEY (`buyer_id`)       REFERENCES `users`(`id`)         ON DELETE RESTRICT,
  CONSTRAINT `fk_order_seller` FOREIGN KEY (`seller_id`)      REFERENCES `users`(`id`)         ON DELETE RESTRICT,
  CONSTRAINT `fk_order_insp`   FOREIGN KEY (`inspiration_id`) REFERENCES `inspirations`(`id`)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- --------------------------------------------
-- 10. notifications 通知表
-- --------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id`    BIGINT       NOT NULL                COMMENT '接收通知的用户ID',
  `type`       TINYINT      NOT NULL                COMMENT '1=点赞 2=收藏 3=私信 4=审核结果 5=订单',
  `content`    VARCHAR(255) NOT NULL                COMMENT '通知内容',
  `related_id` BIGINT       DEFAULT NULL            COMMENT '关联业务ID(灵感/订单等)',
  `is_read`    TINYINT      NOT NULL DEFAULT 0      COMMENT '0=未读 1=已读',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`, `is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------
-- 初始化数据
-- --------------------------------------------

-- 插入几个分类
INSERT INTO `categories` (`name`, `sort_order`) VALUES
('设计灵感', 1),
('文案创意', 2),
('产品点子', 3),
('营销玩法', 4),
('生活妙招', 5);

-- 插入一个管理员账号(密码是 123456，bcrypt 哈希，登录后请立刻改密码)
-- 实际开发请用后端注册接口生成，这里只作占位
INSERT INTO `users` (`username`, `password_hash`, `nickname`, `role`) VALUES
('admin', '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQ', '管理员', 1);