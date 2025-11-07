#!/bin/bash

# MCP服务器启动脚本

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18或更高版本"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d 'v' -f 2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION'))" 2>/dev/null; then
    echo "❌ Node.js版本过低，当前版本: v$NODE_VERSION，需要: v$REQUIRED_VERSION或更高版本"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在MCP项目根目录下运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    echo "✅ 依赖已存在"
fi

# 运行测试
echo ""
echo "🧪 运行功能测试..."
npm test
if [ $? -ne 0 ]; then
    echo "⚠️ 测试未完全通过，但服务器仍可启动"
fi

echo ""
echo "🚀 启动MCP服务器..."
echo "📝 使用 Ctrl+C 停止服务器"
echo ""

# 启动服务器
npm start
