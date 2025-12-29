# 🚀 快速部署到 GitHub Pages

## 一键复制命令（按顺序执行）

### 1️⃣ 创建 GitHub 仓库
访问：https://github.com/new
- 仓库名：`url-parse-tool`
- 类型：Public
- 不勾选任何初始化选项

### 2️⃣ 在终端执行以下命令

```bash
# 进入项目目录
cd "/Users/cy/Desktop/个人学习/html:css布局案例、动效交互练习"

# 关联远程仓库（⚠️ 替换成你的仓库地址）
git remote add origin https://github.com/mulezi1029/url-parse-tool.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Add URL parse tool"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3️⃣ 启用 GitHub Pages
1. 进入仓库：https://github.com/mulezi1029/url-parse-tool
2. Settings → Pages
3. Source: `Deploy from a branch`
4. Branch: `main` / `/ (root)`
5. 点击 Save

### 4️⃣ 访问你的网站
等待 1-3 分钟后访问：
```
https://mulezi1029.github.io/url-parse-tool/
```

---

## 🔄 后续更新命令

```bash
cd "/Users/cy/Desktop/个人学习/html:css布局案例、动效交互练习"
git add .
git commit -m "Update: 描述你的更改"
git push
```

或者使用快捷脚本：
```bash
./deploy.sh
```

---

## ✅ 完成！

你的 URL 解析工具现在已经在线上了！

分享链接：`https://mulezi1029.github.io/url-parse-tool/`

