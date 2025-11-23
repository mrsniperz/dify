#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * iframe 认证问题诊断工具
 * 专门用于诊断 iframe 中的登录和认证问题
 */

class AuthIssueDiagnostics {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = [];
        this.session = null;
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${type}: ${message}`;
        console.log(logMessage);
        this.results.push({ timestamp, type, message });
    }

    async diagnose() {
        this.log(`开始诊断 ${this.baseUrl} 的认证问题`);
        this.log('='.repeat(60));

        try {
            // 1. 检查基本连接
            await this.checkBasicConnection();

            // 2. 检查安全头部
            await this.checkSecurityHeaders();

            // 3. 检查登录页面
            await this.checkLoginPage();

            // 4. 检查认证端点
            await this.checkAuthEndpoints();

            // 5. 模拟登录流程
            await this.testLoginFlow();

            // 6. 生成诊断报告
            this.generateReport();

        } catch (error) {
            this.log(`诊断过程中发生错误: ${error.message}`, 'ERROR');
        }
    }

    async checkBasicConnection() {
        this.log('\n🔍 1. 检查基本连接');
        try {
            const response = await this.makeRequest('GET', this.baseUrl);
            this.log(`✅ 基本连接成功 (状态码: ${response.statusCode})`, 'SUCCESS');
            this.log(`响应头 Content-Type: ${response.headers['content-type'] || '未知'}`);
        } catch (error) {
            this.log(`❌ 基本连接失败: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async checkSecurityHeaders() {
        this.log('\n🔍 2. 检查安全头部');
        const response = await this.makeRequest('GET', this.baseUrl);

        const criticalHeaders = [
            'x-frame-options',
            'content-security-policy',
            'set-cookie',
            'access-control-allow-origin',
            'access-control-allow-credentials'
        ];

        for (const header of criticalHeaders) {
            const value = response.headers[header];
            if (value) {
                this.log(`${header}: ${value}`, 'INFO');

                // 检查关键的安全问题
                if (header === 'x-frame-options') {
                    if (value.toLowerCase().includes('deny')) {
                        this.log('❌ X-Frame-Options: DENY - iframe 被明确禁止', 'ERROR');
                    } else if (value.toLowerCase().includes('sameorigin')) {
                        this.log('⚠️  X-Frame-Options: SAMEORIGIN - 只允许同源 iframe', 'WARN');
                    }
                }

                if (header === 'content-security-policy') {
                    if (value.includes("frame-ancestors 'none'")) {
                        this.log('❌ CSP frame-ancestors: none - iframe 被禁止', 'ERROR');
                    } else if (value.includes("frame-ancestors 'self'")) {
                        this.log('⚠️  CSP frame-ancestors: self - 只允许同源 iframe', 'WARN');
                    }
                }

                if (header === 'set-cookie') {
                    this.analyzeCookieHeader(value);
                }
            } else {
                this.log(`${header}: 未设置`, 'INFO');
            }
        }
    }

    analyzeCookieHeader(setCookieHeader) {
        this.log('🍪 分析 Cookie 设置:');

        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        cookies.forEach(cookie => {
            this.log(`   Cookie: ${cookie}`, 'INFO');

            if (cookie.includes('SameSite=Strict')) {
                this.log('   ❌ SameSite=Strict - iframe 中无法使用', 'ERROR');
            } else if (cookie.includes('SameSite=Lax')) {
                this.log('   ⚠️  SameSite=Lax - 可能在 iframe 中有问题', 'WARN');
            } else if (cookie.includes('SameSite=None')) {
                if (cookie.includes('Secure')) {
                    this.log('   ✅ SameSite=None + Secure - 适合 iframe', 'SUCCESS');
                } else {
                    this.log('   ⚠️  SameSite=None 但缺少 Secure 属性', 'WARN');
                }
            }
        });
    }

    async checkLoginPage() {
        this.log('\n🔍 3. 检查登录页面');

        const loginPaths = [
            '/console/api/auth',
            '/console/api/login',
            '/api/auth',
            '/login',
            '/auth/login'
        ];

        for (const path of loginPaths) {
            try {
                const loginUrl = this.baseUrl + path;
                const response = await this.makeRequest('GET', loginUrl);

                if (response.statusCode < 500) {
                    this.log(`✅ 发现登录端点: ${path} (状态: ${response.statusCode})`, 'SUCCESS');

                    if (response.headers['set-cookie']) {
                        this.log('   登录端点设置了 Cookie', 'INFO');
                    }
                }
            } catch (error) {
                // 忽略不存在的端点
            }
        }
    }

