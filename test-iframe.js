#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * iframe 访问测试工具
 * 用于检测 URL 是否可以在 iframe 中正常访问
 */

class IframeTester {
    constructor() {
        this.results = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${type}: ${message}`;
        console.log(logMessage);
        this.results.push({ timestamp, type, message });
    }

    async testUrl(targetUrl) {
        this.log(`开始测试 URL: ${targetUrl}`);

        try {
            // 1. 检查 URL 格式
            const url = new URL(targetUrl);
            this.log(`URL 格式正确: 协议=${url.protocol}, 主机=${url.hostname}, 端口=${url.port || '默认'}`);

            // 2. 检查 HTTP 响应头
            const responseHeaders = await this.getHeaders(targetUrl);
            this.analyzeHeaders(responseHeaders, targetUrl);

        } catch (error) {
            this.log(`URL 测试失败: ${error.message}`, 'ERROR');
        }
    }

    async getHeaders(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;

            const request = protocol.request(url, { method: 'HEAD', timeout: 10000 }, (response) => {
                let headers = {};

                // 收集响应头
                for (const [key, value] of Object.entries(response.headers)) {
                    headers[key.toLowerCase()] = value;
                }

                resolve({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    headers: headers
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            request.on('timeout', () => {
                request.destroy();
                reject(new Error('请求超时'));
            });

            request.end();
        });
    }

    analyzeHeaders(headers, url) {
        this.log(`HTTP 状态码: ${headers.statusCode} ${headers.statusMessage}`);

        // 检查关键的安全头部
        const securityHeaders = {
            'x-frame-options': 'X-Frame-Options (控制iframe嵌入)',
            'content-security-policy': 'Content-Security-Policy (内容安全策略)',
            'access-control-allow-origin': 'Access-Control-Allow-Origin (CORS允许来源)',
            'access-control-allow-methods': 'Access-Control-Allow-Methods (CORS允许方法)',
            'access-control-allow-headers': 'Access-Control-Allow-Headers (CORS允许头部)',
            'cross-origin-opener-policy': 'Cross-Origin-Opener-Policy (跨域 opener 策略)',
            'cross-origin-embedder-policy': 'Cross-Origin-Embedder-Policy (跨域 embedder 策略)'
        };

        let canEmbed = true;
        let reasons = [];

        for (const [header, description] of Object.entries(securityHeaders)) {
            const value = headers.headers[header];
            if (value) {
                this.log(`${description}: ${value}`);

                // 检查 X-Frame-Options
                if (header === 'x-frame-options') {
                    if (value.toLowerCase() === 'deny') {
                        canEmbed = false;
                        reasons.push('X-Frame-Options: DENY - 禁止所有iframe嵌入');
                    } else if (value.toLowerCase() === 'sameorigin') {
                        // 需要检查是否同源
                        const targetOrigin = new URL(url).origin;
                        const currentOrigin = 'http://localhost:3000'; // 假设当前服务运行在3000端口
                        if (targetOrigin !== currentOrigin) {
                            canEmbed = false;
                            reasons.push(`X-Frame-Options: SAMEORIGIN - 只允许同源嵌入 (${targetOrigin} != ${currentOrigin})`);
                        }
                    }
                }

                // 检查 Content-Security-Policy 中的 frame-ancestors
                if (header === 'content-security-policy') {
                    const frameAncestorsMatch = value.match(/frame-ancestors\s+([^;]+)/);
                    if (frameAncestorsMatch) {
                        const frameAncestors = frameAncestorsMatch[1].trim();
                        if (frameAncestors === "'none'") {
                            canEmbed = false;
                            reasons.push('Content-Security-Policy: frame-ancestors \'none\' - 禁止所有iframe嵌入');
                        } else if (frameAncestors === "'self'") {
                            // 类似 SAMEORIGIN 的检查
                            const targetOrigin = new URL(url).origin;
                            const currentOrigin = 'http://localhost:3000';
                            if (targetOrigin !== currentOrigin) {
                                canEmbed = false;
                                reasons.push(`Content-Security-Policy: frame-ancestors 'self' - 只允许同源嵌入`);
                            }
                        }
                    }
                }
            } else {
                this.log(`${description}: 未设置`);
            }
        }

        // 总结
        this.log('\n=== 测试结果总结 ===');
        if (canEmbed) {
            this.log('✅ 该链接可以在 iframe 中正常访问', 'SUCCESS');
            this.log('建议: 可以安全地在iframe中嵌入此页面');
        } else {
            this.log('❌ 该链接无法在 iframe 中正常访问', 'ERROR');
            reasons.forEach(reason => this.log(`- ${reason}`, 'ERROR'));
            this.log('\n解决方案:');
            this.log('1. 修改服务器配置，移除或调整 X-Frame-Options 头部');
            this.log('2. 更新 Content-Security-Policy，允许 frame-ancestors');
            this.log('3. 确保正确配置 CORS 相关头部');
        }

        // 检查其他有用的信息
        this.log('\n=== 其他信息 ===');
        this.log(`Content-Type: ${headers.headers['content-type'] || '未知'}`);
        this.log(`Server: ${headers.headers['server'] || '未知'}`);
        this.log(`Content-Length: ${headers.headers['content-length'] || '未知'}`);
    }

    generateReport() {
        console.log('\n=== 完整测试报告 ===');
        this.results.forEach(result => {
            const icon = result.type === 'SUCCESS' ? '✅' :
                        result.type === 'ERROR' ? '❌' :
                        result.type === 'INFO' ? 'ℹ️' : '📝';
            console.log(`${icon} [${result.timestamp}] ${result.type}: ${result.message}`);
        });
    }
}

// 命令行使用
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('使用方法: node test-iframe.js <URL>');
        console.log('示例: node test-iframe.js http://localhost:3000');
        console.log('示例: node test-iframe.js https://your-domain.com');
        process.exit(1);
    }

    const tester = new IframeTester();
    const targetUrl = args[0];

    tester.testUrl(targetUrl)
        .then(() => {
            tester.generateReport();
            process.exit(0);
        })
        .catch((error) => {
            console.error('测试过程中发生错误:', error.message);
            process.exit(1);
        });
}

module.exports = IframeTester;