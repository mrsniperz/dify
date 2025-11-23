#!/bin/bash

echo "🔧 创建 Dify 管理员账户"
echo "================================"

# 进入 API 容器执行 Python 脚本
docker compose exec api python3 -c "
import os
import sys
sys.path.append('/app')

from core.app import create_app
from extensions.ext_database import db
from models.account import Account
from flask import current_app

app = create_app()

with app.app_context():
    # 检查是否已有管理员账户
    admin_count = Account.query.filter_by(is_setup=True).count()
    print(f'当前已设置的管理员账户数量: {admin_count}')

    if admin_count == 0:
        print('创建管理员账户...')

        # 创建管理员账户
        admin_account = Account(
            email='admin@dify.local',
            name='Administrator',
            password='admin123456',  # 这里会被哈希
            is_active=True,
            is_setup=True,
            is_staff=True
        )

        admin_account.password = admin_account.generate_password_hash('admin123456')

        db.session.add(admin_account)
        db.session.commit()

        print('✅ 管理员账户创建成功')
        print('邮箱: admin@dify.local')
        print('密码: admin123456')
    else:
        print('已存在管理员账户，无需创建')
        # 显示现有的管理员账户
        admins = Account.query.filter_by(is_setup=True).all()
        for admin in admins:
            print(f'邮箱: {admin.email}, 名称: {admin.name}, 状态: {\"已设置\" if admin.is_setup else \"未设置\"}')"
"