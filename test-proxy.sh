#!/bin/bash

# 代理服务器测试脚本

echo "=========================================="
echo "代理服务器连接测试"
echo "=========================================="
echo ""

# 默认端口
PORT=${1:-5005}
BASE_URL="http://localhost:$PORT"

# 测试函数
test_endpoint() {
    local url="$1"
    local name="$2"
    echo "测试: $name"
    echo "URL: $url"

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo "✅ 成功"
    else
        echo "❌ 失败"
    fi
    echo ""
}

# 检查端口
echo "检查端口 $PORT 是否可用..."
if ! netstat -tulpn 2>/dev/null | grep -q ":$PORT "; then
    echo "⚠️  端口 $PORT 未被占用，代理服务可能未启动"
else
    echo "✅ 端口 $PORT 已被占用"
fi
echo ""

# 测试健康检查端点
test_endpoint "$BASE_URL/health" "健康检查"

# 测试主页
test_endpoint "$BASE_URL/" "主页"

# 生成测试会话ID
SESSION_ID=$(python3 -c "import uuid; print(str(uuid.uuid4())[:12])" 2>/dev/null || echo "test123")

# 测试代理端点
test_endpoint "$BASE_URL/proxy/$SESSION_ID/" "代理根路径"

echo "=========================================="
echo "代理URL示例:"
echo "http://localhost:$PORT/proxy/$SESSION_ID/"
echo "=========================================="
