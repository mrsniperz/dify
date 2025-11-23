#!/bin/bash

echo "🔍 查找 Dify 正确的登录 API 路径"
echo "================================"

URL="http://fy.anyremote.cn:8184"

# 常见的登录 API 路径
login_paths=(
    "/console/api/auth/signin"
    "/console/api/auth/sign-in"
    "/api/v1/auth/signin"
    "/api/v1/auth/sign-in"
    "/v1/auth/signin"
    "/v1/auth/sign-in"
    "/auth/login"
    "/auth/signin"
    "/signin"
    "/api/auth/login"
)

echo "测试不同的登录 API 路径："

for path in "${login_paths[@]}"; do
    echo -n "测试 $path: "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost" \
        -d '{"email":"test","password":"test"}' \
        "$URL$path")

    if [ "$status" != "404" ]; then
        echo "✅ $status - 可能是正确的路径"
        # 获取更多信息
        echo "详细响应："
        curl -v -X POST \
            -H "Content-Type: application/json" \
            -H "Origin: http://localhost" \
            -d '{"email":"test","password":"test"}' \
            "$URL$path" 2>&1 | grep -E "(HTTP|Location|Set-Cookie|error)" | head -5
        echo "---"
    else
        echo "❌ $status"
    fi
done

echo -e "\n检查 API 路由列表："
echo "查看可能的认证相关路径："
curl -s "$URL/console/api/" | grep -o '"[^"]*auth[^"]*"' | head -5
echo ""
curl -s "$URL/api/" | grep -o '"[^"]*auth[^"]*"' | head -5