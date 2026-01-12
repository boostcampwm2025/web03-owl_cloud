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
  CONSTRAINT check_oauth_user_provider CHECK(`provider` IN ('kakao', 'google')),
  UNIQUE KEY uq_oauth_provider_providerid (`provider`, `provider_id`)
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

## Rooms

### 1. 스키마

```sql
CREATE TABLE `Rooms`(
  room_id Binary(16) PRIMARY KEY,
  code CHAR(32) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),
  owner_user_id BINARY(16) NOT NULL,
  max_participants SMALLINT UNSIGNED NOT NULL,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT check_rooms_max_participants CHECK(`max_participants` > 0)
);
```

### 2. 인덱스

```sql
CREATE INDEX idx_rooms_status_deleted_at
  ON `Rooms`(`status`, `deleted_at`);

CREATE INDEX idx_rooms_owner_user_id_deleted_at
  ON `Rooms`(`owner_user_id`, `deleted_at`);
```

## Room_participants

### 1. 스키마

```sql
CREATE TABLE `Room_participants`(
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  room_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  
  CONSTRAINT fk_room_room_participants_room_id FOREIGN KEY (`room_id`) REFERENCES `Rooms`(`room_id`) ON UPDATE CASCADE ON DELETE CASCADE
);
```

### 2. 인덱스

```sql
CREATE INDEX idx_room_participants_user_id_joined_at
  ON `Room_participants`(`user_id`, `joined_at`);

CREATE INDEX idx_room_participants_room_id_left_at
  ON `Room_participants`(`room_id`, `left_at`);

CREATE INDEX idx_room_participants_room_id_user_id_left_at
  ON `Room_participants`(`room_id`, `user_id`, `left_at`);
```