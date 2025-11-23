#!/bin/bash

echo "🔍 iframe 环境认证问题诊断"
echo "================================"

URL="http://fy.anyremote.cn:8184"

echo "1. 测试正常页面的登录（对比基准）："
echo "获取登录页面，查看登录表单："
curl -s "$URL/signin" | grep -o 'action="[^"]*"' | head -3

echo -e "\n2. 检查 iframe 环境下的网络行为："
echo "模拟 iframe 的 Origin 请求："
curl -v -X OPTIONS \
  -H "Origin: null" \
  "$URL/console/api/account/profile" 2>&1 | grep -E "(Access-Control|HTTP)" | head -5

echo -e "\n3. 检查 Cookie 设置详情："
echo "获取登录页面响应，查看安全策略："
curl -s -I "$URL/" | grep -E "(Content-Security|X-Frame|Set-Cookie)" | head -5

echo -e "\n4. 测试不同的 Origin："
for origin in "null" "http://localhost" "https://example.com" "file://"; do
    echo -n "Origin: $origin - "
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "Origin: $origin" "$URL/console/api/account/profile")
    echo "HTTP $status"
done

echo -e "\n5. 检查 Dify 的 Content-Security-Policy："
curl -s "$URL/" | grep -o "Content-Security-Policy[^;]*" || echo "未找到 CSP"

echo -e "\n6. 检查 X-Frame-Options："
curl -s "$URL/" | grep -o "X-Frame-Options[^;]*" || echo "未找到 X-Frame-Options"

echo -e "\n7. 测试 iframe 友考页面场景："
echo "创建一个简单的 iframe 测试..."

# 创建测试 HTML 页面
cat > /tmp/iframe-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>iframe 认证测试</title>
</head>
<body>
    <h1>iframe 登录测试</h1>
    <iframe src="$URL/signin" width="800" height="600" style="border: 1px solid #ccc;"></iframe>

    <script>
        // 监听 iframe 中的网络请求（如果可能）
        window.addEventListener('message', function(event) {
            console.log('收到 iframe 消息:', event.data);
        });

        // 定期检查 iframe 状态
        setInterval(function() {
            try {
                const iframe = document.querySelector('iframe');
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                console.log('iframe 当前 URL:', iframeDoc.location.href);
            } catch(e) {
                console.log('无法访问 iframe 内容:', e.message);
            }
        }, 2000);
    </script>
</body>
</html>
EOF

echo "测试页面已创建: /tmp/iframe-test.html"

echo -e "\n8. 提供的解决方案建议："
echo "1. 检查是否需要修改 SameSite Cookie 设置"
echo "2. 考虑使用 postMessage 传递认证信息"
echo "3. 检查是否需要使用不同的认证方式"