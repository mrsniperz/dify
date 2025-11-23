#!/bin/bash

echo "🔍 测试正确的 Dify 登录 API"
echo "================================"

URL="http://fy.anyremote.cn:8184"

echo "1. 测试控制台登录 API (POST /console/api/login):"
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"admin@example.com","password":"admin123456","remember_me":false}' \
  "$URL/console/api/login" 2>&1 | tee /tmp/login_test.log

echo -e "\n2. 检查响应中的 Set-Cookie 头部："
grep -i "set-cookie\|location\|access_token" /tmp/login_test.log || echo "没有找到认证相关的响应头"

echo -e "\n3. 如果登录成功，测试获取用户信息："
# 先等待一下，然后测试
sleep 2

curl -v -H "Origin: http://localhost" \
  -H "Cookie: $(grep -i 'set-cookie' /tmp/login_test.log | head -1 | cut -d: -f2)" \
  "$URL/console/api/account/profile" 2>&1 | head -10

echo -e "\n4. 测试邮箱验证码登录 - 发送验证码："
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"admin@example.com","language":"zh-CN"}' \
  "$URL/console/api/email-code-login" 2>&1 | head -15

echo -e "\n5. 检查当前用户数据："
echo "数据库中的用户数量："
docker compose exec db_postgres psql -U postgres -d dify -c "SELECT email, name, created_at FROM accounts;" 2>/dev/null || echo "无法查询用户数据"