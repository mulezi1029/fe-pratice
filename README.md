# Duyi 项目 Submodules

本项目包含了多个 Duyi 子项目，它们作为 Git submodule 进行管理。

## 使用说明

### 克隆项目及所有 submodule

```bash
git clone --recursive <主仓库URL>
```

### 更新所有 submodule 到最新版本

```bash
git submodule update --remote
```

### 初始化和更新 submodule（如果使用普通 clone 后）

```bash
git submodule init
git submodule update
```

## Submodule 列表

以下是 duyi 目录下的所有 submodule：

- duyi/[子项目名称1] - [描述]
- duyi/[子项目名称2] - [描述]
- ...

## 管理 Submodule

### 添加新的 submodule

```bash
git submodule add <仓库URL> duyi/<子项目名称>
```

### 删除 submodule

1. 删除 .gitmodules 中相关部分
2. 执行 `git rm --cached duyi/<子项目名称>`
3. 删除 .git/config 中相关部分
4. 提交变更 `git commit -m "删除 submodule"`
5. 删除未跟踪的子模块目录 `rm -rf duyi/<子项目名称>`

## 注意事项

转换为 submodule 后，每个子项目都会有自己独立的 Git 版本控制，需要在各自的目录中进行 commit 和 push 操作。