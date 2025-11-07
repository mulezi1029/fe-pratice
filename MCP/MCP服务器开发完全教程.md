# MCP 服务器开发完全教程

> 从零基础到高级开发的全面指南

## 📖 目录

1. [MCP 协议基础](#1-mcp-协议基础)
2. [开发环境设置](#2-开发环境设置)
3. [项目结构详解](#3-项目结构详解)
4. [基础工具开发](#4-基础工具开发)
5. [高级功能开发](#5-高级功能开发)
6. [最佳实践](#6-最佳实践)
7. [部署与配置](#7-部署与配置)
8. [调试与排错](#8-调试与排错)
9. [实战项目示例](#9-实战项目示例)
10. [进阶扩展](#10-进阶扩展)

---

## 1. MCP 协议基础

### 1.1 什么是 MCP？

**MCP (Model Context Protocol)** 是一个标准化的协议，用于AI模型与外部工具、资源和数据源之间的通信。它允许AI助手：

- 调用外部工具和函数
- 访问文件和数据库等资源
- 获取实时信息
- 执行复杂的操作流程

### 1.2 MCP 架构图

```
┌─────────────────┐    MCP协议     ┌─────────────────┐
│                 │◄──────────────►│                 │
│   AI 客户端      │                │   MCP 服务器     │
│  (Cursor/Claude) │                │  (你的服务器)    │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
                                           │
                                           ▼
                                    ┌─────────────────┐
                                    │   外部资源/API   │
                                    │   文件系统       │
                                    │   数据库         │
                                    │   网络服务       │
                                    └─────────────────┘
```

### 1.3 核心概念

#### 🔧 **工具 (Tools)**
- 可执行的函数或命令
- 接收参数并返回结果
- 示例：文件操作、API调用、计算功能

#### 📁 **资源 (Resources)**
- 可读取的数据源
- 文件、数据库记录、网络内容等
- 提供结构化的数据访问

#### 💬 **提示 (Prompts)**
- 预定义的提示模板
- 帮助AI更好地使用工具和资源
- 提供上下文和使用指导

---

## 2. 开发环境设置

### 2.1 系统要求

```bash
# 检查系统要求
node --version  # 需要 >= 18.0.0
npm --version   # 或 yarn
```

### 2.2 快速开始

```bash
# 1. 克隆或创建项目
mkdir my-mcp-server
cd my-mcp-server

# 2. 初始化项目
npm init -y

# 3. 安装核心依赖
npm install @modelcontextprotocol/sdk zod

# 4. 安装开发依赖
npm install --save-dev nodemon

# 5. 配置 package.json
```

### 2.3 项目配置

**package.json 配置示例：**
```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 3. 项目结构详解

### 3.1 推荐项目结构

```
my-mcp-server/
├── package.json          # 项目配置
├── server.js             # 主服务器文件
├── test.js              # 测试文件
├── README.md            # 项目文档
├── tools/               # 工具实现
│   ├── basic.js         # 基础工具
│   ├── file.js          # 文件操作工具
│   └── api.js           # API调用工具
├── resources/           # 资源处理
│   ├── filesystem.js    # 文件系统资源
│   └── database.js      # 数据库资源
├── prompts/             # 提示模板
│   └── templates.js     # 提示模板定义
├── config/              # 配置文件
│   └── settings.js      # 服务器设置
└── utils/               # 工具函数
    ├── validation.js    # 参数验证
    └── helpers.js       # 辅助函数
```

### 3.2 核心文件说明

#### **server.js - 主服务器文件**
```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'my-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},      // 工具能力
          resources: {},  // 资源能力
          prompts: {}     // 提示能力
        },
      }
    );
    
    this.setupHandlers();
  }

  setupHandlers() {
    // 设置工具处理器
    // 设置资源处理器  
    // 设置提示处理器
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

---

## 4. 基础工具开发

### 4.1 工具开发基础

#### 工具的三个核心组成：

1. **工具描述** (Tool Description)
2. **参数验证** (Input Schema)
3. **执行逻辑** (Handler Function)

### 4.2 第一个工具：计算器

```javascript
// 1. 在 ListToolsRequestSchema 处理器中注册工具
this.server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'calculator',
        description: '执行基本的数学运算',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              description: '数学运算类型',
              enum: ['add', 'subtract', 'multiply', 'divide']
            },
            a: {
              type: 'number',
              description: '第一个数字'
            },
            b: {
              type: 'number', 
              description: '第二个数字'
            }
          },
          required: ['operation', 'a', 'b']
        }
      }
    ]
  };
});

// 2. 在 CallToolRequestSchema 处理器中添加执行逻辑
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'calculator':
      return await this.calculateNumbers(args);
    default:
      throw new Error(`未知工具: ${name}`);
  }
});

// 3. 实现具体的工具方法
async calculateNumbers(args) {
  const { operation, a, b } = args;
  
  // 参数验证
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  
  let result;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) throw new Error('不能除以零');
      result = a / b;
      break;
    default:
      throw new Error('不支持的运算类型');
  }

  return {
    content: [
      {
        type: 'text',
        text: `计算结果: ${a} ${operation} ${b} = ${result}`
      }
    ]
  };
}
```

### 4.3 工具开发模式

#### **模式1：简单计算工具**
```javascript
// 适用于：数学计算、数据转换、格式化等
async simpleCalculation(args) {
  const { input } = args;
  const result = someCalculation(input);
  
  return {
    content: [{
      type: 'text',
      text: `结果: ${result}`
    }]
  };
}
```

#### **模式2：文件操作工具**
```javascript
import fs from 'fs/promises';

async readFile(args) {
  const { filePath } = args;
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      content: [{
        type: 'text',
        text: `文件内容:\n${content}`
      }]
    };
  } catch (error) {
    throw new Error(`读取文件失败: ${error.message}`);
  }
}
```

#### **模式3：API调用工具**
```javascript
async callAPI(args) {
  const { url, method = 'GET', data } = args;
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    
    const result = await response.json();
    
    return {
      content: [{
        type: 'text',
        text: `API响应: ${JSON.stringify(result, null, 2)}`
      }]
    };
  } catch (error) {
    throw new Error(`API调用失败: ${error.message}`);
  }
}
```

### 4.4 参数验证最佳实践

#### 使用 Zod 进行强类型验证：

```javascript
import { z } from 'zod';

// 定义参数模式
const calculatorSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
  a: z.number(),
  b: z.number()
});

async calculateNumbers(args) {
  // 验证参数
  const validatedArgs = calculatorSchema.parse(args);
  const { operation, a, b } = validatedArgs;
  
  // ... 执行逻辑
}
```

---

## 5. 高级功能开发

### 5.1 资源处理

资源提供对数据的读取访问，不执行操作。

#### 基础资源实现：

```javascript
import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

setupResourceHandlers() {
  // 列出可用资源
  this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'file://config.json',
          name: '配置文件',
          description: '应用程序配置信息',
          mimeType: 'application/json'
        },
        {
          uri: 'database://users',
          name: '用户数据',
          description: '用户信息数据库',
          mimeType: 'application/json'
        }
      ]
    };
  });

  // 读取资源内容
  this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    if (uri === 'file://config.json') {
      return await this.readConfigFile();
    } else if (uri === 'database://users') {
      return await this.readUserData();
    } else {
      throw new Error(`不支持的资源: ${uri}`);
    }
  });
}

async readConfigFile() {
  const config = await fs.readFile('config.json', 'utf-8');
  return {
    contents: [
      {
        uri: 'file://config.json',
        mimeType: 'application/json',
        text: config
      }
    ]
  };
}
```

### 5.2 提示模板

提示模板帮助AI更好地使用你的工具。

```javascript
import { 
  ListPromptsRequestSchema, 
  GetPromptRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';

setupPromptHandlers() {
  this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'code_review',
          description: '代码审查提示模板',
          arguments: [
            {
              name: 'code',
              description: '要审查的代码',
              required: true
            },
            {
              name: 'language',
              description: '编程语言',
              required: false
            }
          ]
        }
      ]
    };
  });

  this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (name === 'code_review') {
      return await this.getCodeReviewPrompt(args);
    } else {
      throw new Error(`未知提示: ${name}`);
    }
  });
}

async getCodeReviewPrompt(args) {
  const { code, language = 'javascript' } = args;
  
  return {
    description: `审查${language}代码的质量和安全性`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `请审查以下${language}代码，关注代码质量、安全性、性能和最佳实践：

\`\`\`${language}
${code}
\`\`\`

请提供详细的审查意见和改进建议。`
        }
      }
    ]
  };
}
```

### 5.3 错误处理和日志

```javascript
import util from 'util';

class MCPServer {
  constructor() {
    // ... 其他初始化代码
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    // 全局错误处理
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的 Promise 拒绝:', reason);
    });
  }

  // 统一的错误响应格式
  createErrorResponse(message, details = null) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${message}${details ? '\n详情: ' + details : ''}`
        }
      ],
      isError: true
    };
  }

  // 工具执行包装器
  async executeToolSafely(toolName, handler, args) {
    try {
      console.log(`执行工具: ${toolName}，参数:`, util.inspect(args, { depth: 2 }));
      const result = await handler(args);
      console.log(`工具 ${toolName} 执行成功`);
      return result;
    } catch (error) {
      console.error(`工具 ${toolName} 执行失败:`, error);
      return this.createErrorResponse(error.message, error.stack);
    }
  }
}
```

---

## 6. 最佳实践

### 6.1 代码组织

#### 模块化工具管理：

```javascript
// tools/index.js
export { default as calculatorTools } from './calculator.js';
export { default as fileTools } from './file.js';
export { default as apiTools } from './api.js';

// tools/calculator.js
export default {
  definitions: [
    {
      name: 'add',
      description: '两数相加',
      inputSchema: { /* ... */ }
    },
    // ... 更多工具定义
  ],
  
  handlers: {
    async add(args) {
      // 实现逻辑
    }
    // ... 更多处理器
  }
};

// server.js 中使用
import { calculatorTools, fileTools, apiTools } from './tools/index.js';

class MCPServer {
  setupToolHandlers() {
    const allTools = [
      ...calculatorTools.definitions,
      ...fileTools.definitions,
      ...apiTools.definitions
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: allTools
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // 查找对应的处理器
      const handler = 
        calculatorTools.handlers[name] ||
        fileTools.handlers[name] ||
        apiTools.handlers[name];

      if (!handler) {
        throw new Error(`未知工具: ${name}`);
      }

      return await this.executeToolSafely(name, handler, args);
    });
  }
}
```

### 6.2 性能优化

#### 连接池和缓存：

```javascript
class MCPServer {
  constructor() {
    // ... 其他初始化
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  // 带缓存的API调用
  async cachedApiCall(url, options = {}) {
    const cacheKey = `api:${url}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('使用缓存结果');
      return cached.data;
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      // 如果有缓存的数据，在错误时返回
      if (cached) {
        console.warn('API调用失败，使用过期缓存');
        return cached.data;
      }
      throw error;
    }
  }
}
```

### 6.3 安全考虑

#### 输入验证和权限控制：

```javascript
import path from 'path';

