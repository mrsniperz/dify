-- 创建管理员账户的 SQL 脚本
-- 密码: admin123456 (sha256 哈希)

-- 先检查是否已有管理员账户
DO $$
BEGIN
    INSERT INTO accounts (id, email, name, password, avatar_url, interface_theme, interface_language, is_setup, is_staff, is_active, status, last_active_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'admin@anyremote.cn',
        'Administrator',
        'pbkdf2:sha256$600000$8gb2JvGqjP2xyYs3zJNRg$c4b2374f9b9228e8f5e1c7a3f6e5d4b9c3e2a1f9d6e7f5c4b9c3e2a1f9d6e7',
        NULL,
        'light',
        'zh-Hans',
        TRUE,
        TRUE,
        TRUE,
        'active',
        now(),
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE SET
        SET
            password = 'pbkdf2:sha256$600000$8gb2JvGqjP2xyYs3zJNRg$c4b2374f9b9228e8f5e1c7a3f6e5d4b9c3e2a1f9d6e7f5c4b9c3e2a1f9d6e7',
            is_setup = TRUE,
            is_staff = TRUE,
            is_active = TRUE,
            status = 'active',
            updated_at = now();
$$;