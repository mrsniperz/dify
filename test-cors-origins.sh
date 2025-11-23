#!/bin/bash

echo "🔍 测试不同 Origin 的 CORS 响应"
echo "================================"

URL="http://fy.anyremote.cn:8184/console/api/account/profile"

echo "1. 测试无 Origin 的 OPTIONS 请求："
curl -v -X OPTIONS "$URL" 2>&1 | grep -E "(Access-Control|HTTP)"

echo -e "\n2. 测试带 Origin 的 OPTIONS 请求："
curl -v -X OPTIONS -H "Origin: http://localhost" "$URL" 2>&1 | grep -E "(Access-Control|HTTP)"

echo -e "\n3. 测试带不同 Origin 的 OPTIONS 请求："
curl -v -X OPTIONS -H "Origin: https://example.com" "$URL" 2>&1 | grep -E "(Access-Control|HTTP)"

echo -e "\n4. 测试 GET 请求的 CORS 头部："
curl -v -H "Origin: http://localhost" "$URL" 2>&1 | grep -E "(Access-Control|HTTP)"

echo -e "\n5. 检查 Nginx 生成的配置："
docker compose exec nginx cat /etc/nginx/conf.d/default.conf | grep -A5 -B5 cors