class SecurityValidator {
  static validateFilePath(filePath) {
    // 防止路径遍历攻击
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('不安全的文件路径');
    }
    
    // 限制访问目录
    const allowedDirs = ['/tmp', '/app/data'];
    const isAllowed = allowedDirs.some(dir => 
      normalizedPath.startsWith(path.normalize(dir))
    );
    
    if (!isAllowed) {
      throw new Error('无权访问该路径');
    }
    
    return normalizedPath;
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      // 移除潜在的恶意字符
      return input.replace(/[<>\"'&]/g, '');
    }
    return input;
  }
}
```

---

## 7. 部署与配置

### 7.1 Cursor 配置

创建或更新 Cursor 的 MCP 配置：

#### macOS 配置路径：
```bash
~/Library/Application Support/Cursor/User/globalStorage/storage.json
```

#### 配置示例：
```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/your/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 7.2 Claude Desktop 配置

#### macOS 配置路径：
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

#### 配置示例：
```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node", 
      "args": ["/absolute/path/to/your/server.js"]
    }
  }
}
```

### 7.3 生产环境配置

#### 使用 PM2 管理进程：

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 8. 调试与排错

### 8.1 日志系统

```javascript
class Logger {
  static levels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  };

  static currentLevel = this.levels.INFO;

  static log(level, message, ...args) {
    if (this.levels[level] <= this.currentLevel) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${level}:`, message, ...args);
    }
  }

  static error(message, ...args) {
    this.log('ERROR', message, ...args);
  }

  static warn(message, ...args) {
    this.log('WARN', message, ...args);
  }

  static info(message, ...args) {
    this.log('INFO', message, ...args);
  }

  static debug(message, ...args) {
    this.log('DEBUG', message, ...args);
  }
}

