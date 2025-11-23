#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🔍 Dify 服务器端完整调试');
console.log('='.repeat(50));

const targetUrl = 'http://fy.anyremote.cn:8184';

async function fullServerDebug() {
    console.log('\n📋 1. 检查服务器基本响应');
    await checkBasicResponse();

    console.log('\n📋 2. 检查 CORS 预检请求');
    await checkCorsPreflight();

    console.log('\n📋 3. 检查认证相关头部');
    await checkAuthHeaders();

    console.log('\n📋 4. 模拟跨域请求');
    await checkCrossOriginRequest();

    console.log('\n📋 5. 检查登录接口');
    await checkLoginEndpoint();

    console.log('\n📋 6. 总结和解决方案');
    generateSolutions();
}

async function checkBasicResponse() {
    try {
        const response = await makeRequest('GET', targetUrl);
        console.log(`✅ 基本连接成功 (状态码: ${response.statusCode})`);

        // 检查关键响应头
        const headers = response.headers;
        console.log(`📍 服务器: ${headers.server || '未知'}`);
        console.log(`📍 内容类型: ${headers['content-type'] || '未知'}`);
        console.log(`📍 CORS 允许来源: ${headers['access-control-allow-origin'] || '未设置'}`);
        console.log(`📍 CORS 允许凭证: ${headers['access-control-allow-credentials'] || '未设置'}`);

    } catch (error) {
        console.log(`❌ 基本连接失败: ${error.message}`);
    }
}

async function checkCorsPreflight() {
    try {
        const response = await makeRequest('OPTIONS', targetUrl + '/console/api/account/profile');

        console.log(`✅ OPTIONS 请求成功 (状态码: ${response.statusCode})`);

        const corsHeaders = {
            'access-control-allow-origin': response.headers['access-control-allow-origin'],
            'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
            'access-control-allow-methods': response.headers['access-control-allow-methods'],
            'access-control-allow-headers': response.headers['access-control-allow-headers']
        };

        console.log('\n📍 CORS 预检响应头:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`  ${status} ${key}: ${value || '未设置'}`);
        });

        if (corsHeaders['access-control-allow-credentials'] !== 'true') {
            console.log('⚠️  CORS_ALLOW_CREDENTIALS 可能未正确配置');
        }

    } catch (error) {
        console.log(`❌ CORS 预检请求失败: ${error.message}`);
    }
}

async function checkAuthHeaders() {
    try {
        // 检查登录接口的响应头
        const response = await makeRequest('GET', targetUrl + '/console/api/account/profile');

        console.log('\n📍 认证相关响应头:');
        console.log(`  状态码: ${response.statusCode}`);
        console.log(`  WWW-Authenticate: ${response.headers['www-authenticate'] || '未设置'}`);
        console.log(`  Set-Cookie: ${response.headers['set-cookie'] ? '已设置' : '未设置'}`);

        if (response.statusCode === 401) {
            console.log('✅ 返回 401 - 认证接口正常工作');
        } else {
            console.log(`⚠️  意外状态码: ${response.statusCode}`);
        }

    } catch (error) {
        console.log(`❌ 认证头部检查失败: ${error.message}`);
    }
}

async function checkCrossOriginRequest() {
    try {
        // 模拟跨域请求
        const response = await makeRequestWithOrigin('GET', targetUrl + '/console/api/account/profile');

        console.log(`\n📍 跨域请求结果 (Origin: http://localhost):`);
        console.log(`  状态码: ${response.statusCode}`);
        console.log(`  Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || '未设置'}`);
        console.log(`  Access-Control-Allow-Credentials: ${response.headers['access-control-allow-credentials'] || '未设置'}`);

        if (response.headers['access-control-allow-origin'] === '*' &&
            response.headers['access-control-allow-credentials'] === 'true') {
            console.log('⚠️  发现冲突: Allow-Origin=* 但 Allow-Credentials=true');
            console.log('💡 这可能导致跨域认证问题');
        }

    } catch (error) {
        console.log(`❌ 跨域请求检查失败: ${error.message}`);
    }
}

async function checkLoginEndpoint() {
    try {
        // 检查登录接口
        const response = await makeRequest('POST', targetUrl + '/console/api/auth/login', '{}');

        console.log(`\n📍 登录接口检查:`);
        console.log(`  状态码: ${response.statusCode}`);
        console.log(`  Set-Cookie: ${response.headers['set-cookie'] ? response.headers['set-cookie'] : '未设置'}`);

        if (response.headers['set-cookie']) {
            response.headers['set-cookie'].forEach(cookie => {
                console.log(`    ${cookie}`);
                if (cookie.includes('SameSite')) {
                    if (cookie.includes('SameSite=None') && cookie.includes('Secure')) {
                        console.log('    ✅ SameSite=None; Secure 配置正确');
                    } else {
                        console.log('    ⚠️  SameSite 配置可能不支持 iframe');
                    }
                }
            });
        }

    } catch (error) {
        console.log(`❌ 登录接口检查失败: ${error.message}`);
    }
}

function generateSolutions() {
    console.log('\n🎯 解决方案建议:');
    console.log('='.repeat(30));

    console.log('\n1. 立即检查的配置:');
    console.log('   - 确认服务器已重启');
    console.log('   - 检查 Docker 日志: docker compose logs api');
    console.log('   - 验证环境变量是否生效');

    console.log('\n2. 可能需要的额外配置:');
    console.log('   - 检查 Nginx 代理配置是否正确转发头部');
    console.log('   - 确认 Cookie SameSite 属性');
    console.log('   - 验证前端和后端的域名配置');

    console.log('\n3. 服务器端调试方法:');
    console.log('   - curl -v -X OPTIONS http://fy.anyremote.cn:8184/console/api/account/profile');
    console.log('   - curl -v -H "Origin: http://localhost" http://fy.anyremote.cn:8184/console/api/account/profile');
    console.log('   - 检查响应头中的 CORS 配置');

    console.log('\n4. 如果问题持续存在:');
    console.log('   - 考虑使用 URL 参数传递 token');
    console.log('   - 实现 postMessage 通信方案');
    console.log('   - 检查是否有安全中间件阻止跨域');
}

function makeRequest(method, url, data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; dify-server-debug/1.0)'
            }
        };

        if (data) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: responseData
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        if (data) req.write(data);
        req.end();
    });
}

function makeRequestWithOrigin(method, url, data = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; dify-server-debug/1.0)',
                'Origin': 'http://localhost',
                'Referer': 'http://localhost'
            }
        };

        if (data) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: responseData
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        if (data) req.write(data);
        req.end();
    });
}

fullServerDebug();