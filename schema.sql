CREATE DATABASE IF NOT EXISTS `nhahang` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `nhahang`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `tables`;
DROP TABLE IF EXISTS `table_sessions`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `pos_shifts`;
DROP TABLE IF EXISTS `restaurant_settings`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `image_url` VARCHAR(500) NULL,
  `is_best_seller` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `table_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_id` INT NOT NULL,
  `session_token` VARCHAR(64) UNIQUE NULL,
  `customer_name` VARCHAR(100) NULL,
  `customer_phone` VARCHAR(20) NULL,
  `note` TEXT NULL,
  `start_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` TIMESTAMP NULL DEFAULT NULL,
  `payment_method` ENUM('CASH') NOT NULL DEFAULT 'CASH',
  `status` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `status` ENUM('EMPTY', 'IN_USE', 'PAID') NOT NULL DEFAULT 'EMPTY',
  `current_session_id` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tables_current_session` FOREIGN KEY (`current_session_id`) REFERENCES `table_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `table_sessions`
  ADD CONSTRAINT `fk_sessions_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE;

CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `table_id` INT NOT NULL,
  `customer_name` VARCHAR(100) NULL,
  `customer_phone` VARCHAR(20) NULL,
  `staff_name` VARCHAR(100) NULL,
  `order_source` ENUM('CUSTOMER', 'STAFF') NOT NULL DEFAULT 'CUSTOMER',
  `note` TEXT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('PENDING_APPROVAL', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SERVED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_session` FOREIGN KEY (`session_id`) REFERENCES `table_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'DONE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` TINYINT NOT NULL DEFAULT 0,
  `permissions` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pos_shifts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shift_number` INT NOT NULL DEFAULT 1,
  `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `current_order_seq` INT NOT NULL DEFAULT 0,
  `opened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `opened_by` VARCHAR(100) NULL,
  `closed_by` VARCHAR(100) NULL,
  `note` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `restaurant_settings` (
  `key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `value` TEXT NOT NULL,
  `setting_group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tables` (`id`, `name`, `status`) VALUES
(1, 'Bàn 01', 'EMPTY'),
(2, 'Bàn 02', 'EMPTY'),
(3, 'Bàn 03', 'EMPTY'),
(4, 'Bàn 04', 'EMPTY'),
(5, 'Bàn 05', 'EMPTY'),
(6, 'Bàn 06', 'EMPTY'),
(7, 'Bàn 07', 'EMPTY'),
(8, 'Bàn 08', 'EMPTY');

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Món Khai Vị'),
(2, 'Món Chính Đặc Sắc'),
(3, 'Đồ Uống & Tráng Miệng');

INSERT INTO `products` (`id`, `category_id`, `name`, `price`, `image_url`, `is_best_seller`, `is_available`) VALUES
(1, 1, 'Khoai Tây Chiên Bơ Tỏi', 45000, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500', TRUE, TRUE),
(2, 1, 'Salad Cá Hồi Xốt Chanh Leo', 89000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500', FALSE, TRUE),
(3, 1, 'Nem Nướng Nha Trang Cuộn', 65000, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500', FALSE, TRUE),
(4, 2, 'Bò Bít Tết Sốt Tiêu Đen Úc', 189000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', TRUE, TRUE),
(5, 2, 'Sườn Heo Nướng BBQ Tảng Lớn', 175000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', TRUE, TRUE),
(6, 2, 'Mì Ý Hải Sản Sốt Cà Chua Basil', 115000, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500', FALSE, TRUE),
(7, 2, 'Cơm Chiên Hải Sản Trái Thơm', 95000, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500', FALSE, TRUE),
(8, 3, 'Trà Đào Cam Sả Tươi Mát', 39000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', TRUE, TRUE),
(9, 3, 'Trà Sữa Trân Châu Đường Đen', 45000, 'https://images.unsplash.com/photo-1558857563-b37df8ff9a3d?w=500', FALSE, TRUE),
(10, 3, 'Bánh Panna Cotta Dâu Tây', 35000, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500', FALSE, TRUE);

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `permissions`, `is_active`) VALUES
(1, 'admin', '$2b$10$Ivui7Ufe1D4NXon4JBgON.wbpNkJY.YfYsnQrE5BUc8pGeCV2RynO', 'Quản Trị Viên (Admin)', 1, '["pos","reports","menu","qrcodes","users"]', TRUE),
(2, 'staff', '$2b$10$32yHmuC/yBdzVdQrUfKBeeEkj.okiqRAbZOeunVFuaSblsO8i3kZC', 'Nhân Viên Thu Ngân', 0, '["pos"]', TRUE);

INSERT INTO `pos_shifts` (`id`, `shift_number`, `status`, `current_order_seq`, `opened_at`, `opened_by`, `note`) VALUES
(1, 1, 'OPEN', 0, NOW(), 'admin', 'Ca khởi tạo mặc định');

INSERT INTO `restaurant_settings` (`key`, `value`, `setting_group`, `description`) VALUES
('announcement', 'Chào mừng quý khách đến với nhà hàng! Quý khách vui lòng chọn món trên thực đơn và xác nhận đặt món. Chúc quý khách ngon miệng!', 'announcement', 'Thông báo chạy chữ khi mở cửa'),
('closed_announcement', 'Nhà hàng đã hết giờ làm việc, vui lòng quay lại vào ngày mai. Kính chúc quý khách một ngày tốt lành!', 'announcement', 'Thông báo khi đóng ca'),
('store_name', 'DEMO RESTAURANT', 'general', 'Tên nhà hàng'),
('store_address', 'Hà Nội, Việt Nam', 'general', 'Địa chỉ nhà hàng'),
('enable_qr_order', 'true', 'general', 'Bật tắt đặt món bằng QR');