    async checkAuthEndpoints() {
        this.log('\n🔍 4. 检查认证端点');

        const authPaths = [
            '/console/api/account/profile',
            '/console/api/workspaces/current',
            '/console/api/refresh-token'
        ];

        for (const path of authPaths) {
            try {
                const authUrl = this.baseUrl + path;
                const response = await this.makeRequest('GET', authUrl);

                if (response.statusCode === 401) {
                    this.log(`✅ ${path} 正确返回 401 (未认证)`, 'SUCCESS');
                } else if (response.statusCode === 200) {
                    this.log(`⚠️  ${path} 返回 200 (可能已认证或不需要认证)`, 'WARN');
                } else {
                    this.log(`📝 ${path} 返回 ${response.statusCode}`, 'INFO');
                }
            } catch (error) {
                this.log(`❌ ${path} 请求失败: ${error.message}`, 'ERROR');
            }
        }
    }

    async testLoginFlow() {
        this.log('\n🔍 5. 模拟登录流程');
        this.log('注意: 这是一个简化的测试，实际登录可能需要 CSRF token 等保护机制');

        // 检查是否有常见的登录 API
        const loginApiPaths = [
            '/console/api/auth/login',
            '/console/api/login',
            '/api/auth/login'
        ];

        for (const path of loginApiPaths) {
            try {
                const loginUrl = this.baseUrl + path;

                // 尝试 POST 请求（可能需要更复杂的payload）
                const response = await this.makeRequest('POST', loginUrl, '{}');

                if (response.statusCode !== 404) {
                    this.log(`✅ 发现登录 API: ${path}`, 'SUCCESS');
                    this.log(`   响应状态: ${response.statusCode}`, 'INFO');

                    if (response.headers['set-cookie']) {
                        this.log('   登录 API 设置了认证 Cookie', 'SUCCESS');
                    }
                }
            } catch (error) {
                // 忽略，继续检查其他路径
            }
        }
    }

    async makeRequest(method, url, data = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; iframe-auth-tester/1.0)',
                    'Accept': 'application/json, text/html, */*',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
                }
            };

            if (data) {
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(data);
            }

            const req = httpModule.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: responseData
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('请求超时'));
            });

            req.setTimeout(10000);

            if (data) {
                req.write(data);
            }

            req.end();
        });
    }

    generateReport() {
        this.log('\n📋 诊断报告总结');
        this.log('='.repeat(60));

        // 检查是否有错误
        const errors = this.results.filter(r => r.type === 'ERROR');
        const warnings = this.results.filter(r => r.type === 'WARN');
        const successes = this.results.filter(r => r.type === 'SUCCESS');

        if (errors.length === 0 && warnings.length === 0) {
            this.log('✅ 未发现明显的 iframe 认证问题', 'SUCCESS');
        } else {
            if (errors.length > 0) {
                this.log(`\n❌ 发现 ${errors.length} 个错误:`);
                errors.forEach(error => this.log(`   • ${error.message}`));
            }

            if (warnings.length > 0) {
                this.log(`\n⚠️  发现 ${warnings.length} 个警告:`);
                warnings.forEach(warning => this.log(`   • ${warning.message}`));
            }
        }

        this.log('\n💡 建议的解决方案:');
        this.log('1. 确保服务器的 Cookie 包含 SameSite=None 和 Secure 属性');
        this.log('2. 检查 Content-Security-Policy 中的 frame-ancestors 设置');
        this.log('3. 确认 X-Frame-Options 允许 iframe 嵌入');
        this.log('4. 考虑使用 postMessage 在 iframe 和父页面间传递认证信息');
        this.log('5. 确保所有认证相关的 API 都支持 CORS');

        this.log('\n🔧 下一步测试建议:');
        this.log('1. 使用 auth-debug.html 进行实时测试');
        this.log('2. 在浏览器开发者工具中监控 Network 和 Storage 标签');
        this.log('3. 对比直接访问和 iframe 访问的差异');
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('使用方法: node check-auth-issues.js <URL>');
        console.log('示例: node check-auth-issues.js https://fy.anyremote.cn:8184');
        process.exit(1);
    }

    const baseUrl = args[0];
    const diagnostics = new AuthIssueDiagnostics(baseUrl);

    diagnostics.diagnose()
        .then(() => {
            console.log('\n诊断完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n诊断失败:', error.message);
            process.exit(1);
        });
}

module.exports = AuthIssueDiagnostics;