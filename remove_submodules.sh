#!/bin/bash

# 进入项目的根目录
cd "$(dirname "$0")" || exit

# 确保在项目根目录（包含 .git 文件夹的目录）
if [ ! -d .git ]; then
  echo "错误：请在 git 项目根目录运行此脚本"
  exit 1
fi

echo "开始处理 duyi 文件夹下的子模块..."

# 查找 duyi 文件夹下的所有子模块
submodules=$(git config -f .gitmodules --get-regexp path | grep "duyi/" | sed 's/^submodule\.\([^.]*\)\.path .*/\1/')

if [ -z "$submodules" ]; then
  echo "未找到 duyi 文件夹下的子模块"
  exit 0
fi

# 遍历所有子模块并移除
for submodule in $submodules; do
  path=$(git config -f .gitmodules --get "submodule.$submodule.path")
  
  echo "正在移除子模块: $path"
  
  # 1. 从 .gitmodules 文件中删除子模块条目
  git config -f .gitmodules --remove-section "submodule.$submodule" 2>/dev/null
  
  # 2. 从 .git/config 中删除子模块部分
  git config --remove-section "submodule.$submodule" 2>/dev/null
  
  # 3. 从 git index 中移除子模块
  git rm --cached "$path" -rf 2>/dev/null
  
  # 4. 从 .git/modules 中删除子模块的 git 目录
  rm -rf ".git/modules/$path"
  
  # 5. 将子模块转换为普通文件夹（如果需要保留文件）
  if [ -d "$path/.git" ]; then
    rm -rf "$path/.git"
    echo "已将 $path 转换为普通文件夹（保留了内容）"
  elif [ -f "$path/.git" ]; then
    # 处理 .git 文件的情况（Git 子模块中常见）
    rm -f "$path/.git"
    echo "已将 $path 转换为普通文件夹（保留了内容）"
  fi
  
  echo "子模块 $path 已成功移除"
done

# 如果 duyi 本身是一个仓库但不是子模块，也将其转换为普通文件夹
if [ -d "duyi/.git" ]; then
  echo "正在将 duyi 文件夹从 git 仓库转换为普通文件夹..."
  rm -rf "duyi/.git"
  echo "已将 duyi 文件夹转换为普通文件夹（保留了内容）"
elif [ -f "duyi/.git" ]; then
  echo "正在将 duyi 文件夹从 git 子模块转换为普通文件夹..."
  rm -f "duyi/.git"
  echo "已将 duyi 文件夹转换为普通文件夹（保留了内容）"
fi

# 提交更改（可选）
echo "所有 duyi 文件夹下的子模块已移除"
echo "您可能需要执行 'git add .gitmodules' 并提交更改以完成操作"
