#!/usr/bin/env node

/**
 * 网络操作工具集
 * 提供HTTP请求、文件下载、网络检测等功能
 */

import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';

// 网络工具辅助类
class NetworkUtils {
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static getContentType(response) {
    return response.headers.get('content-type') || 'text/plain';
  }

  static formatHeaders(headers) {
    const formatted = {};
    headers.forEach((value, key) => {
      formatted[key] = value;
    });
    return formatted;
  }

  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default {
  definitions: [
    {
      name: 'http_request',
      description: '发送HTTP请求，支持所有常用HTTP方法和自定义头部',
      inputSchema: {
        type: 'object',
        properties: {
          url: { 
            type: 'string', 
            description: '请求的URL地址' 
          },
          method: { 
            type: 'string', 
            description: 'HTTP请求方法',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
            default: 'GET'
          },
          headers: { 
            type: 'object', 
            description: '请求头部信息，键值对格式',
            default: {}
          },
          body: { 
            type: 'string', 
            description: '请求体内容（仅适用于POST/PUT/PATCH）' 
          },
          timeout: { 
            type: 'number', 
            description: '请求超时时间（毫秒）', 
            default: 10000 
          },
          followRedirects: {
            type: 'boolean',
            description: '是否跟随重定向',
            default: true
          },
          maxRedirects: {
            type: 'number',
            description: '最大重定向次数',
            default: 5
          },
          returnHeaders: {
            type: 'boolean',
            description: '是否在响应中包含头部信息',
            default: false
          }
        },
        required: ['url']
      }
    },
    {
      name: 'download_file',
      description: '下载网络文件到本地指定路径',
      inputSchema: {
        type: 'object',
        properties: {
          url: { 
            type: 'string', 
            description: '文件下载URL' 
          },
          savePath: { 
            type: 'string', 
            description: '保存到本地的文件路径' 
          },
          createDirs: {
            type: 'boolean',
            description: '如果目录不存在是否自动创建',
            default: true
          },
          overwrite: {
            type: 'boolean',
            description: '如果文件已存在是否覆盖',
            default: false
          },
          timeout: {
            type: 'number',
            description: '下载超时时间（毫秒）',
            default: 30000
          },
          maxSize: {
            type: 'number',
            description: '最大下载文件大小（字节）',
            default: 104857600  // 100MB
          },
          showProgress: {
            type: 'boolean',
            description: '是否显示下载进度',
            default: true
          }
        },
        required: ['url', 'savePath']
      }
    },
    {
      name: 'ping_host',
      description: '检测网络主机的连通性和响应时间',
      inputSchema: {
        type: 'object',
        properties: {
          host: {
            type: 'string',
            description: '主机名或IP地址'
          },
          port: {
            type: 'number',
            description: '端口号',
            default: 80
          },
          timeout: {
            type: 'number',
            description: '连接超时时间（毫秒）',
            default: 5000
          },
          attempts: {
            type: 'number',
            description: '尝试次数',
            default: 3
          }
        },
        required: ['host']
      }
    },
    {
      name: 'check_website',
      description: '检查网站状态，包括响应时间、HTTP状态码、SSL证书等信息',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: '网站URL'
          },
          timeout: {
            type: 'number',
            description: '请求超时时间（毫秒）',
            default: 10000
          },
          checkSSL: {
            type: 'boolean',
            description: '是否检查SSL证书信息',
            default: true
          },
          followRedirects: {
            type: 'boolean',
            description: '是否跟随重定向',
            default: true
          }
        },
        required: ['url']
      }
    },
    {
      name: 'get_ip_info',
      description: '获取IP地址的地理位置和ISP信息',
      inputSchema: {
        type: 'object',
        properties: {
          ip: {
            type: 'string',
            description: 'IP地址（留空则查询当前公网IP）'
          },
          provider: {
            type: 'string',
            description: 'IP查询服务提供商',
            enum: ['ipapi', 'ipinfo', 'ipgeolocation'],
            default: 'ipapi'
          }
        },
        required: []
      }
    }
  ],

  handlers: {
    async http_request(args) {
      const { 
        url, 
        method = 'GET', 
        headers = {}, 
        body, 
        timeout = 10000,
        followRedirects = true,
        maxRedirects = 5,
        returnHeaders = false
      } = args;

      if (!NetworkUtils.validateUrl(url)) {
        throw new Error('无效的URL格式');
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions = {
          method,
          headers: {
            'User-Agent': 'MCP-Server/1.0 (Network Tools)',
            'Accept': '*/*',
            ...headers
          },
          signal: controller.signal,
          redirect: followRedirects ? 'follow' : 'manual'
        };

        // 添加请求体（仅适用于特定方法）
        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
          requestOptions.body = body;
          // 如果没有指定Content-Type，尝试自动设置
          if (!requestOptions.headers['Content-Type']) {
            try {
              JSON.parse(body);
              requestOptions.headers['Content-Type'] = 'application/json';
            } catch {
              requestOptions.headers['Content-Type'] = 'text/plain';
            }
          }
        }

        const startTime = Date.now();
        const response = await fetch(url, requestOptions);
        const responseTime = Date.now() - startTime;

        clearTimeout(timeoutId);

        const contentType = NetworkUtils.getContentType(response);
        let responseBody;
        let responseSize = 0;

        try {
          if (contentType.includes('application/json')) {
            responseBody = await response.json();
            responseSize = JSON.stringify(responseBody).length;
          } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
            responseBody = await response.text();
            responseSize = responseBody.length;
          } else {
            // 对于二进制内容，只获取部分信息
            const arrayBuffer = await response.arrayBuffer();
            responseSize = arrayBuffer.byteLength;
            responseBody = `[二进制内容，大小: ${NetworkUtils.formatBytes(responseSize)}]`;
          }
        } catch (error) {
          responseBody = `[无法解析响应体: ${error.message}]`;
        }

        const result = {
          request: {
            url,
            method: method.toUpperCase(),
            headers: returnHeaders ? requestOptions.headers : undefined
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            contentType,
            size: NetworkUtils.formatBytes(responseSize),
            responseTime: `${responseTime}ms`,
            headers: returnHeaders ? NetworkUtils.formatHeaders(response.headers) : undefined,
            body: typeof responseBody === 'object' 
              ? JSON.stringify(responseBody, null, 2) 
              : responseBody
          }
        };

        return {
          content: [{
            type: 'text',
            text: `HTTP ${method.toUpperCase()} 请求完成\n\n` +
                  `🌐 URL: ${url}\n` +
                  `📊 状态: ${response.status} ${response.statusText}\n` +
                  `⏱️ 响应时间: ${responseTime}ms\n` +
                  `📦 内容类型: ${contentType}\n` +
                  `📏 响应大小: ${NetworkUtils.formatBytes(responseSize)}\n\n` +
                  `${returnHeaders ? '📋 响应头:\n' + JSON.stringify(result.response.headers, null, 2) + '\n\n' : ''}` +
                  `📄 响应内容:\n${'='.repeat(50)}\n${result.response.body}\n${'='.repeat(50)}`
          }]
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error(`请求超时 (${timeout}ms)`);
        }
        throw new Error(`HTTP请求失败: ${error.message}`);
      }
    },

    async download_file(args) {
      const { 
        url, 
        savePath, 
        createDirs = true,
        overwrite = false,
        timeout = 30000,
        maxSize = 104857600,
        showProgress = true
      } = args;

      if (!NetworkUtils.validateUrl(url)) {
        throw new Error('无效的URL格式');
      }

      try {
        // 检查文件是否已存在
        if (!overwrite) {
          try {
            await fs.access(savePath);
            throw new Error('文件已存在，设置 overwrite = true 以覆盖');
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
        }

        // 创建目录
        if (createDirs) {
          await fs.mkdir(path.dirname(savePath), { recursive: true });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const startTime = Date.now();
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'MCP-Server/1.0 (File Downloader)'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = parseInt(response.headers.get('content-length') || '0');
        
        if (contentLength > maxSize) {
          throw new Error(`文件太大 (${NetworkUtils.formatBytes(contentLength)})，最大允许 ${NetworkUtils.formatBytes(maxSize)}`);
        }

        // 获取文件流并写入
        const reader = response.body.getReader();
        const writer = await fs.open(savePath, 'w');
        
        let downloadedBytes = 0;
        let lastProgressTime = Date.now();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            downloadedBytes += value.length;
            
            if (downloadedBytes > maxSize) {
              throw new Error('下载的文件大小超过限制');
            }

            await writer.write(value);

            // 显示进度（每500ms更新一次）
            if (showProgress && Date.now() - lastProgressTime > 500) {
              const progress = contentLength > 0 
                ? `${(downloadedBytes / contentLength * 100).toFixed(1)}%` 
                : NetworkUtils.formatBytes(downloadedBytes);
              console.log(`下载进度: ${progress}`);
              lastProgressTime = Date.now();
            }
          }
        } finally {
          await writer.close();
        }

        const downloadTime = Date.now() - startTime;
        const stats = await fs.stat(savePath);

        return {
          content: [{
            type: 'text',
            text: `文件下载成功! 🎉\n\n` +
                  `🌐 URL: ${url}\n` +
                  `💾 保存路径: ${savePath}\n` +
                  `📏 文件大小: ${NetworkUtils.formatBytes(stats.size)}\n` +
                  `⏱️ 下载时间: ${downloadTime}ms\n` +
                  `🚀 平均速度: ${NetworkUtils.formatBytes(stats.size / (downloadTime / 1000))}/s\n` +
                  `📅 创建时间: ${stats.birthtime.toISOString()}`
          }]
        };
      } catch (error) {
        // 清理可能创建的不完整文件
        try {
          await fs.unlink(savePath);
        } catch {}
        
        if (error.name === 'AbortError') {
          throw new Error(`下载超时 (${timeout}ms)`);
        }
        throw new Error(`下载失败: ${error.message}`);
      }
    },

    async ping_host(args) {
      const { host, port = 80, timeout = 5000, attempts = 3 } = args;

      const results = [];
      let successCount = 0;

      for (let i = 0; i < attempts; i++) {
        try {
          const startTime = Date.now();
          
          // 使用 fetch 测试连通性
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const response = await fetch(`http://${host}:${port}`, {
              method: 'HEAD',
              signal: controller.signal
            });
            
            const responseTime = Date.now() - startTime;
            clearTimeout(timeoutId);
            
            results.push({
              attempt: i + 1,
              success: true,
              responseTime: `${responseTime}ms`,
              status: response.status
            });
            successCount++;
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (error) {
          const responseTime = Date.now() - Date.now();
          results.push({
            attempt: i + 1,
            success: false,
            error: error.name === 'AbortError' ? 'timeout' : error.message,
            responseTime: error.name === 'AbortError' ? `>${timeout}ms` : `${responseTime}ms`
          });
        }
      }

      const successRate = (successCount / attempts * 100).toFixed(1);
      const avgResponseTime = results
        .filter(r => r.success)
        .reduce((acc, r) => acc + parseInt(r.responseTime), 0) / successCount || 0;

      return {
        content: [{
          type: 'text',
          text: `网络连通性测试结果 📊\n\n` +
                `🎯 目标: ${host}:${port}\n` +
                `📈 成功率: ${successRate}% (${successCount}/${attempts})\n` +
                `⏱️ 平均响应时间: ${avgResponseTime.toFixed(0)}ms\n\n` +
                `详细结果:\n${JSON.stringify(results, null, 2)}`
        }]
      };
    },

    async check_website(args) {
      const { url, timeout = 10000, checkSSL = true, followRedirects = true } = args;

      if (!NetworkUtils.validateUrl(url)) {
        throw new Error('无效的URL格式');
      }

      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: followRedirects ? 'follow' : 'manual'
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        const urlObj = new URL(url);
        const isHTTPS = urlObj.protocol === 'https:';

        const result = {
          url,
          status: {
            code: response.status,
            text: response.statusText,
            ok: response.ok
          },
          performance: {
            responseTime: `${responseTime}ms`,
            size: response.headers.get('content-length') || 'unknown'
          },
          security: {
            protocol: urlObj.protocol,
            isSecure: isHTTPS
          },
          server: {
            server: response.headers.get('server') || 'unknown',
            lastModified: response.headers.get('last-modified') || 'unknown',
            contentType: response.headers.get('content-type') || 'unknown'
          },
          caching: {
            cacheControl: response.headers.get('cache-control') || 'none',
            etag: response.headers.get('etag') || 'none'
          }
        };

        // SSL 证书检查（简化版）
        if (checkSSL && isHTTPS) {
          result.ssl = {
            enabled: true,
            note: 'SSL证书详细检查需要专门的SSL检查工具'
          };
        }

        return {
          content: [{
            type: 'text',
            text: `网站状态检查结果 🔍\n\n` +
                  `🌐 URL: ${url}\n` +
                  `✅ 状态: ${response.status} ${response.statusText}\n` +
                  `⏱️ 响应时间: ${responseTime}ms\n` +
                  `🔒 协议: ${urlObj.protocol.toUpperCase()}\n` +
                  `🖥️ 服务器: ${result.server.server}\n` +
                  `📄 内容类型: ${result.server.contentType}\n\n` +
                  `详细信息:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error(`请求超时 (${timeout}ms)`);
        }
        throw new Error(`网站检查失败: ${error.message}`);
      }
    },

    async get_ip_info(args) {
      const { ip, provider = 'ipapi' } = args;

      const providers = {
        ipapi: ip ? `http://ip-api.com/json/${ip}` : 'http://ip-api.com/json/',
        ipinfo: ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json',
        ipgeolocation: ip ? `https://api.ipgeolocation.io/ipgeo?ip=${ip}` : 'https://api.ipgeolocation.io/ipgeo'
      };

      const apiUrl = providers[provider];
      if (!apiUrl) {
        throw new Error(`不支持的提供商: ${provider}`);
      }

      try {
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'MCP-Server/1.0 (IP Info Tool)'
          }
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();

        // 统一不同提供商的响应格式
        const normalizedData = {
          ip: data.query || data.ip || ip || 'unknown',
          country: data.country || data.country_name || 'unknown',
          region: data.regionName || data.region || data.state_prov || 'unknown',
          city: data.city || 'unknown',
          timezone: data.timezone || data.time_zone?.name || 'unknown',
          isp: data.isp || data.org || data.organization || 'unknown',
          location: {
            latitude: data.lat || data.latitude || 'unknown',
            longitude: data.lon || data.longitude || 'unknown'
          },
          provider: provider
        };

        return {
          content: [{
            type: 'text',
            text: `IP地址信息查询结果 🌍\n\n` +
                  `🔢 IP地址: ${normalizedData.ip}\n` +
                  `🏳️ 国家: ${normalizedData.country}\n` +
                  `🏙️ 地区: ${normalizedData.region}\n` +
                  `🌆 城市: ${normalizedData.city}\n` +
                  `🕐 时区: ${normalizedData.timezone}\n` +
                  `🌐 ISP: ${normalizedData.isp}\n` +
                  `📍 坐标: ${normalizedData.location.latitude}, ${normalizedData.location.longitude}\n\n` +
                  `详细信息:\n${JSON.stringify(normalizedData, null, 2)}`
          }]
        };
      } catch (error) {
        throw new Error(`IP信息查询失败: ${error.message}`);
      }
    }
  }
};
