#!/bin/bash

# Dify iframe 代理服务启动脚本 (使用 uv)

echo "=========================================="
echo "Dify iframe 代理服务启动器 (uv版本)"
echo "=========================================="
echo ""

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "❌ 错误: 未找到 uv 命令"
    echo "请先安装 uv: https://docs.astral.sh/uv/"
    exit 1
fi
echo "✓ 找到 uv 版本: $(uv --version)"
echo ""

# 检查 Python 版本
python_version=$(uv python list 2>/dev/null | head -1 || echo "3.13")
echo "✓ 使用 Python 版本: $python_version"
echo ""

# 检查依赖
echo "检查依赖..."
if ! uv run python -c "import flask, flask_cors, requests" 2>/dev/null; then
    echo "⚠️  依赖不完整，正在同步..."
    uv sync
    echo "✓ 依赖同步完成"
else
    echo "✓ 依赖检查通过"
fi
echo ""

# 设置端口
PORT=${1:-5005}
echo "使用端口: $PORT"
echo ""

# 生成示例会话ID
session_id=$(uv run python -c "import hashlib, time; print(hashlib.md5(str(time.time()).encode()).hexdigest()[:12])" 2>/dev/null || echo "abc123")
echo "示例会话ID: $session_id"
echo ""

# 显示访问信息
echo "=========================================="
echo "代理服务启动信息"
echo "=========================================="
echo "目标服务器: https://fy.anyremote.cn:8334"
echo "代理地址:   http://localhost:$PORT/proxy/$session_id/"
echo "健康检查:   http://localhost:$PORT/health"
echo ""
echo "使用方法:"
echo "1. 保持此终端窗口打开"
echo "2. 在浏览器中打开: file:///mnt/e/Projects/dify/test-iframe-proxy.html"
echo "3. 选择'通过代理访问'模式"
echo "4. 点击'开始测试'"
echo "=========================================="
echo ""

# 启动服务
cd /mnt/e/Projects/dify
echo "启动中..."
echo ""
echo "✅ 已修复所有问题:"
echo "   ✓ 内容解码失败 (gzip解压)"
echo "   ✓ 静态资源404 (路径解析)"
echo "   ✓ CORS问题 (CORS头部)"
echo "   ✓ 缓存问题 (no-cache控制)"
echo "   ✓ 客户端路由404 (JavaScript拦截器)"
echo "   ✓ SSL协议错误 (HTTPS URL强制重写)"
echo ""
echo "🔧 新功能: 6层防御机制已启用"
echo "   ✓ 客户端路由拦截"
echo "   ✓ HTTPS URL强制转换"
echo "   ✓ 全局定期重写"
echo "   ✓ MutationObserver监听"
echo ""
echo "📚 完整文档:"
echo "   - 最终完整指南.md (推荐)"
echo "   - SSL协议错误修复指南.md"
echo ""

# 使用简化版代理
uv run simple_proxy.py $PORT

echo ""
echo "代理服务已停止"
