#!/bin/bash

echo "🔍 Dify 登录问题深度诊断"
echo "================================"

URL="http://fy.anyremote.cn:8184"

echo "1. 检查登录页面是否可访问："
curl -s -I "$URL/signin" | head -10

echo -e "\n2. 检查登录 API 端点："
echo "POST /console/api/auth/login:"
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"test@example.com","password":"test123"}' \
  "$URL/console/api/auth/login" 2>&1 | grep -E "(HTTP|Set-Cookie|Location|error)"

echo -e "\n3. 检查刷新 token 端点："
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{}' \
  "$URL/console/api/refresh-token" 2>&1 | grep -E "(HTTP|WWW-Authenticate|error)"

echo -e "\n4. 检查用户配置文件 API："
curl -v -H "Origin: http://localhost" \
  "$URL/console/api/account/profile" 2>&1 | grep -E "(HTTP|WWW-Authenticate)"

echo -e "\n5. 检查 Cookie 域和路径："
curl -v -H "Origin: http://localhost" \
  "$URL/" 2>&1 | grep -E "(Set-Cookie|Location)"

echo -e "\n6. 检查服务器日志中的错误："
docker compose logs api --tail=20 | grep -i -E "(error|auth|login|session|cookie)" || echo "没有发现明显错误"

echo -e "\n7. 测试 Web 应用状态："
curl -s -I "$URL/" | head -5