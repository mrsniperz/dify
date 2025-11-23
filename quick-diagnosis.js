#!/usr/bin/env node

const http = require('http');

console.log('🔍 Dify iframe 认证问题快速诊断');
console.log('='.repeat(50));

const targetUrl = 'http://fy.anyremote.cn:8184';

async function quickDiagnosis() {
    try {
        console.log('1. 测试基本连接...');
        const response = await makeRequest('GET', targetUrl + '/console/api/account/profile');

        if (response.statusCode === 401) {
            console.log('✅ API 端点可访问，返回 401 (需要认证) - 正常');
        } else {
            console.log(`⚠️  API 端点状态码: ${response.statusCode}`);
        }

        console.log('\n2. 检查响应头...');
        console.log('关键 CORS 头部:');

        const corsHeaders = [
            'access-control-allow-origin',
            'access-control-allow-credentials',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ];

        corsHeaders.forEach(header => {
            const value = response.headers[header];
            if (value) {
                console.log(`  ${header}: ${value}`);
                if (header === 'access-control-allow-credentials' && value === 'true') {
                    console.log('  ✅ CORS 凭证已启用');
                }
            } else {
                console.log(`  ${header}: 未设置 ❌`);
            }
        });

        console.log('\n3. 检查 Cookie 设置...');
        if (response.headers['set-cookie']) {
            console.log('✅ 服务器设置 Cookie');
            response.headers['set-cookie'].forEach(cookie => {
                console.log(`  Cookie: ${cookie}`);
                if (cookie.includes('SameSite')) {
                    if (cookie.includes('SameSite=None')) {
                        console.log('  ✅ SameSite=None 设置正确');
                    } else {
                        console.log('  ⚠️  SameSite 设置可能影响 iframe');
                    }
                }
            });
        } else {
            console.log('❌ 未检测到 Cookie 设置');
        }

        console.log('\n4. 诊断结果和建议:');
        console.log('='.repeat(30));

        if (response.headers['access-control-allow-credentials'] === 'true') {
            console.log('✅ CORS 凭证已配置，重启服务后应该可以正常登录');
        } else {
            console.log('❌ CORS 凭证未启用，这是登录失败的主要原因');
        }

        console.log('\n📋 下一步操作:');
        console.log('1. 重启 Docker 服务使配置生效');
        console.log('2. 使用 session-debug.html 测试登录');
        console.log('3. 如果仍有问题，检查服务器日志');

    } catch (error) {
        console.error('❌ 诊断失败:', error.message);
    }
}

function makeRequest(method, url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; dify-diagnosis/1.0)',
                'Accept': 'application/json',
                'Origin': 'http://localhost'  // 模拟跨域
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.end();
    });
}

quickDiagnosis();