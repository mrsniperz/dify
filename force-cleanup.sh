#!/bin/bash

echo "=========================================="
echo "强制清理和重测试脚本"
echo "=========================================="
echo ""

# 生成新的Session ID
SESSION_ID=$(python3 -c "import uuid; print(str(uuid.uuid4())[:12])" 2>/dev/null || echo "force_test")
echo "新的测试会话ID: $SESSION_ID"
echo ""

echo "🔧 执行步骤:"
echo ""

echo "1. 重启代理服务..."
# 检查代理是否在运行
if pgrep -f "simple_proxy.py" > /dev/null; then
    echo "   停止旧代理进程..."
    pkill -f "simple_proxy.py" 2>/dev/null
    sleep 2
fi

# 启动新代理
cd /mnt/e/Projects/dify
uv run simple_proxy.py 5005 > /tmp/proxy.log 2>&1 &
PROXY_PID=$!

# 等待代理启动
sleep 3

# 检查代理是否正常启动
if kill -0 $PROXY_PID 2>/dev/null; then
    echo "   ✅ 代理已启动 (PID: $PROXY_PID)"
else
    echo "   ❌ 代理启动失败"
    cat /tmp/proxy.log
    exit 1
fi
echo ""

echo "2. 测试代理健康状态..."
health=$(curl -s http://localhost:5005/health 2>/dev/null)
if [ -n "$health" ]; then
    echo "   ✅ 代理健康检查通过"
else
    echo "   ❌ 代理无响应"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi
echo ""

echo "3. 测试新会话代理..."
response=$(curl -s -k -w "%{http_code}" -o /dev/null "http://localhost:5005/proxy/$SESSION_ID/" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "   ✅ 新会话测试成功 (状态码: 200)"
else
    echo "   ❌ 新会话测试失败 (状态码: $response)"
    kill $PROXY_PID 2>/dev/null
    exit 1
fi
echo ""

echo "4. 清理浏览器缓存..."
echo "   请执行以下操作："
echo ""
echo "   Chrome/Edge:"
echo "   - 按 Ctrl+Shift+I 打开开发者工具"
echo "   - 右键刷新按钮"
echo "   - 选择 '清空缓存并硬性重新加载'"
echo ""
echo "   或在地址栏执行："
echo "   chrome://settings/clearBrowserData"
echo ""
echo "   Firefox:"
echo "   - 按 Ctrl+Shift+I 打开开发者工具"
echo "   - 右键刷新按钮"
echo "   - 选择 '硬性重新加载'"
echo ""

echo "5. 测试代理URL"
echo "   代理URL: http://localhost:5005/proxy/$SESSION_ID/"
echo ""

echo "6. 查看实时日志 (代理启动窗口)"
echo "   代理日志位置: /tmp/proxy.log"
echo "   实时查看: tail -f /tmp/proxy.log"
echo ""

echo "=========================================="
echo "✅ 准备就绪！现在请："
echo "1. 清理浏览器缓存"
echo "2. 打开: file:///mnt/e/Projects/dify/simple-test.html"
echo "3. 输入URL: http://localhost:5005/proxy/$SESSION_ID/"
echo "4. 点击加载"
echo "=========================================="
echo ""

# 保持脚本运行
echo "代理进程 (PID: $PROXY_PID) 正在运行..."
echo "按 Ctrl+C 停止代理并退出"
echo ""

# 等待用户中断
trap "echo ''; echo '停止代理进程...'; kill $PROXY_PID 2>/dev/null; echo '已停止'; exit 0" INT

while true; do
    sleep 1
done
