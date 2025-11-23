#!/usr/bin/env node

const http = require('http');

console.log('🎯 Dify iframe 配置最终验证');
console.log('='.repeat(50));

const targetUrl = 'http://fy.anyremote.cn:8184';

async function verifyConfiguration() {
    console.log('\n📋 检查配置项目:');

    const checks = [
        {
            name: 'docker-compose.yaml CORS_ALLOW_CREDENTIALS 默认值',
            check: checkDockerComposeDefault
        },
        {
            name: '.env CORS_ALLOW_CREDENTIALS 设置',
            check: checkEnvFile
        },
        {
            name: '服务器 CORS 响应头',
            check: checkServerHeaders
        },
        {
            name: 'Cookie 域配置',
            check: checkCookieDomain
        }
    ];

    let passed = 0;
    let total = checks.length;

    for (const { name, check } of checks) {
        try {
            const result = await check();
            if (result) {
                console.log(`✅ ${name}: 通过`);
                passed++;
            } else {
                console.log(`❌ ${name}: 失败`);
            }
        } catch (error) {
            console.log(`⚠️  ${name}: 错误 - ${error.message}`);
        }
    }

    console.log('\n📊 验证结果:');
    console.log(`通过: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 所有配置检查通过！');
        console.log('📋 下一步操作:');
        console.log('1. 重启 Docker 服务:');
        console.log('   cd /path/to/dify/docker');
        console.log('   docker compose restart api web nginx');
        console.log('\n2. 测试 iframe 登录:');
        console.log('   open session-debug.html');
        console.log('\n3. 如果仍有问题，运行:');
        console.log('   node quick-diagnosis.js');
    } else {
        console.log('\n⚠️  仍有配置问题需要修复');
    }
}

async function checkDockerComposeDefault() {
    const fs = require('fs');
    const content = fs.readFileSync('/mnt/e/Projects/dify/docker/docker-compose.yaml', 'utf8');
    return content.includes('CORS_ALLOW_CREDENTIALS: ${CORS_ALLOW_CREDENTIALS:-true}');
}

async function checkEnvFile() {
    const fs = require('fs');
    const content = fs.readFileSync('/mnt/e/Projects/dify/docker/.env', 'utf8');
    return content.includes('CORS_ALLOW_CREDENTIALS=true') &&
           content.includes('COOKIE_DOMAIN=anyremote.cn');
}

async function checkServerHeaders() {
    try {
        const response = await makeRequest('OPTIONS', targetUrl + '/console/api/account/profile');
        return response.headers['access-control-allow-credentials'] === 'true';
    } catch (error) {
        return false;
    }
}

async function checkCookieDomain() {
    const fs = require('fs');
    const content = fs.readFileSync('/mnt/e/Projects/dify/docker/.env', 'utf8');
    return content.includes('COOKIE_DOMAIN=anyremote.cn') &&
           content.includes('NEXT_PUBLIC_COOKIE_DOMAIN=anyremote.cn');
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
                'User-Agent': 'Mozilla/5.0 (compatible; dify-verification/1.0)',
                'Origin': 'http://localhost',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization'
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

verifyConfiguration();