// 在工具中使用
async myTool(args) {
  Logger.info('执行工具', { tool: 'myTool', args });
  
  try {
    const result = await someOperation(args);
    Logger.debug('工具执行结果', { result });
    return result;
  } catch (error) {
    Logger.error('工具执行失败', { error: error.message, stack: error.stack });
    throw error;
  }
}
```

### 8.2 常见问题诊断

#### 问题1：工具无法调用
```bash
# 检查服务器状态
echo '{"method": "tools/list"}' | node server.js

# 检查工具定义格式
node -e "
const server = new MCPDemoServer();
console.log(JSON.stringify(server.tools, null, 2));
"
```

#### 问题2：参数验证失败
```javascript
// 添加详细的参数日志
async validateAndExecute(toolName, args, handler) {
  Logger.debug(`工具 ${toolName} 收到参数:`, JSON.stringify(args, null, 2));
  
  try {
    return await handler(args);
  } catch (error) {
    Logger.error(`工具 ${toolName} 参数验证失败:`, {
      args,
      error: error.message
    });
    throw error;
  }
}
```

#### 问题3：连接问题诊断
```javascript
// 添加连接监控
async run() {
  const transport = new StdioServerTransport();
  
  transport.onclose = () => {
    Logger.info('传输连接关闭');
  };
  
  transport.onerror = (error) => {
    Logger.error('传输连接错误:', error);
  };
  
  await this.server.connect(transport);
  Logger.info('MCP服务器已启动，等待连接...');
}
```

---

## 9. 实战项目示例

### 9.1 文件管理工具集

让我们创建一个实用的文件管理工具集：

```javascript
// tools/filesystem.js
import fs from 'fs/promises';
import path from 'path';

