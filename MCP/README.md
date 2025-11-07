# Enhanced MCP Server

这是一个功能丰富的 MCP (Model Context Protocol) 服务器，为 AI 助手提供强大的工具集成能力。

## ✨ 功能特性

### 🔧 核心工具套件

#### 📁 文件系统工具
- **读写文件** - 支持多种编码格式，安全路径验证
- **目录操作** - 列表、递归遍历、创建目录
- **文件管理** - 复制、移动、删除、权限管理
- **文件统计** - 详细的文件信息和元数据

#### 🌐 网络工具
- **HTTP 请求** - 支持所有 HTTP 方法，自定义头部
- **文件下载** - 断点续传，进度显示
- **网络诊断** - ping 测试，网站状态检查
- **IP 查询** - 地理位置，ISP 信息

#### 🛠️ 系统工具
- **数学计算** - 基础算术运算
- **文本分析** - 字符统计，频率分析，内容特征检测
- **UUID 生成** - 标准 UUID v4 生成
- **时间服务** - 多格式时间输出
- **系统信息** - 性能监控，运行统计

#### 📊 管理功能
- **工具统计** - 使用情况分析
- **性能监控** - 实时性能数据
- **资源管理** - 统一资源访问接口

## 📋 系统要求

- **Node.js** >= 18.0.0
- **npm** 或 **yarn**
- **操作系统**: Windows, macOS, Linux

## ⚡ 快速开始

### 1. 安装依赖
```bash
cd MCP
npm install
```

### 2. 启动服务器
```bash
# 基础版本
npm start

# 增强版本（推荐）
npm run enhanced

# 开发模式
npm run dev:enhanced
```

### 3. 运行测试
```bash
# 完整测试套件
npm run test:enhanced

# 包含性能测试
npm run test:enhanced -- --performance
```

## 🔗 AI 客户端配置

### Cursor 配置
将配置添加到 Cursor 的 MCP 设置中：
```json
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
```

### Claude Desktop 配置
编辑 `~/.config/claude-desktop/claude_desktop_config.json`：
```json
{
  "mcpServers": {
    "enhanced-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/enhanced-server.js"]
    }
  }
}
```

> 💡 使用项目中的 `config/enhanced-mcp-config.json` 作为模板

## API使用示例

### 数字相加
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "add_numbers",
    "arguments": {
      "a": 10,
      "b": 20
    }
  }
}
```

### 文本分析
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "text_analysis",
    "arguments": {
      "text": "Hello World\\nThis is a test."
    }
  }
}
```

### 生成UUID
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "generate_uuid",
    "arguments": {}
  }
}
```

### 获取当前时间
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "current_time",
    "arguments": {
      "format": "locale"
    }
  }
}
```

## 项目结构

```
MCP/
├── package.json          # 项目依赖和脚本配置
├── server.js             # 主服务器文件
├── README.md             # 说明文档
└── test.js               # 测试文件
```

## 扩展开发

### 添加新工具

1. 在 `ListToolsRequestSchema` 处理器中添加工具描述
2. 在 `CallToolRequestSchema` 处理器中添加工具调用逻辑
3. 实现具体的工具方法

### 添加资源支持

可以在 `setupResourceHandlers()` 方法中添加资源处理逻辑，支持文件读取、数据库查询等功能。

## 故障排除

### 常见问题

1. **端口占用**
   - 检查是否有其他进程占用相同端口
   - 修改配置中的端口设置

2. **依赖安装失败**
   - 确保Node.js版本 >= 18.0.0
   - 尝试清除npm缓存：`npm cache clean --force`

3. **工具调用失败**
   - 检查参数格式是否正确
   - 查看服务器日志获取详细错误信息

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。
