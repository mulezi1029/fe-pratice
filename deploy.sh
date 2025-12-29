#!/bin/bash

echo "🚀 开始部署到 GitHub Pages..."

# 检查是否已初始化 Git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

# 添加所有文件
echo "📝 添加文件..."
git add .

# 提交
echo "💾 提交更改..."
git commit -m "Deploy: Update URL parse tool - $(date '+%Y-%m-%d %H:%M:%S')"

# 检查是否已添加远程仓库
if ! git remote | grep -q "origin"; then
    echo "⚠️  请先设置远程仓库地址："
    echo "   git remote add origin https://github.com/mulezi1029/你的仓库名.git"
    exit 1
fi

# 推送到 GitHub
echo "🌐 推送到 GitHub..."
git push -u origin main

echo "✅ 部署完成！"
echo "📱 请访问 GitHub 仓库设置启用 Pages 功能"
echo "🔗 访问地址：https://mulezi1029.github.io/你的仓库名/"