export default {
  definitions: [
    {
      name: 'list_directory',
      description: '列出目录内容',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '目录路径' },
          showHidden: { type: 'boolean', description: '显示隐藏文件', default: false }
        },
        required: ['path']
      }
    },
    {
      name: 'read_file',
      description: '读取文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '文件路径' },
          encoding: { type: 'string', description: '编码格式', default: 'utf-8' }
        },
        required: ['filePath']
      }
    },
    {
      name: 'write_file',
      description: '写入文件内容',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' },
          encoding: { type: 'string', description: '编码格式', default: 'utf-8' }
        },
        required: ['filePath', 'content']
      }
    }
  ],

  handlers: {
    async list_directory(args) {
      const { path: dirPath, showHidden = false } = args;
      
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const filtered = showHidden ? items : items.filter(item => !item.name.startsWith('.'));
        
        const result = await Promise.all(
          filtered.map(async (item) => {
            const itemPath = path.join(dirPath, item.name);
            const stats = await fs.stat(itemPath);
            
            return {
              name: item.name,
              type: item.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString()
            };
          })
        );

        return {
          content: [{
            type: 'text',
            text: `目录 ${dirPath} 内容:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        throw new Error(`无法列出目录: ${error.message}`);
      }
    },

    async read_file(args) {
      const { filePath, encoding = 'utf-8' } = args;
      
      try {
        const content = await fs.readFile(filePath, encoding);
        return {
          content: [{
            type: 'text',
            text: `文件: ${filePath}\n内容:\n${content}`
          }]
        };
      } catch (error) {
        throw new Error(`无法读取文件: ${error.message}`);
      }
    },

    async write_file(args) {
      const { filePath, content, encoding = 'utf-8' } = args;
      
      try {
        await fs.writeFile(filePath, content, encoding);
        const stats = await fs.stat(filePath);
        
        return {
          content: [{
            type: 'text',
            text: `文件 ${filePath} 写入成功\n大小: ${stats.size} 字节\n修改时间: ${stats.mtime.toISOString()}`
          }]
        };
      } catch (error) {
        throw new Error(`无法写入文件: ${error.message}`);
      }
    }
  }
};
```

### 9.2 网络请求工具集

```javascript
// tools/network.js
export default {
  definitions: [
    {
      name: 'http_request',
      description: '发送HTTP请求',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '请求URL' },
          method: { 
            type: 'string', 
            description: '请求方法',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            default: 'GET'
          },
          headers: { type: 'object', description: '请求头' },
          body: { type: 'string', description: '请求体' },
          timeout: { type: 'number', description: '超时时间(毫秒)', default: 5000 }
        },
        required: ['url']
      }
    },
    {
      name: 'download_file',
      description: '下载文件',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '文件URL' },
          savePath: { type: 'string', description: '保存路径' }
        },
        required: ['url', 'savePath']
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
        timeout = 5000 
      } = args;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'User-Agent': 'MCP-Server/1.0',
            ...headers
          },
          body: method !== 'GET' ? body : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type') || '';
        let responseBody;

        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }

        return {
          content: [{
            type: 'text',
            text: `HTTP ${method} ${url}\n状态: ${response.status} ${response.statusText}\n响应:\n${
              typeof responseBody === 'object' 
                ? JSON.stringify(responseBody, null, 2) 
                : responseBody
            }`
          }]
        };
      } catch (error) {
        throw new Error(`HTTP请求失败: ${error.message}`);
      }
    },

    async download_file(args) {
      const { url, savePath } = args;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        await fs.writeFile(savePath, new Uint8Array(buffer));

        const stats = await fs.stat(savePath);
        
        return {
          content: [{
            type: 'text',
            text: `文件下载成功\nURL: ${url}\n保存路径: ${savePath}\n文件大小: ${stats.size} 字节`
          }]
        };
      } catch (error) {
        throw new Error(`下载失败: ${error.message}`);
      }
    }
  }
};
```

---

## 10. 进阶扩展

### 10.1 插件系统

创建可动态加载的插件系统：

```javascript
// plugins/plugin-manager.js
import fs from 'fs/promises';
import path from 'path';

export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.pluginsDir = './plugins';
  }

  async loadAllPlugins() {
    try {
      const pluginFiles = await fs.readdir(this.pluginsDir);
      
      for (const file of pluginFiles) {
        if (file.endsWith('.plugin.js')) {
          await this.loadPlugin(file);
        }
      }
    } catch (error) {
      console.warn('加载插件失败:', error.message);
    }
  }

  async loadPlugin(filename) {
    try {
      const pluginPath = path.join(this.pluginsDir, filename);
      const plugin = await import(pluginPath);
      
      const pluginName = path.basename(filename, '.plugin.js');
      this.plugins.set(pluginName, plugin.default);
      
      console.log(`插件 ${pluginName} 加载成功`);
    } catch (error) {
      console.error(`加载插件 ${filename} 失败:`, error);
    }
  }

  getToolDefinitions() {
    const tools = [];
    for (const [name, plugin] of this.plugins) {
      if (plugin.tools) {
        tools.push(...plugin.tools.map(tool => ({
          ...tool,
          name: `${name}.${tool.name}`
        })));
      }
    }
    return tools;
  }

  async executePluginTool(toolName, args) {
    const [pluginName, methodName] = toolName.split('.');
    const plugin = this.plugins.get(pluginName);
    
    if (!plugin || !plugin.handlers || !plugin.handlers[methodName]) {
      throw new Error(`插件工具不存在: ${toolName}`);
    }

    return await plugin.handlers[methodName](args);
  }
}
```

### 10.2 配置热重载

```javascript
// config/config-manager.js
import fs from 'fs';
import path from 'path';

export class ConfigManager {
  constructor(configPath = './config.json') {
    this.configPath = configPath;
    this.config = {};
    this.watchers = [];
    
    this.loadConfig();
    this.watchConfig();
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      console.log('配置加载成功');
    } catch (error) {
      console.error('配置加载失败:', error.message);
      this.config = this.getDefaultConfig();
    }
  }

  watchConfig() {
    fs.watchFile(this.configPath, (curr, prev) => {
      console.log('检测到配置文件变化，重新加载...');
      this.loadConfig();
      this.notifyWatchers();
    });
  }

  addWatcher(callback) {
    this.watchers.push(callback);
  }

  notifyWatchers() {
    this.watchers.forEach(callback => callback(this.config));
  }

  get(key, defaultValue = null) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config) ?? defaultValue;
  }

  getDefaultConfig() {
    return {
      server: {
        name: 'mcp-server',
        version: '1.0.0'
      },
      tools: {
        enabled: true,
        timeout: 30000
      },
      logging: {
        level: 'info'
      }
    };
  }
}
```

### 10.3 数据库集成

```javascript
// tools/database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  async connect(dbPath = './data.db') {
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 创建默认表
    await this.createTables();
  }

  async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async query(sql, params = []) {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return await this.db.all(sql, params);
    } else {
      const result = await this.db.run(sql, params);
      return { changes: result.changes, lastID: result.lastID };
    }
  }
}

export default {
  definitions: [
    {
      name: 'db_query',
      description: '执行数据库查询',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL查询语句' },
          params: { type: 'array', description: '查询参数', default: [] }
        },
        required: ['sql']
      }
    }
  ],

  handlers: {
    async db_query(args) {
      const { sql, params = [] } = args;
      
      try {
        const dbManager = new DatabaseManager();
        await dbManager.connect();
        
        const result = await dbManager.query(sql, params);
        
        return {
          content: [{
            type: 'text',
            text: `查询执行成功:\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        throw new Error(`数据库查询失败: ${error.message}`);
      }
    }
  }
};
```

---

## 🎯 总结与下一步

### 你已经学会了：

1. ✅ MCP 协议的基本概念和架构
2. ✅ 开发环境的设置和项目结构
3. ✅ 工具、资源、提示的开发方法
4. ✅ 最佳实践和安全考虑
5. ✅ 部署配置和调试技巧
6. ✅ 实战项目和进阶扩展

### 建议的学习路径：

1. **新手阶段**：
   - 运行现有项目，理解基本工具
   - 修改现有工具，添加新功能
   - 创建简单的计算和文本处理工具

2. **进阶阶段**：
   - 添加文件操作和网络请求工具
   - 实现资源和提示功能
   - 集成数据库或外部API

3. **高级阶段**：
   - 开发插件系统
   - 实现配置热重载
   - 创建复杂的业务逻辑工具

### 有用的资源：

- [MCP SDK 官方文档](https://github.com/modelcontextprotocol/sdk)
- [TypeScript 类型定义](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [社区示例项目](https://github.com/modelcontextprotocol)

### 接下来可以尝试：

- 为你的特定需求定制工具
- 与AI助手测试和优化工具
- 贡献开源MCP项目
- 探索更多集成可能性

---

**🚀 开始你的 MCP 开发之旅吧！**

有问题随时查阅这个教程，或者查看项目中的示例代码。祝你开发愉快！
