#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * MCP服务器示例
 * 提供基础的工具和资源功能
 */
class MCPDemoServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-demo-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  /**
   * 设置工具处理器
   */
  setupToolHandlers() {
    // 列出所有可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_numbers',
            description: '计算两个数字的和',
            inputSchema: {
              type: 'object',
              properties: {
                a: {
                  type: 'number',
                  description: '第一个数字'
                },
                b: {
                  type: 'number',
                  description: '第二个数字'
                }
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
                text: {
                  type: 'string',
                  description: '要分析的文本'
                }
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
          }
        ]
      };
    });

    // 执行工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_numbers':
            return await this.addNumbers(args);
          
          case 'text_analysis':
            return await this.analyzeText(args);
          
          case 'generate_uuid':
            return await this.generateUUID(args);
          
          case 'current_time':
            return await this.getCurrentTime(args);

          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `执行工具 ${name} 时出错: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * 设置资源处理器
   */
  setupResourceHandlers() {
    // 这里可以添加资源处理逻辑
    // 例如文件读取、数据库查询等
  }

  /**
   * 工具实现：数字相加
   */
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
          text: `计算结果: ${a} + ${b} = ${result}`
        }
      ]
    };
  }

  /**
   * 工具实现：文本分析
   */
  async analyzeText(args) {
    const { text } = args;
    
    if (typeof text !== 'string') {
      throw new Error('参数必须是字符串');
    }

    const charCount = text.length;
    const wordCount = text.trim().split(/\\s+/).filter(word => word.length > 0).length;
    const lineCount = text.split('\\n').length;
    const paragraphCount = text.split(/\\n\\s*\\n/).filter(p => p.trim().length > 0).length;

    const analysis = {
      字符数: charCount,
      单词数: wordCount,
      行数: lineCount,
      段落数: paragraphCount,
      是否为空: text.trim().length === 0
    };

    return {
      content: [
        {
          type: 'text',
          text: `文本分析结果:\\n${JSON.stringify(analysis, null, 2)}`
        }
      ]
    };
  }

  /**
   * 工具实现：生成UUID
   */
  async generateUUID(args) {
    // 简单的UUID生成器
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    return {
      content: [
        {
          type: 'text',
          text: `生成的UUID: ${uuid}`
        }
      ]
    };
  }

  /**
   * 工具实现：获取当前时间
   */
  async getCurrentTime(args) {
    const { format = 'iso' } = args;
    const now = new Date();
    
    let timeString;
    switch (format) {
      case 'iso':
        timeString = now.toISOString();
        break;
      case 'timestamp':
        timeString = now.getTime().toString();
        break;
      case 'locale':
        timeString = now.toLocaleString('zh-CN', { 
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        break;
      default:
        timeString = now.toISOString();
    }

    return {
      content: [
        {
          type: 'text',
          text: `当前时间 (${format}): ${timeString}`
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
    
    // 优雅关闭处理
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MCPDemoServer();
  server.run().catch(error => {
    console.error('启动MCP服务器时出错:', error);
    process.exit(1);
  });
}

export default MCPDemoServer;
