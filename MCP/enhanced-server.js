#!/usr/bin/env node

/**
 * 增强版 MCP 服务器
 * 集成了文件系统、网络操作、原有基础工具等多种功能
 * 展示了模块化的工具管理和最佳实践
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// 导入工具模块
import filesystemTools from './tools/filesystem.js';
import networkTools from './tools/network.js';

/**
 * 增强版 MCP 服务器类
 */
class EnhancedMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'enhanced-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
      }
    );

    // 工具注册表
    this.toolRegistry = new Map();
    this.resourceRegistry = new Map();
    
    // 性能和统计
    this.stats = {
      toolCalls: 0,
      errors: 0,
      startTime: Date.now()
    };

    this.setupHandlers();
    this.registerTools();
  }

  /**
   * 注册所有工具模块
   */
  registerTools() {
    // 注册文件系统工具
    this.registerToolModule('filesystem', filesystemTools);
    
    // 注册网络工具
    this.registerToolModule('network', networkTools);
    
    // 注册基础工具（内置）
    this.registerBuiltinTools();
    
    console.log(`✅ 已注册 ${this.toolRegistry.size} 个工具`);
  }

  /**
   * 注册工具模块
   */
  registerToolModule(namespace, toolModule) {
    if (!toolModule || !toolModule.definitions || !toolModule.handlers) {
      console.error(`⚠️ 工具模块 ${namespace} 格式不正确`);
      return;
    }

    toolModule.definitions.forEach(tool => {
      const fullName = `${namespace}.${tool.name}`;
      this.toolRegistry.set(fullName, {
        definition: {
          ...tool,
          name: fullName,
          description: `[${namespace.toUpperCase()}] ${tool.description}`
        },
        handler: toolModule.handlers[tool.name],
        namespace,
        originalName: tool.name
      });
    });
  }

  /**
   * 注册内置基础工具
   */
  registerBuiltinTools() {
    const builtinTools = [
      {
        name: 'add_numbers',
        description: '计算两个数字的和',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: '第一个数字' },
            b: { type: 'number', description: '第二个数字' }
          },
          required: ['a', 'b']
        }
      },
      {
        name: 'text_analysis',
        description: '分析文本的基础信息（字符数、单词数等）',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要分析的文本' }
          },
          required: ['text']
        }
      },
      {
        name: 'generate_uuid',
        description: '生成一个随机UUID',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'current_time',
        description: '获取当前系统时间',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: '时间格式（iso, timestamp, locale）',
              enum: ['iso', 'timestamp', 'locale']
            }
          },
          required: []
        }
      },
      {
        name: 'system_info',
        description: '获取系统信息和服务器状态',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'tool_stats',
        description: '获取工具使用统计信息',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ];

    const builtinHandlers = {
      add_numbers: this.addNumbers.bind(this),
      text_analysis: this.analyzeText.bind(this),
      generate_uuid: this.generateUUID.bind(this),
      current_time: this.getCurrentTime.bind(this),
      system_info: this.getSystemInfo.bind(this),
      tool_stats: this.getToolStats.bind(this)
    };

    builtinTools.forEach(tool => {
      this.toolRegistry.set(tool.name, {
        definition: {
          ...tool,
          description: `[BUILTIN] ${tool.description}`
        },
        handler: builtinHandlers[tool.name],
        namespace: 'builtin',
        originalName: tool.name
      });
    });
  }

  /**
   * 设置所有请求处理器
   */
  setupHandlers() {
    // 工具相关处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.toolRegistry.values())
        .map(tool => tool.definition);
      
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.executeToolSafely(request.params.name, request.params.arguments);
    });

    // 资源处理器
    this.setupResourceHandlers();

    // 错误处理
    this.setupErrorHandling();
  }

  /**
   * 安全执行工具
   */
  async executeToolSafely(toolName, args) {
    const startTime = Date.now();
    this.stats.toolCalls++;
    
    try {
      console.log(`🔧 执行工具: ${toolName}`, JSON.stringify(args, null, 2));
      
      const toolInfo = this.toolRegistry.get(toolName);
      if (!toolInfo) {
        throw new Error(`未知工具: ${toolName}`);
      }

      const result = await toolInfo.handler(args);
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ 工具 ${toolName} 执行成功 (${executionTime}ms)`);
      
      return result;
    } catch (error) {
      this.stats.errors++;
      const executionTime = Date.now() - startTime;
      
      console.error(`❌ 工具 ${toolName} 执行失败 (${executionTime}ms):`, error);
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ 执行工具 ${toolName} 时发生错误:\n\n` +
                  `错误信息: ${error.message}\n` +
                  `执行时间: ${executionTime}ms\n\n` +
                  `如果问题持续存在，请检查工具参数是否正确，或联系系统管理员。`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * 设置资源处理器
   */
  setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'server://stats',
            name: '服务器统计信息',
            description: '服务器运行状态和使用统计',
            mimeType: 'application/json'
          },
          {
            uri: 'server://tools',
            name: '工具列表',
            description: '所有可用工具的详细信息',
            mimeType: 'application/json'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'server://stats':
          return await this.getServerStatsResource();
        case 'server://tools':
          return await this.getToolsListResource();
        default:
          throw new Error(`不支持的资源: ${uri}`);
      }
    });
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    process.on('uncaughtException', (error) => {
      console.error('❌ 未捕获的异常:', error);
      this.stats.errors++;
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ 未处理的 Promise 拒绝:', reason);
      this.stats.errors++;
    });
  }

  // ============ 内置工具实现 ============

  async addNumbers(args) {
    const { a, b } = args;
    
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new Error('参数必须是数字');
    }

    const result = a + b;
    
    return {
      content: [
        {
          type: 'text',
          text: `🧮 数学计算结果\n\n${a} + ${b} = ${result}\n\n` +
                `参数信息:\n` +
                `- 第一个数字: ${a} (${typeof a})\n` +
                `- 第二个数字: ${b} (${typeof b})\n` +
                `- 结果类型: ${typeof result}`
        }
      ]
    };
  }

  async analyzeText(args) {
    const { text } = args;
    
    if (typeof text !== 'string') {
      throw new Error('参数必须是字符串');
    }

    const charCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const lineCount = text.split('\n').length;
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // 字符频率分析
    const charFreq = {};
    for (const char of text.toLowerCase()) {
      if (/[a-z0-9\u4e00-\u9fff]/.test(char)) {
        charFreq[char] = (charFreq[char] || 0) + 1;
      }
    }

    const topChars = Object.entries(charFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([char, count]) => `${char}: ${count}次`);

    const analysis = {
      基础统计: {
        字符数: charCount,
        单词数: wordCount,
        行数: lineCount,
        段落数: paragraphCount,
        句子数: sentenceCount,
        是否为空: text.trim().length === 0
      },
      字符分析: {
        平均行长度: (charCount / lineCount).toFixed(1),
        平均单词长度: (charCount / wordCount).toFixed(1) + ' 字符',
        常用字符: topChars
      },
      内容特征: {
        包含数字: /\d/.test(text),
        包含中文: /[\u4e00-\u9fff]/.test(text),
        包含英文: /[a-zA-Z]/.test(text),
        包含特殊字符: /[!@#$%^&*(),.?":{}|<>]/.test(text)
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: `📊 文本分析报告\n\n${JSON.stringify(analysis, null, 2)}`
        }
      ]
    };
  }

  async generateUUID(args) {
    // UUID v4 生成器
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return {
      content: [
        {
          type: 'text',
          text: `🔑 UUID 生成成功\n\n` +
                `生成的UUID: ${uuid}\n` +
                `格式: UUID v4\n` +
                `生成时间: ${new Date().toISOString()}\n` +
                `长度: ${uuid.length} 字符\n\n` +
                `UUID 用途:\n` +
                `- 数据库主键\n` +
                `- 会话标识\n` +
                `- 文件名生成\n` +
                `- 分布式系统中的唯一标识`
        }
      ]
    };
  }

  async getCurrentTime(args) {
    const { format = 'iso' } = args;
    const now = new Date();
    
    let timeString;
    let formatDescription;
    
    switch (format) {
      case 'iso':
        timeString = now.toISOString();
        formatDescription = 'ISO 8601 标准格式';
        break;
      case 'timestamp':
        timeString = now.getTime().toString();
        formatDescription = 'Unix 时间戳（毫秒）';
        break;
      case 'locale':
        timeString = now.toLocaleString('zh-CN', { 
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long'
        });
        formatDescription = '中国本地化格式';
        break;
      default:
        timeString = now.toISOString();
        formatDescription = 'ISO 8601 标准格式（默认）';
    }

    return {
      content: [
        {
          type: 'text',
          text: `🕐 系统时间查询\n\n` +
                `时间: ${timeString}\n` +
                `格式: ${formatDescription}\n` +
                `时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
                `星期: ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}\n\n` +
                `其他格式:\n` +
                `- ISO: ${now.toISOString()}\n` +
                `- 时间戳: ${now.getTime()}\n` +
                `- 本地: ${now.toLocaleString('zh-CN')}`
        }
      ]
    };
  }

  async getSystemInfo(args) {
    const uptime = Date.now() - this.stats.startTime;
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
    
    const systemInfo = {
      服务器信息: {
        名称: 'Enhanced MCP Server',
        版本: '2.0.0',
        启动时间: new Date(this.stats.startTime).toISOString(),
        运行时长: `${uptimeHours} 小时`,
        Node版本: process.version,
        平台: process.platform,
        架构: process.arch
      },
      性能统计: {
        工具调用次数: this.stats.toolCalls,
        错误次数: this.stats.errors,
        成功率: `${((this.stats.toolCalls - this.stats.errors) / Math.max(this.stats.toolCalls, 1) * 100).toFixed(1)}%`,
        注册工具数: this.toolRegistry.size
      },
      内存使用: process.memoryUsage(),
      环境变量: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        USER: process.env.USER || 'unknown'
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: `🖥️ 系统信息报告\n\n${JSON.stringify(systemInfo, null, 2)}`
        }
      ]
    };
  }

  async getToolStats(args) {
    const toolsByNamespace = {};
    
    for (const [name, tool] of this.toolRegistry) {
      if (!toolsByNamespace[tool.namespace]) {
        toolsByNamespace[tool.namespace] = [];
      }
      toolsByNamespace[tool.namespace].push({
        name: tool.originalName,
        fullName: name,
        description: tool.definition.description
      });
    }

    const stats = {
      总计: {
        工具总数: this.toolRegistry.size,
        命名空间数: Object.keys(toolsByNamespace).length,
        调用总次数: this.stats.toolCalls,
        错误次数: this.stats.errors
      },
      按命名空间分类: {}
    };

    for (const [namespace, tools] of Object.entries(toolsByNamespace)) {
      stats.按命名空间分类[namespace] = {
        工具数量: tools.length,
        工具列表: tools
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `📊 工具使用统计\n\n${JSON.stringify(stats, null, 2)}`
        }
      ]
    };
  }

  // ============ 资源实现 ============

  async getServerStatsResource() {
    const stats = {
      uptime: Date.now() - this.stats.startTime,
      toolCalls: this.stats.toolCalls,
      errors: this.stats.errors,
      toolsRegistered: this.toolRegistry.size,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    return {
      contents: [
        {
          uri: 'server://stats',
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2)
        }
      ]
    };
  }

  async getToolsListResource() {
    const tools = Array.from(this.toolRegistry.entries()).map(([name, tool]) => ({
      name,
      namespace: tool.namespace,
      originalName: tool.originalName,
      description: tool.definition.description,
      inputSchema: tool.definition.inputSchema
    }));

    return {
      contents: [
        {
          uri: 'server://tools',
          mimeType: 'application/json',
          text: JSON.stringify(tools, null, 2)
        }
      ]
    };
  }

  /**
   * 启动服务器
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log(`🚀 Enhanced MCP Server v2.0.0 启动成功`);
    console.log(`📅 启动时间: ${new Date().toISOString()}`);
    console.log(`🔧 已注册工具: ${this.toolRegistry.size} 个`);
    console.log(`📊 工具命名空间: ${[...new Set(Array.from(this.toolRegistry.values()).map(t => t.namespace))].join(', ')}`);
    console.log(`⏳ 等待客户端连接...`);
    
    // 优雅关闭处理
    const shutdown = async () => {
      console.log('\n🛑 正在关闭服务器...');
      const uptime = (Date.now() - this.stats.startTime) / 1000;
      console.log(`📊 运行时长: ${uptime.toFixed(1)} 秒`);
      console.log(`🔧 总工具调用: ${this.stats.toolCalls} 次`);
      console.log(`❌ 总错误次数: ${this.stats.errors} 次`);
      
      await this.server.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EnhancedMCPServer();
  server.run().catch(error => {
    console.error('❌ 启动增强版 MCP 服务器时出错:', error);
    process.exit(1);
  });
}

export default EnhancedMCPServer;
