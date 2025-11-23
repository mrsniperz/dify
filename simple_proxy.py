#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化代理服务器 - 专门用于 Dify iframe 登录测试
"""

from flask import Flask, request, Response, jsonify, send_from_directory
from flask_cors import CORS
import requests
import re
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins="*")  # 允许所有来源

# 目标服务器配置
TARGET_BASE_URL = 'https://fy.anyremote.cn:8334'

# 会话存储
sessions = {}

def get_session_id():
    """获取或生成会话ID"""
    # 优先从 URL 参数获取
    if 'session_id' in request.args:
        sid = request.args.get('session_id')
        if sid not in sessions:
            sessions[sid] = {'created': datetime.now()}
        return sid

    # 从路径中提取
    path_parts = request.path.strip('/').split('/')
    if len(path_parts) >= 2 and path_parts[0] == 'proxy':
        sid = path_parts[1]
        if sid not in sessions:
            sessions[sid] = {'created': datetime.now()}
        return sid

    # 生成新会话
    sid = str(uuid.uuid4())[:12]
    sessions[sid] = {'created': datetime.now()}
    return sid

def build_target_url(session_id):
    """构建目标URL"""

    # 提取代理路径
    path_parts = request.path.strip('/').split('/')

    # 解析路径: proxy/<session_id>/<...>
    if len(path_parts) >= 3 and path_parts[0] == 'proxy':
        target_path = '/'.join(path_parts[2:])
    elif len(path_parts) >= 2 and path_parts[0] == 'proxy':
        target_path = ''
    else:
        # 直接路径模式
        target_path = '/'.join(path_parts)

    # 添加查询参数
    query_string = request.query_string.decode('utf-8') if request.query_string else ''
    if target_path:
        target_url = f'{TARGET_BASE_URL}/{target_path}'
    else:
        target_url = TARGET_BASE_URL

    if query_string:
        target_url += f'?{query_string}'

    return target_url

def rewrite_html_content(html_content, session_id):
    """重写HTML内容"""

    # 替换绝对URL为代理URL
    # 1. 替换完整的URL
    html_content = re.sub(
        rf'{re.escape(TARGET_BASE_URL)}',
        f'/proxy/{session_id}',
        html_content
    )

    # 2. 替换所有https://localhost:5005引用
    html_content = re.sub(
        r'https://localhost:\d+/proxy/' + session_id,
        f'/proxy/{session_id}',
        html_content
    )

    # 3. 替换href属性中的路径 - 包含https://和//
    html_content = re.sub(
        r'href="(?!/proxy/|https?://|mailto:|#)([^"#?]+)"',
        rf'href="/proxy/{session_id}/\1"',
        html_content
    )

    # 4. 替换src属性中的路径 - 包含https://和//
    html_content = re.sub(
        r'src="(?!/proxy/|https?://|data:|#)([^"#?]+)"',
        rf'src="/proxy/{session_id}/\1"',
        html_content
    )

    # 5. 替换CSS中的url()引用 - 包含https://和//
    html_content = re.sub(
        r'url\([\'"]?(?!/proxy/|https?://|data:|#)([\'")]+)[\'"]?\)',
        rf'url("/proxy/{session_id}/\1")',
        html_content
    )

    # 6. 替换以//开头的协议相对URL
    html_content = re.sub(
        r'(href|src|action)="//([^"]+)"',
        rf'\1="/proxy/{session_id}/\2"',
        html_content
    )

    # 7. 替换data-href、data-src等自定义属性
    html_content = re.sub(
        r'data-(?:href|src)="(?!/proxy/|https?://|data:|#)([^"#?]+)"',
        rf'data-href="/proxy/{session_id}/\1"',
        html_content
    )

    # 8. 替换其他属性中的URL模式（如style、link标签等）
    # 但要避免内联CSS和JavaScript
    html_content = re.sub(
        r'(?:<link[^>]+href="|<script[^>]+src="|<img[^>]+src="|<source[^>]+src=")(?!/proxy/|https?://|data:)([^"#?]+)"',
        lambda m: m.group(0).replace(f'"{m.group(1)}"', f'"/proxy/{session_id}/{m.group(1)}"'),
        html_content
    )

    # 9. 最后，强制将所有剩余的绝对路径转为代理路径
    # 仅对Next.js特有的路径
    html_content = re.sub(
        rf'"(?!/proxy/|https?://|data:|mailto:|#)(/_next/[^"#?]+)"',
        rf'"/proxy/{session_id}\1"',
        html_content
    )

    # 3. 添加base标签（但要小心协议）
    if '<head>' in html_content:
        # 检查是否已存在base标签
        if 'base href=' not in html_content:
            # 使用相对协议，让浏览器保持当前页面协议
            html_content = html_content.replace(
                '<head>',
                f'<head><base href="{TARGET_BASE_URL}/">'
            )
        else:
            # 修改现有base标签为相对协议
            html_content = re.sub(
                r'<base href="[^"]+">',
                f'<base href="{TARGET_BASE_URL}/">',
                html_content
            )

    # 4. 添加JavaScript代码 - 拦截客户端路由
    js_code = f"""
    <script>
    // 代理会话ID
    window.PROXY_SESSION_ID = '{session_id}';
    const SESSION_ID = '{session_id}';

    // 拦截 window.location 赋值
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {{
        get: function() {{ return originalLocation; }},
        set: function(value) {{
            console.log('拦截location导航:', value);
            let url = typeof value === 'string' ? value : value.href;
            url = String(url);

            // 强制将所有URL转为代理路径
            if (url) {{
                if (url.startsWith('https://localhost:')) {{
                    // 处理HTTPS的localhost URL，强制转为HTTP代理
                    const path = url.replace(/^https:\\/\\/[^/]+/, '');
                    const newUrl = '/proxy/' + SESSION_ID + path;
                    console.log('重写HTTPS localhost URL:', url, '->', newUrl);
                    originalLocation.href = newUrl;
                    return;
                }}
                if (url.startsWith('/') && !url.startsWith('/proxy/')) {{
                    const newUrl = '/proxy/' + SESSION_ID + url;
                    console.log('重写绝对路径URL:', url, '->', newUrl);
                    originalLocation.href = newUrl;
                    return;
                }}
                if (!url.startsWith('/proxy/') && !url.startsWith('http')) {{
                    const newUrl = '/proxy/' + SESSION_ID + '/' + url;
                    console.log('重写相对路径URL:', url, '->', newUrl);
                    originalLocation.href = newUrl;
                    return;
                }}
            }}
            originalLocation.href = value;
        }},
        configurable: true
    }});

    // 拦截 history.pushState
    const originalPushState = history.pushState;
    history.pushState = function(...args) {{
        let url = args[2];
        if (url) {{
            url = String(url);
            if (url.startsWith('https://localhost:')) {{
                const path = url.replace(/^https:\\/\\/[^/]+/, '');
                url = '/proxy/' + SESSION_ID + path;
                console.log('重写HTTPS pushState URL:', args[2], '->', url);
                args[2] = url;
            }} else if (url.startsWith('/') && !url.startsWith('/proxy/')) {{
                url = '/proxy/' + SESSION_ID + url;
                console.log('重写pushState URL:', args[2], '->', url);
                args[2] = url;
            }} else if (!url.startsWith('/proxy/') && !url.startsWith('http')) {{
                url = '/proxy/' + SESSION_ID + '/' + url.replace(/^\\//, '');
                console.log('重写pushState URL:', args[2], '->', url);
                args[2] = url;
            }}
        }}
        return originalPushState.apply(this, args);
    }};

    // 拦截 history.replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {{
        let url = args[2];
        if (url) {{
            url = String(url);
            if (url.startsWith('https://localhost:')) {{
                const path = url.replace(/^https:\\/\\/[^/]+/, '');
                url = '/proxy/' + SESSION_ID + path;
                console.log('重写HTTPS replaceState URL:', args[2], '->', url);
                args[2] = url;
            }} else if (url.startsWith('/') && !url.startsWith('/proxy/')) {{
                url = '/proxy/' + SESSION_ID + url;
                console.log('重写replaceState URL:', args[2], '->', url);
                args[2] = url;
            }} else if (!url.startsWith('/proxy/') && !url.startsWith('http')) {{
                url = '/proxy/' + SESSION_ID + '/' + url.replace(/^\\//, '');
                console.log('重写replaceState URL:', args[2], '->', url);
                args[2] = url;
            }}
        }}
        return originalReplaceState.apply(this, args);
    }};

    // 拦截链接点击
    document.addEventListener('click', function(e) {{
        let target = e.target;
        while (target && target !== document) {{
            if (target.tagName === 'A' && target.href) {{
                const href = String(target.href);
                if (href.startsWith('https://localhost:')) {{
                    e.preventDefault();
                    const path = href.replace(/^https:\\/\\/[^/]+/, '');
                    const newHref = '/proxy/' + SESSION_ID + path;
                    console.log('重写HTTPS链接:', href, '->', newHref);
                    window.location.href = newHref;
                    return;
                }}
                if (href && !href.startsWith('/proxy/') && !href.startsWith('http')) {{
                    e.preventDefault();
                    const newHref = '/proxy/' + SESSION_ID + '/' + href.replace(/^\\//, '');
                    console.log('重写链接:', href, '->', newHref);
                    window.location.href = newHref;
                    return;
                }}
                break;
            }}
            target = target.parentNode;
        }}
    }}, true);

    // 全局URL重写机制 - 持续监控动态生成的元素
    function rewriteElement(element) {{
        // 重写href属性
        const href = element.getAttribute && element.getAttribute('href');
        if (href && !href.startsWith('/proxy/')) {{
            let newHref = href;
            if (href.startsWith('https://localhost:')) {{
                newHref = href.replace(/^https:\\/\\/[^/]+/, '/proxy/' + SESSION_ID);
            }} else if (href.startsWith('/')) {{
                newHref = '/proxy/' + SESSION_ID + href;
            }} else {{
                newHref = '/proxy/' + SESSION_ID + '/' + href.replace(/^\\//, '');
            }}
            element.setAttribute('href', newHref);
        }}

        // 重写src属性
        const src = element.getAttribute && element.getAttribute('src');
        if (src && !src.startsWith('/proxy/')) {{
            let newSrc = src;
            if (src.startsWith('https://localhost:')) {{
                newSrc = src.replace(/^https:\\/\\/[^/]+/, '/proxy/' + SESSION_ID);
            }} else if (src.startsWith('/')) {{
                newSrc = '/proxy/' + SESSION_ID + src;
            }}
            element.setAttribute('src', newSrc);
        }}
    }}

    // 定期重写所有元素中的URL
    function rewriteAllUrls() {{
        // 重写所有A标签
        document.querySelectorAll('a').forEach(rewriteElement);
        // 重写所有IMG标签
        document.querySelectorAll('img').forEach(rewriteElement);
        // 重写所有LINK标签
        document.querySelectorAll('link').forEach(rewriteElement);
        // 重写所有SCRIPT标签
        document.querySelectorAll('script').forEach(rewriteElement);
        // 重写所有SOURCE标签
        document.querySelectorAll('source').forEach(rewriteElement);
    }}

    // 立即执行一次
    setTimeout(rewriteAllUrls, 100);

    // 每500ms检查一次，动态内容
    setInterval(rewriteAllUrls, 500);

    // 监听DOM变化
    if (typeof MutationObserver !== 'undefined') {{
        const observer = new MutationObserver(function(mutations) {{
            mutations.forEach(function(mutation) {{
                mutation.addedNodes.forEach(function(node) {{
                    if (node.nodeType === 1) {{ // ELEMENT_NODE
                        if (node.querySelectorAll) {{
                            rewriteAllUrls();
                        }} else {{
                            rewriteElement(node);
                        }}
                    }}
                }});
            }});
        }});
        observer.observe(document.documentElement, {{ childList: true, subtree: true }});
    }}

    // 监听登录相关事件
    window.addEventListener('message', function(event) {{
        // 允许来自任何源的登录消息
        if (event.data && (event.data.type === 'loginSuccess' || event.data.type === 'loginAttempt')) {{
            try {{
                window.parent.postMessage(event.data, '*');
            }} catch (e) {{
                console.log('PostMessage error:', e);
            }}
        }}
    }});

    // 监听本地存储变化（检测登录状态）
    let lastStorage = {{}};
    setInterval(() => {{
        for (let i = 0; i < localStorage.length; i++) {{
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);

            if (key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('auth') ||
                key.toLowerCase().includes('session') ||
                key.toLowerCase().includes('access')) {{
                if (value && value !== lastStorage[key]) {{
                    console.log('Detected auth data change:', key);
                    try {{
                        window.parent.postMessage({{
                            type: 'loginSuccess',
                            key: key,
                            timestamp: Date.now()
                        }}, '*');
                    }} catch (e) {{
                        console.log('PostMessage error:', e);
                    }}
                    lastStorage[key] = value;
                }}
            }}
        }}
    }}, 1000);

    // 检测表单提交（登录尝试）
    setInterval(() => {{
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {{
            if (!form.dataset.proxyListened) {{
                form.addEventListener('submit', function() {{
                    console.log('Login attempt detected');
                    setTimeout(() => {{
                        try {{
                            window.parent.postMessage({{
                                type: 'loginAttempt',
                                url: window.location.href,
                                timestamp: Date.now()
                            }}, '*');
                        }} catch (e) {{
                            console.log('PostMessage error:', e);
                        }}
                    }}, 2000);
                }});
                form.dataset.proxyListened = 'true';
            }}
        }});
    }}, 500);
    </script>
    """

    if '</body>' in html_content:
        html_content = html_content.replace('</body>', js_code + '</body>')
    else:
        html_content += js_code

    return html_content

@app.route('/', methods=['GET'])
def index():
    """主页"""
    session_id = str(uuid.uuid4())[:12]
    test_url = f'/proxy/{session_id}/'
    return f"""
    <h1>Dify iframe 代理服务</h1>
    <p>会话ID: <code>{session_id}</code></p>
    <p>测试URL: <code>{test_url}</code></p>
    <p><a href="{test_url}">点击这里测试代理</a></p>
    <hr>
    <p><a href="/health">健康检查</a></p>
    """

@app.route('/proxy/<session_id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy_without_slash(session_id):
    """处理没有尾部斜杠的代理请求 - 重定向到带斜杠的版本"""
    from flask import redirect
    return redirect(f'/proxy/{session_id}/', code=307)

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'target': TARGET_BASE_URL,
        'active_sessions': len(sessions),
        'timestamp': datetime.now().isoformat(),
        'sessions': list(sessions.keys())[:5]  # 只显示前5个
    })

@app.route('/proxy/<session_id>/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
@app.route('/proxy/<session_id>/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(session_id, path):
    """通用代理路由"""

    # 处理CORS预检请求
    if request.method == 'OPTIONS':
        resp = Response('', status=200)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        resp.headers['Access-Control-Max-Age'] = '86400'
        return resp

    try:
        # 确保会话存在
        if session_id not in sessions:
            sessions[session_id] = {
                'created': datetime.now(),
                'cookies': {}
            }

        # 构建目标URL - 确保正确的路径格式
        if path:
            # 移除开头和结尾的斜杠，避免双斜杠
            path = path.strip('/')
            if path:
                target_url = f'{TARGET_BASE_URL}/{path}'
            else:
                target_url = TARGET_BASE_URL
        else:
            target_url = TARGET_BASE_URL

        # 添加查询参数
        if request.query_string:
            target_url += f'?{request.query_string.decode("utf-8")}'

        print(f"[{session_id}] 代理请求: {request.method} {request.path} -> {target_url}")

        # 准备请求头
        headers = {
            'User-Agent': request.headers.get('User-Agent', 'Mozilla/5.0'),
            'Accept': request.headers.get('Accept', '*/*'),
            'Accept-Language': request.headers.get('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8'),
            'Referer': TARGET_BASE_URL,
        }

        # 复制必要的请求头
        for key, value in request.headers.items():
            if key.lower() not in ['host', 'content-length', 'connection']:
                headers[key] = value

        # 获取请求体
        data = request.get_data()

        # 发送请求到目标服务器
        response = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=data,
            cookies=sessions[session_id].get('cookies', {}),
            allow_redirects=True,
            timeout=30,
            verify=False,  # SSL验证已禁用，仅用于测试
            stream=False
        )

        # 获取响应内容 - 处理gzip压缩
        content = response.content
        if response.headers.get('Content-Encoding') == 'gzip':
            import gzip
            try:
                content = gzip.decompress(response.content)
            except:
                pass

        # 处理HTML内容
        content_type = response.headers.get('Content-Type', '')
        if 'text/html' in content_type and response.status_code == 200:
            try:
                html = content.decode('utf-8', errors='ignore')
                html = rewrite_html_content(html, session_id)
                content = html.encode('utf-8')
            except Exception as e:
                print(f"HTML rewrite error: {e}")

        # 更新会话Cookie
        try:
            for cookie in response.cookies:
                if session_id not in sessions:
                    sessions[session_id] = {'created': datetime.now(), 'cookies': {}}
                sessions[session_id]['cookies'][cookie.name] = {
                    'value': cookie.value,
                    'domain': cookie.domain,
                    'path': cookie.path
                }
        except Exception as e:
            print(f"Cookie update error: {e}")

        # 清理过期会话（超过1小时）
        current_time = datetime.now()
        expired = [sid for sid, sess in sessions.items()
                  if current_time - sess['created'] > timedelta(hours=1)]
        for sid in expired:
            del sessions[sid]
            print(f"清理过期会话: {sid}")

        # 构建响应
        resp = Response(content, status=response.status_code)

        # 复制响应头 - 过滤掉问题和压缩相关头
        skip_headers = [
            'content-length',
            'transfer-encoding',
            'content-encoding',
            'connection',
            'keep-alive',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailer',
            'upgrade',
        ]

        for key, value in response.headers.items():
            if key.lower() not in skip_headers:
                resp.headers[key] = value

        # 添加缓存控制头部
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'

        # 添加CORS头部
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        resp.headers['Access-Control-Max-Age'] = '86400'

        print(f"[{session_id}] 代理响应: {response.status_code} ({len(content)} bytes)")

        return resp

    except Exception as e:
        print(f"代理错误: {e}")
        return jsonify({
            'error': 'proxy_error',
            'message': str(e),
            'path': request.path,
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("=" * 50)
    print("Dify iframe 简化代理服务器")
    print("=" * 50)
    print(f"目标服务器: {TARGET_BASE_URL}")
    print(f"代理基础路径: /proxy/<session_id>/")
    print()
    print("使用方法:")
    print("1. 在浏览器中打开测试页面")
    print("2. 选择'通过代理访问'")
    print("3. 输入 URL: http://localhost:5005/proxy/<session_id>/")
    print()
    print(f"健康检查: http://localhost:5005/health")
    print("=" * 50)
    print()

    app.run(host='0.0.0.0', port=5005, debug=True)
