#!/bin/bash

echo "🔧 直接创建 Dify 管理员账户"
echo "================================"

# 生成密码哈希
echo "生成密码哈希..."
PASSWORD="admin123456"
SALT="8gb2JvGqjP2xyYs3zJNRg"

# 使用 Python 生成 PBKDF2 哈希
HASH=$(python3 -c "
import hashlib
import binascii
import secrets
import os

password = '$PASSWORD'
salt = '$SALT'.encode()
dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 600000)
print(binascii.hexlify(dk).decode())
")

echo "密码哈希: $HASH"

echo -e "\n执行 SQL 创建用户..."

docker compose exec db_postgres psql -U postgres -d dify -c "
DO \$\$
    INSERT INTO accounts (
        id,
        email,
        name,
        password,
        avatar_url,
        interface_theme,
        interface_language,
        is_setup,
        is_staff,
        is_active,
        status,
        last_active_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'admin@anyremote.cn',
        'Administrator',
        '\$HASH',
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
        name = 'Administrator',
        password = '\$HASH',
        is_setup = TRUE,
        is_staff = TRUE,
        is_active = TRUE,
        status = 'active',
        updated_at = now();
\$\$;
\$\$

    SELECT id, email, name, is_setup, is_active, status
    FROM accounts
    WHERE email = 'admin@anyremote.cn';
\$\$;
"

echo -e "\n验证用户创建结果..."