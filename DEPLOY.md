# GitHub Pages 部署指南

## 📋 部署步骤

### 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `url-parse-tool` （或其他名称）
   - **Description**: `一个功能强大的URL和小程序路径解析处理工具`
   - **Public**: 选择公开
   - ⚠️ **不要**勾选 "Add a README file"
   - ⚠️ **不要**勾选 "Add .gitignore"
3. 点击 "Create repository"

### 第二步：推送代码到 GitHub

在终端中执行以下命令：

```bash
# 1. 进入项目目录
cd "/Users/cy/Desktop/个人学习/html:css布局案例、动效交互练习"

# 2. 添加远程仓库（替换成你刚创建的仓库地址）
git remote add origin https://github.com/mulezi1029/url-parse-tool.git

# 3. 添加文件
git add .

# 4. 提交
git commit -m "Initial commit: Add URL parse tool"

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

### 第三步：启用 GitHub Pages

1. 进入你的 GitHub 仓库页面
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 在 "Build and deployment" 部分：
   - **Source**: 选择 `Deploy from a branch`
   - **Branch**: 选择 `main` 分支，文件夹选择 `/ (root)`
5. 点击 **Save**

### 第四步：等待部署完成

- GitHub Pages 会自动构建和部署
- 通常需要 1-3 分钟
- 部署完成后，页面顶部会显示访问地址

### 第五步：访问你的网站

访问地址格式：
```
https://mulezi1029.github.io/url-parse-tool/
```

或者直接访问工具页面：
```
https://mulezi1029.github.io/url-parse-tool/tools/url-parse.html
```

---

## 🔄 后续更新

当你修改代码后，使用以下命令更新：

```bash
# 方法1：使用部署脚本（推荐）
./deploy.sh

# 方法2：手动执行
git add .
git commit -m "Update: 描述你的更改"
git push
```

GitHub Pages 会自动重新部署，通常 1-2 分钟后生效。

---

## 🛠️ 自定义域名（可选）

如果你有自己的域名，可以：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容填写你的域名，如：`tools.yourdomain.com`
3. 在域名 DNS 设置中添加 CNAME 记录指向：`mulezi1029.github.io`

---

## 📝 常见问题

### Q: 推送时提示权限错误？
A: 需要配置 GitHub 认证：
```bash
# 使用 GitHub CLI（推荐）
gh auth login

# 或使用 Personal Access Token
# 在 GitHub Settings → Developer settings → Personal access tokens 创建 token
# 推送时使用 token 作为密码
```

### Q: 页面显示 404？
A: 
- 检查 GitHub Pages 是否已启用
- 确认访问地址是否正确
- 等待几分钟让部署完成

### Q: 页面样式丢失？
A: 
- 检查 HTML 中的资源引用路径
- 确保使用 CDN 链接（当前已使用）

### Q: 如何查看部署状态？
A: 
- 进入仓库的 "Actions" 标签页
- 查看 "pages build and deployment" 工作流

---

## 🎯 优化建议

### 1. 添加 SEO 优化
在 `tools/url-parse.html` 的 `<head>` 中添加：
```html
<meta name="description" content="功能强大的URL和小程序路径解析处理工具，支持参数编辑、编码解码等功能">
<meta name="keywords" content="URL解析,参数处理,编码解码,小程序路径">
```

### 2. 添加 Google Analytics（可选）
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 3. 添加 Open Graph 标签（社交分享优化）
```html
<meta property="og:title" content="URL解析处理工具">
<meta property="og:description" content="功能强大的URL和小程序路径解析处理工具">
<meta property="og:type" content="website">
<meta property="og:url" content="https://mulezi1029.github.io/url-parse-tool/">
```

---

## 📞 需要帮助？

如有问题，请：
- 查看 [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- 在仓库中提交 Issue
- 联系作者：[@mulezi1029](https://github.com/mulezi1029)

