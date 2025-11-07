#!/usr/bin/env node

/**
 * 自动生成工具文档脚本
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllToolDefinitions, getToolsByNamespace } from '../tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'docs');
  }

  async generate() {
    console.log('📚 开始生成工具文档...');

    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });

    // 生成主文档
    await this.generateMainDocumentation();
    
    // 生成 API 参考
    await this.generateAPIReference();
    
    // 生成快速开始指南
    await this.generateQuickStart();
    
    // 生成示例集合
    await this.generateExamples();

    console.log('✅ 文档生成完成！');
    console.log(`📂 文档位置: ${this.outputDir}`);
  }

  async generateMainDocumentation() {
    const toolsByNamespace = getToolsByNamespace();
    let doc = `# Enhanced MCP Server 工具文档

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## 📋 概览

本 MCP 服务器提供了 **${Object.keys(toolsByNamespace).length}** 个工具命名空间，总共 **${Object.values(toolsByNamespace).reduce((sum, ns) => sum + ns.count, 0)}** 个工具。

## 🔧 工具命名空间

`;

    Object.entries(toolsByNamespace).forEach(([namespace, { definitions, count }]) => {
      doc += `### ${namespace.toUpperCase()} 工具 (${count} 个)\n\n`;
      doc += `${this.getNamespaceDescription(namespace)}\n\n`;
      
      doc += `**可用工具:**\n`;
      definitions.forEach(tool => {
        doc += `- [\`${namespace}.${tool.name}\`](#${namespace}${tool.name}) - ${tool.description}\n`;
      });
      doc += '\n';
    });

    doc += `## 📖 详细说明

`;

    Object.entries(toolsByNamespace).forEach(([namespace, { definitions }]) => {
      definitions.forEach(tool => {
        doc += this.generateToolDocumentation(namespace, tool);
      });
    });

    doc += this.generateUsageExamples();

    await fs.writeFile(path.join(this.outputDir, 'README.md'), doc);
    console.log('✅ 生成主文档');
  }

  generateToolDocumentation(namespace, tool) {
    let doc = `### ${namespace}.${tool.name}\n\n`;
    doc += `${tool.description}\n\n`;
    
    doc += `**参数 Schema:**\n\n`;
    doc += `\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n`;
    
    if (tool.inputSchema.properties) {
      doc += `**参数说明:**\n\n`;
      doc += `| 参数名 | 类型 | 必需 | 说明 |\n`;
      doc += `|--------|------|------|------|\n`;
      
      Object.entries(tool.inputSchema.properties).forEach(([prop, schema]) => {
        const required = tool.inputSchema.required?.includes(prop) ? '✅' : '❌';
        const type = schema.type || 'unknown';
        const description = schema.description || '无描述';
        doc += `| \`${prop}\` | ${type} | ${required} | ${description} |\n`;
      });
      doc += '\n';
    }

    // 添加示例调用
    const example = this.generateExampleCall(namespace, tool);
    if (example) {
      doc += `**示例调用:**\n\n`;
      doc += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
    }
    
    doc += `---\n\n`;
    return doc;
  }

  generateExampleCall(namespace, tool) {
    const examples = {
      'filesystem.read_file': {
        filePath: '/path/to/file.txt',
        encoding: 'utf-8'
      },
      'filesystem.write_file': {
        filePath: '/path/to/output.txt',
        content: 'Hello, World!',
        createDirs: true
      },
      'filesystem.list_directory': {
        path: '/path/to/directory',
        showHidden: false,
        recursive: true
      },
      'network.http_request': {
        url: 'https://api.github.com/users/octocat',
        method: 'GET'
      },
      'network.download_file': {
        url: 'https://example.com/file.pdf',
        savePath: './downloads/file.pdf'
      },
      'add_numbers': {
        a: 10,
        b: 20
      },
      'text_analysis': {
        text: '这是一个示例文本，用于分析。'
      }
    };

    const fullName = `${namespace}.${tool.name}`;
    return examples[fullName] || this.generateGenericExample(tool);
  }

  generateGenericExample(tool) {
    if (!tool.inputSchema.properties) return null;

    const example = {};
    Object.entries(tool.inputSchema.properties).forEach(([prop, schema]) => {
      switch (schema.type) {
        case 'string':
          example[prop] = schema.example || `示例${prop}`;
          break;
        case 'number':
          example[prop] = schema.example || 42;
          break;
        case 'boolean':
          example[prop] = schema.example || true;
          break;
        case 'object':
          example[prop] = schema.example || {};
          break;
        case 'array':
          example[prop] = schema.example || [];
          break;
      }
    });

    return Object.keys(example).length > 0 ? example : null;
  }

  getNamespaceDescription(namespace) {
    const descriptions = {
      filesystem: '提供文件和目录操作功能，包括读写文件、目录遍历、文件复制等。',
      network: '提供网络操作功能，包括HTTP请求、文件下载、网络连通性测试等。',
      builtin: '内置基础工具，提供数学计算、文本分析、时间获取等基础功能。'
    };
    
    return descriptions[namespace] || '提供各种实用工具功能。';
  }

  generateUsageExamples() {
    return `## 💡 使用示例

### 文件操作示例

\`\`\`json
// 写入文件
{
  "tool": "filesystem.write_file",
  "arguments": {
    "filePath": "./data/example.txt",
    "content": "Hello, MCP Server!",
    "createDirs": true
  }
}

// 读取文件
{
  "tool": "filesystem.read_file", 
  "arguments": {
    "filePath": "./data/example.txt"
  }
}

// 列出目录
{
  "tool": "filesystem.list_directory",
  "arguments": {
    "path": "./data",
    "showHidden": true,
    "recursive": true
  }
}
\`\`\`

### 网络操作示例

\`\`\`json
// HTTP GET 请求
{
  "tool": "network.http_request",
  "arguments": {
    "url": "https://api.github.com/users/octocat",
    "method": "GET",
    "returnHeaders": true
  }
}

// 下载文件
{
  "tool": "network.download_file",
  "arguments": {
    "url": "https://example.com/data.json",
    "savePath": "./downloads/data.json",
    "overwrite": true
  }
}

// 检查网站状态
{
  "tool": "network.check_website",
  "arguments": {
    "url": "https://www.example.com",
    "checkSSL": true
  }
}
\`\`\`

### 文本处理示例

\`\`\`json
// 文本分析
{
  "tool": "text_analysis",
  "arguments": {
    "text": "这是一个测试文本。\\n包含多行内容。"
  }
}

// 数学计算
{
  "tool": "add_numbers",
  "arguments": {
    "a": 15,
    "b": 25
  }
}
\`\`\`

## 🚀 快速开始

1. **启动服务器**
   \`\`\`bash
   npm run enhanced
   \`\`\`

2. **配置 AI 客户端**
   在 Cursor 或 Claude Desktop 中配置 MCP 服务器连接。

3. **开始使用工具**
   在 AI 对话中直接调用工具功能。

## 📞 支持与反馈

如有问题或建议，请查看项目文档或提交 Issue。
`;
  }

  async generateAPIReference() {
    const tools = getAllToolDefinitions();
    
    let doc = `# API 参考

> 自动生成于 ${new Date().toLocaleString('zh-CN')}

## 工具列表

`;

    tools.forEach(tool => {
      doc += `### ${tool.name}\n\n`;
      doc += `**描述:** ${tool.description}\n\n`;
      doc += `**Schema:**\n\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n`;
    });

    await fs.writeFile(path.join(this.outputDir, 'api-reference.md'), doc);
    console.log('✅ 生成 API 参考');
  }

  async generateQuickStart() {
    const doc = `# 快速开始指南

## 🚀 安装和设置

### 1. 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 2. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 3. 启动服务器

\`\`\`bash
# 基础版本
npm start

# 增强版本（推荐）
npm run enhanced

# 开发模式
npm run dev:enhanced
\`\`\`

### 4. 运行测试

\`\`\`bash
# 基础测试
npm test

# 增强版测试
npm run test:enhanced

# 性能测试
npm run test:enhanced -- --performance
\`\`\`

## 🔧 配置 AI 客户端

### Cursor 配置

1. 打开 Cursor 设置
2. 找到 MCP 服务器配置
3. 添加配置：

\`\`\`json
{
  "mcpServers": {
    "enhanced-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/enhanced-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
\`\`\`

### Claude Desktop 配置

编辑配置文件 \`~/.config/claude-desktop/claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "enhanced-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/enhanced-server.js"]
    }
  }
}
\`\`\`

## 📝 第一个工具调用

配置完成后，你可以在 AI 对话中直接使用工具：

**示例 1: 创建文件**
\`\`\`
请帮我创建一个名为 hello.txt 的文件，内容是 "Hello, MCP Server!"
\`\`\`

**示例 2: 网络请求**
\`\`\`
请帮我获取 GitHub API 中 octocat 用户的信息
\`\`\`

**示例 3: 文本分析**
\`\`\`
请分析这段文本："人工智能正在改变我们的世界。Machine Learning 和 Deep Learning 技术快速发展。"
\`\`\`

## 🛠️ 常见问题

### Q: 工具调用失败怎么办？
A: 检查服务器日志，确认参数格式正确，验证文件路径和网络连接。

### Q: 如何添加新工具？
A: 参考 \`tools/\` 目录中的示例，创建新的工具模块。

### Q: 性能如何优化？
A: 使用缓存、连接池、异步处理等技术，参考高级配置文档。

## 📚 下一步

- 阅读完整的工具文档
- 查看高级配置选项
- 学习自定义工具开发
`;

    await fs.writeFile(path.join(this.outputDir, 'quick-start.md'), doc);
    console.log('✅ 生成快速开始指南');
  }

  async generateExamples() {
    const examples = {
      "文件管理": [
        {
          description: "批量处理文本文件",
          code: `
// 1. 列出所有 .txt 文件
// 2. 读取每个文件
// 3. 分析文本内容
// 4. 生成统计报告
`
        }
      ],
      "网络爬虫": [
        {
          description: "网站健康检查",
          code: `
// 1. 检查网站状态
// 2. 测试响应时间
// 3. 验证 SSL 证书
// 4. 生成监控报告
`
        }
      ],
      "数据处理": [
        {
          description: "JSON 数据处理",
          code: `
// 1. 下载 JSON 数据
// 2. 解析和验证
// 3. 数据清洗
// 4. 保存处理结果
`
        }
      ]
    };

    let doc = `# 使用示例

> 实际使用场景和代码示例

`;

    Object.entries(examples).forEach(([category, examples]) => {
      doc += `## ${category}\n\n`;
      examples.forEach(example => {
        doc += `### ${example.description}\n\n`;
        doc += `\`\`\`javascript\n${example.code}\n\`\`\`\n\n`;
      });
    });

    await fs.writeFile(path.join(this.outputDir, 'examples.md'), doc);
    console.log('✅ 生成示例文档');
  }
}

// 运行文档生成
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new DocumentationGenerator();
  generator.generate().catch(error => {
    console.error('❌ 文档生成失败:', error);
    process.exit(1);
  });
}
