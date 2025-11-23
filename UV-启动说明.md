# UV 环境启动说明

## 问题修复

✅ **已修复**: ModuleNotFoundError: No module named 'flask'

## 修复内容

### 1. 更新了 `pyproject.toml`
添加了缺失的依赖：
- `flask-cors>=5.0.0`
- `requests>=2.31.0`

### 2. 修改了 `start-proxy.sh`
现在使用 `uv run` 命令来运行代理服务器，确保使用虚拟环境中的依赖。

## 使用方法

### 第一次运行（需要同步依赖）
```bash
cd /mnt/e/Projects/dify
./start-proxy.sh
```

### 后续运行
```bash
cd /mnt/e/Projects/dify
./start-proxy.sh
```

### 指定端口
```bash
cd /mnt/e/Projects/dify
./start-proxy.sh 5006
```

## 预期输出

```
==========================================
Dify iframe 代理服务启动器 (uv版本)
==========================================
✓ 找到 uv 版本: uv 0.x.x
✓ 使用 Python 版本: 3.13.x
✓ 依赖检查通过
使用端口: 5005
示例会话ID: abc123def456

==========================================
代理服务启动信息
==========================================
目标服务器: https://fy.anyremote.cn:8334
代理地址:   http://localhost:5005/proxy/abc123def456/
健康检查:   http://localhost:5005/health

使用方法:
1. 保持此终端窗口打开
2. 在浏览器中打开: file:///mnt/e/Projects/dify/test-iframe-proxy.html
3. 选择'通过代理访问'模式
4. 点击'开始测试'
==========================================

启动中...
=== Dify Proxy Server ===
Target: https://fy.anyremote.cn:8334
Proxy Base: http://localhost:5005/proxy/<session_id>
...
* Running on all addresses (0.0.0.0)
* Running on http://127.0.0.1:5005
* Running on http://[你的IP]:5005
```

## 如果仍然遇到问题

### 1. 手动同步依赖
```bash
cd /mnt/e/Projects/dify
uv sync
```

### 2. 检查 uv 安装
```bash
uv --version
```

### 3. 检查 Python 版本
```bash
uv python list
```

### 4. 手动运行测试
```bash
cd /mnt/e/Projects/dify
uv run python -c "import flask, flask_cors, requests; print('依赖检查通过')"
```

## 使用流程

1. **启动代理服务**
   ```bash
   ./start-proxy.sh
   ```

2. **打开测试页面**
   在浏览器中打开 `file:///mnt/e/Projects/dify/test-iframe-proxy.html`

3. **选择访问模式**
   - 选择 **"通过代理访问"**
   - 代理URL自动填入 `http://localhost:5005/proxy/`

4. **开始测试**
   - 点击 **"开始测试"**
   - 在 iframe 内登录 Dify

5. **验证登录**
   - 系统会自动检测登录状态
   - 查看控制台日志获取详细信息

## 故障排除

### 端口被占用
```
Error: listen EADDRINUSE: address already in use :::5005
```
**解决**: 使用其他端口
```bash
./start-proxy.sh 5007
```

### 依赖同步失败
```
uv: error: Failed to sync dependencies
```
**解决**: 删除缓存重新同步
```bash
rm -rf .venv
uv sync
```

### 代理无法访问目标服务器
检查网络连接和防火墙设置，确保可以访问 `https://fy.anyremote.cn:8334`

## 更多帮助

- 查看完整文档: `iframe-proxy-使用说明.md`
- 检查代理健康: `http://localhost:5005/health`
