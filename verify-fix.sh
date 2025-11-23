#!/bin/bash

echo "=========================================="
echo "代理服务器修复验证"
echo "=========================================="
echo ""

PORT=${1:-5005}
BASE_URL="http://localhost:$PORT"

# 生成测试会话
SESSION_ID=$(python3 -c "import uuid; print(str(uuid.uuid4())[:12])" 2>/dev/null || echo "test123")
echo "测试会话ID: $SESSION_ID"
echo ""

# 测试函数
test_proxy() {
    local path="$1"
    local name="$2"

    echo "测试: $name"
    echo "路径: /proxy/$SESSION_ID$path"

    # 使用curl测试，抑制SSL警告
    response=$(curl -s -k -w "\n%{http_code}" "$BASE_URL/proxy/$SESSION_ID$path" 2>/dev/null | tail -1)
    status_code=$(echo "$response" | tail -1)

    if [ "$status_code" = "200" ]; then
        echo "✅ 成功 - 状态码: $status_code"
    else
        echo "❌ 失败 - 状态码: $status_code"
    fi
    echo ""
}

# 检查代理是否运行
echo "1. 检查代理服务器状态..."
health_check=$(curl -s "$BASE_URL/health" 2>/dev/null)
if [ -n "$health_check" ]; then
    echo "✅ 代理服务器运行正常"
    echo "$health_check" | python3 -m json.tool 2>/dev/null || echo "$health_check"
else
    echo "❌ 代理服务器未运行或无响应"
    echo "请先运行: ./start-proxy.sh"
    exit 1
fi
echo ""

# 测试主要路径
echo "2. 测试代理路径..."
test_proxy "/" "根路径"

# 测试静态资源路径
test_proxy "/_next/static/css/app/layout.css" "CSS文件"
test_proxy "/_next/static/media/test.woff2" "字体文件"

echo "3. 测试完成"
echo ""
echo "=========================================="
echo "在浏览器中测试:"
echo "文件: file:///mnt/e/Projects/dify/simple-test.html"
echo "URL:  http://localhost:$PORT/proxy/$SESSION_ID/"
echo "=========================================="
