#!/bin/bash

# 设置要搜索的目录为当前目录
SEARCH_DIR="."

# 获取脚本所在的绝对路径（根目录）
ROOT_DIR="$(pwd)"

echo "开始搜索 $ROOT_DIR 目录下的所有子目录git仓库..."
echo "----------------------------------------"

# 找出所有包含.git目录的文件夹 (排除根目录自己的 .git)
find "$SEARCH_DIR" -type d -name ".git" | while read -r gitdir; do
  # 跳过根目录的 .git
  if [ "$gitdir" = "./.git" ]; then
    continue
  fi
  
  # 获取实际的git仓库目录(去掉.git部分)
  repo_dir="${gitdir%/.git}"
  
  echo "处理子目录git仓库: $repo_dir"
  
  # 检查是否是子模块
  if git config -f .gitmodules --get-regexp path | grep -q "$repo_dir"; then
    echo "  - 检测到子模块，正在移除..."
    submodule_name=$(git config -f .gitmodules --get-regexp path | grep "$repo_dir" | sed 's/^submodule\.\([^.]*\)\.path .*/\1/')
    
    # 从 .gitmodules 文件中删除子模块条目
    git config -f .gitmodules --remove-section "submodule.$submodule_name" 2>/dev/null
    
    # 从 .git/config 中删除子模块部分
    git config --remove-section "submodule.$submodule_name" 2>/dev/null
    
    # 从 git index 中移除子模块
    git rm --cached "$repo_dir" -rf 2>/dev/null
    
    # 从 .git/modules 中删除子模块的 git 目录
    rm -rf ".git/modules/$repo_dir"
  fi
  
  # 备份有价值的内容
  echo "  - 备份提交历史..."
  mkdir -p "$ROOT_DIR/git_backups"
  (cd "$repo_dir" && git log --oneline > "$ROOT_DIR/git_backups/$(basename "$repo_dir")_git_history.txt") 2>/dev/null
  
  # 移除 .git 目录，转换为普通目录
  echo "  - 移除 .git 目录..."
  rm -rf "$gitdir"
  
  echo "  - 成功将 $repo_dir 转换为普通目录"
  echo "----------------------------------------"
done

# 将所有文件添加到根目录的 git 仓库
echo "将所有文件添加到根目录的 git 仓库..."
git add .

echo "操作完成！"
echo "你可以使用以下命令提交更改："
echo "git commit -m \"将所有子目录仓库合并为单一仓库管理\""