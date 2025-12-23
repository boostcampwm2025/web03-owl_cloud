# 현재 적용 되고 있는 db 그룹 설정

## Users

### 1. 스키마

```sql
CREATE TABLE `Users` (
  user_id BINARY(16) PRIMARY KEY NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(16) NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Oauth_users

### 1. 스키마

```sql
CREATE TABLE `Oauth_users` (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user_id BINARY(16) NOT NULL UNIQUE,
  `provider` VARCHAR(15) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_oauth_user FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT check_oauth_user_provider CHECK(`provider` IN ('kakao', 'google'))
);
```

## User_profiles

### 1. 스키마

```sql
CREATE TABLE `User_profiles` (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user_id BINARY(16) NOT NULL UNIQUE,
  profile_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(15) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_user_profile FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT check_user_profile_mime_type CHECK(`mime_type` IN ('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'))
);
```

## Delete_users

### 1. 스키마

```sql
CREATE TABLE `Delete_users` (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user_id BINARY(16) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## User_follows

### 1. 스키마

```sql
CREATE TABLE `User_follows`(
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  follower_id BINARY(16) NOT NULL,
  following_id BINARY(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_user_follows_follower_following_id UNIQUE(`follower_id`, `following_id`),
  CONSTRAINT check_user_follows_follower CHECK(`follower_id` <> `following_id`)
);
```

### 2. INDEX

```sql
CREATE INDEX idx_user_follows_following_created_at 
  ON `User_follows` (`following_id`, `created_at`);
```

## Cards

### 1. 스키마

```sql
CREATE TABLE `Cards` (
  card_id BINARY(16) PRIMARY KEY NOT NULL,
  user_id BINARY(16) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  thumbnail_path VARCHAR(2048),
  `status` ENUM('published', 'draft', 'archived') NOT NULL,
  title VARCHAR(255) NOT NULL,
  workspace_width INT UNSIGNED NOT NULL,
  workspace_height INT UNSIGNED NOT NULL,
  background_color VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT check_cards_workspace_width_workspace_height CHECK(`workspace_width` > 0 AND `workspace_height` > 0),

  CONSTRAINT check_background_color
    CHECK (
      background_color REGEXP '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$'
      OR background_color REGEXP '^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$'
      OR background_color REGEXP '^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0(\.\d+)?|1(\.0+)?)\s*\)$'
      OR background_color IN ('transparent', 'currentColor')
    )
);
```

### 2. 인덱싱
```sql
CREATE INDEX idx_cards_user_status_deleted_updated
  ON `Cards`(user_id, `status`, deleted_at, updated_at);

CREATE INDEX idx_cards_category_status_deleted_updated
  ON `Cards` (category_id, `status`, deleted_at, updated_at);
```

## Card_items

### 1. 스키마

```sql
CREATE TABLE `Card_items` (
  item_id BINARY(16) PRIMARY KEY NOT NULL,
  card_id BINARY(16) NOT NULL,
  `type` ENUM('text', 'image', 'video') NOT NULL,
  x INT NOT NULL,
  y INT NOT NULL,
  width INT UNSIGNED NOT NULL,
  height INT UNSIGNED,
  rotation SMALLINT NOT NULL DEFAULT 0,
  scale_x DECIMAL(6,3) NOT NULL DEFAULT 1.000,
  scale_y DECIMAL(6,3) NOT NULL DEFAULT 1.000,
  opacity DECIMAL(3,2),
  z_index INT,
  is_locked BOOLEAN,
  is_visible BOOLEAN,
  `name` VARCHAR(255),
  `option` JSON NOT NULL, -- image, text, video이든 추가 적인 상태에 대해서 여기에 저장한다. 
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT fk_card_card_items_card_id FOREIGN KEY (`card_id`) REFERENCES `Cards`(`card_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT check_card_items_opacity CHECK(`opacity` IS NULL OR (`opacity` >= 0 AND `opacity` <= 1) )
);
```

### 2. INDEX

```sql
CREATE INDEX idx_card_items_card_id_deleted_at_z_index
  ON `Card_items`(`card_id`, `deleted_at`, `z_index`);
```

## Card_stats

### 1. 스키마

```sql
CREATE TABLE `Card_stats`(
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  card_id BINARY(16) NOT NULL UNIQUE,
  like_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  view_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_card_card_stat_card_id FOREIGN KEY (`card_id`) REFERENCES `Cards`(`card_id`) ON UPDATE CASCADE ON DELETE CASCADE
);
```

## Categories

### 1. 스키마
```sql
CREATE TABLE `Categories` (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Card_likes

### 1. 스키마
```sql
CREATE TABLE `Card_likes` (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  card_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_card_likes_card_id_user_id UNIQUE(`card_id`, `user_id`)
);
```

## Card_item_assets 

### 1. 스키마 
```sql
CREATE TABLE `Card_item_assets`(
  item_id BINARY(16) PRIMARY KEY NOT NULL,
  key_name VARCHAR(2048) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  `size` BIGINT UNSIGNED NOT NULL, 
  `status` ENUM('uploading', 'ready', 'failed') NOT NULL,
  card_id BINARY(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_card_item_card_item_asset_item_id FOREIGN KEY (`item_id`) REFERENCES `Card_items`(`item_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT check_card_item_asset_mime_type CHECK(`mime_type` IN (
    'image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'
  ))
);
```

### 2. INDEX
```sql
CREATE INDEX idx_card_item_assets_card_id 
  ON `Card_item_assets`(`card_id`);
```