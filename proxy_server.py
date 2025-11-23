#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单代理服务器 - 用于在 iframe 中访问远程 Dify 应用
"""

from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests
import urllib.parse
import time
import uuid
from datetime import datetime, timedelta
import hashlib
import hmac

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 目标服务器配置
TARGET_BASE_URL = 'https://fy.anyremote.cn:8334'
SESSION_COOKIE_NAME = 'session'
CSRF_COOKIE_NAME = 'csrf_token'

# 简单的会话存储（生产环境请使用 Redis 或数据库）
sessions = {}

def generate_session_id():
    """生成会话ID"""
    timestamp = str(time.time())
    random_str = str(uuid.uuid4())
    return hashlib.md5((timestamp + random_str).encode()).hexdigest()

def create_proxy_response(response, target_url, session_id=None):
    """创建代理响应"""
    # 获取响应内容
    content = response.content

    # 修改内容中的URL，使其指向代理
    if 'text/html' in response.headers.get('Content-Type', ''):
        try:
            content_str = content.decode('utf-8')

            # 替换绝对URL为代理URL
            content_str = content_str.replace(
                f'https://fy.anyremote.cn:8334',
                f'/proxy/{session_id}'
            )
            content_str = content_str.replace(
                'https://fy.anyremote.cn:8334',
                '/proxy/' + session_id
            )

            # 添加 Base 标签以确保相对路径正确
            if '<head>' in content_str:
                content_str = content_str.replace(
                    '<head>',
                    f'<head><base href="https://fy.anyremote.cn:8334/">'
                )

            # 添加 POST 消息监听器
            post_message_script = """
            <script>
                // 监听登录相关事件
                window.addEventListener('message', function(event) {
                    if (event.origin !== window.location.origin) return;

                    // 转发消息到父窗口
                    if (event.data.type === 'postToParent') {
                        window.parent.postMessage(event.data, '*');
                    }
                });

                // 监听登录状态变化
                let checkLogin = setInterval(() => {
                    // 检查 localStorage 中的认证信息
                    for (let key in localStorage) {
                        if (key.toLowerCase().includes('token') ||
                            key.toLowerCase().includes('auth') ||
                            key.toLowerCase().includes('session')) {
                            if (localStorage[key] && localStorage[key].length > 0) {
                                window.parent.postMessage({
                                    type: 'loginSuccess',
                                    key: key,
                                    timestamp: Date.now()
                                }, '*');
                            }
                        }
                    }

                    // 检查登录表单
                    const loginForm = document.querySelector('form');
                    if (loginForm) {
                        loginForm.addEventListener('submit', () => {
                            setTimeout(() => {
                                window.parent.postMessage({
                                    type: 'loginAttempt',
                                    url: window.location.href,
                                    timestamp: Date.now()
                                }, '*');
                            }, 1000);
                        });
                    }
                }, 1000);
            </script>
            """

            if '</body>' in content_str:
                content_str = content_str.replace('</body>', post_message_script + '</body>')
            else:
                content_str += post_message_script

            content = content_str.encode('utf-8')
        except:
            pass

    # 转发响应头
    new_headers = {}
    for key, value in response.headers.items():
        if key.lower() not in ['content-length', 'content-encoding', 'transfer-encoding']:
            # 修改 Set-Cookie 头部
            if key.lower() == 'set-cookie':
                # 保持 session cookie 但更新其路径
                cookies = value.split(',')
                modified_cookies = []
                for cookie in cookies:
                    if 'Path=/' in cookie:
                        cookie = cookie.replace('Path=/', 'Path=/proxy/' + session_id)
                    modified_cookies.append(cookie)
                value = ','.join(modified_cookies)

            new_headers[key] = value

    return Response(content, status=response.status_code, headers=new_headers)

@app.route('/proxy/<session_id>/<path:target_path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
@app.route('/proxy/<session_id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(session_id, target_path=''):
    """代理请求到目标服务器"""

    # 构建目标URL
    target_url = TARGET_BASE_URL
    if request.query_string:
        query_string = request.query_string.decode('utf-8')
        target_url = f'{TARGET_BASE_URL}/{target_path}?{query_string}'
    else:
        target_url = f'{TARGET_BASE_URL}/{target_path}'

    # 获取或创建会话
    if session_id not in sessions:
        sessions[session_id] = {
            'cookies': {},
            'created': datetime.now()
        }

    session = sessions[session_id]

    # 准备请求参数
    headers = {
        'User-Agent': request.headers.get('User-Agent', 'Mozilla/5.0'),
        'Referer': TARGET_BASE_URL,
        'Origin': TARGET_BASE_URL,
    }

    # 复制请求头
    for key, value in request.headers.items():
        if key.lower() not in ['host', 'content-length']:
            headers[key] = value

    # 添加会话cookie
    cookies = session['cookies'].copy()

    # 处理请求体
    data = request.get_data()
    if data:
        headers['Content-Type'] = request.headers.get('Content-Type', 'application/x-www-form-urlencoded')

    try:
        # 发送请求到目标服务器
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=data,
            cookies=cookies,
            allow_redirects=True,
            timeout=30,
            verify=False  # 如果需要 SSL 验证，请改为 True
        )

        # 更新会话cookie
        for cookie in resp.cookies:
            session['cookies'][cookie.name] = {
                'value': cookie.value,
                'domain': cookie.domain,
                'path': cookie.path
            }

        # 清理过期会话
        current_time = datetime.now()
        expired_sessions = [
            sid for sid, sess in sessions.items()
            if current_time - sess['created'] > timedelta(hours=1)
        ]
        for sid in expired_sessions:
            del sessions[sid]

        return create_proxy_response(resp, target_url, session_id)

    except Exception as e:
        return jsonify({
            'error': 'Proxy error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/health')
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'proxy_for': TARGET_BASE_URL,
        'active_sessions': len(sessions),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print(f"=== Dify Proxy Server ===")
    print(f"Target: {TARGET_BASE_URL}")
    print(f"Proxy Base: http://localhost:5005/proxy/<session_id>")
    print(f"")
    print(f"使用方法：")
    print(f"1. 启动服务: python proxy_server.py")
    print(f"2. 访问: http://localhost:5005/health")
    print(f"3. 在 test-iframe.html 中使用: http://localhost:5005/proxy/test123/")
    print("=")

    # 创建测试会话ID
    test_session_id = generate_session_id()
    print(f"示例会话ID: {test_session_id}")
    print(f"示例URL: http://localhost:5005/proxy/{test_session_id}/")
    print("=")

    app.run(host='0.0.0.0', port=5005, debug=True, threaded=True)
