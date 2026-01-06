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

