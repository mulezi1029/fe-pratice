#!/bin/bash

# 设置要搜索的目录
SEARCH_DIR="duyi"

# 确保目录存在
if [ ! -d "$SEARCH_DIR" ]; then
  echo "错误: $SEARCH_DIR 目录不存在"
  exit 1
fi

echo "开始搜索 $SEARCH_DIR 目录下的所有git仓库..."
echo "----------------------------------------"

# 找出所有包含.git目录的文件夹
find "$SEARCH_DIR" -type d -name ".git" | while read -r gitdir; do
  # 获取实际的git仓库目录(去掉.git部分)
  repo_dir="${gitdir%.git}"
  
  echo "处理git仓库: $repo_dir"
  
  # 进入仓库目录
  cd "$repo_dir" || continue
  
  # 检查是否存在远程仓库关联
  if git remote | grep -q "origin"; then
    echo "  - 发现远程仓库关联，正在删除..."
    git remote remove origin
    echo "  - 成功: 已删除远程仓库关联"
  else
    echo "  - 没有找到远程仓库关联"
  fi
  
  # 返回原目录
  cd - > /dev/null
  
  echo "----------------------------------------"
done

echo "操作完成！"
