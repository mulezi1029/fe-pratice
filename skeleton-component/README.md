# 🎨 通用骨架屏组件

一个高度可配置、适用于多种场景的 React 骨架屏组件库，提供丰富的动画效果和主题定制能力。

![版本](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/react-%3E%3D16.8.0-blue)
![许可证](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🎨 **多种预设样式**: 文本、头像、图片、按钮等多种骨架类型
- 🔧 **高度可配置**: 支持自定义尺寸、颜色、圆角、间距等
- 🌊 **丰富动画效果**: 波浪扫描、呼吸动画、闪烁动画等
- 📱 **响应式设计**: 自适应不同屏幕尺寸，移动端友好
- 🌙 **主题支持**: 内置浅色和深色主题，支持自定义主题
- 🚀 **轻量级**: 无额外依赖，打包体积小
- 💡 **易于使用**: 简洁直观的 API 设计
- ♿ **可访问性**: 内置 ARIA 支持，提升用户体验

## 🚀 快速开始

### 安装

```bash
# 下载组件代码
git clone <this-repo>
cd skeleton-component
```

### 基础用法

```jsx
import React from 'react';
import { Skeleton } from './components';
import './styles/skeleton.css';

function App() {
  return (
    <div>
      {/* 简单文本骨架 */}
      <Skeleton rows={3} />

      {/* 头像+文本组合 */}
      <Skeleton avatar rows={2} />

      {/* 完整卡片布局 */}
      <Skeleton avatar image rows={4} />
    </div>
  );
}
```

### 自定义布局

```jsx
<Skeleton animation="wave" active>
  <Skeleton.Avatar size="large" />
  <Skeleton.Text rows={2} />
  <Skeleton.Image width="100%" height={200} />
  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
    <Skeleton.Button />
    <Skeleton.Button width={80} />
  </div>
</Skeleton>
```

## 📖 使用示例

### 加载状态控制

```jsx
const UserCard = ({ loading, data }) => {
  if (loading) {
    return (
      <Skeleton avatar rows={2} animation="wave" active />
    );
  }

  return (
    <div className="user-card">
      <img src={data.avatar} alt={data.name} />
      <div>
        <h3>{data.name}</h3>
        <p>{data.title}</p>
      </div>
    </div>
  );
};
```

### 列表骨架屏

```jsx
const SkeletonList = ({ count = 5 }) => {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Skeleton.Avatar size="small" />
          <div style={{ flex: 1 }}>
            <Skeleton.Text rows={1} width="70%" />
            <Skeleton.Text rows={1} width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 表格骨架屏

```jsx
const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Text 
              key={colIndex}
              rows={1} 
              width={`${60 + Math.random() * 40}%`}
              style={{ flex: 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
```

## 🎛️ API 文档

详细的 API 文档请查看 [API.md](./API.md)

### 主要组件

- `Skeleton` - 主容器组件
- `Skeleton.Avatar` - 头像骨架
- `Skeleton.Text` - 文本骨架  
- `Skeleton.Image` - 图片骨架
- `Skeleton.Button` - 按钮骨架

### 动画类型

- `wave` - 波浪扫描动画（默认）
- `pulse` - 呼吸动画
- `blink` - 闪烁动画
- `none` - 无动画

## 🎨 演示

打开 `demo.html` 文件在浏览器中查看所有功能的演示，包括：

- 交互式配置面板
- 各种动画效果展示
- 不同主题演示
- 复杂布局示例

## 📁 目录结构

```
skeleton-component/
├── components/           # React 组件
│   ├── Skeleton.jsx         # 主组件
│   ├── SkeletonAvatar.jsx   # 头像骨架
│   ├── SkeletonText.jsx     # 文本骨架
│   ├── SkeletonImage.jsx    # 图片骨架
│   ├── SkeletonButton.jsx   # 按钮骨架
│   └── index.js             # 统一导出
├── styles/               # 样式文件
│   └── skeleton.css         # 主样式文件
├── examples/             # 使用示例
│   └── ReactExample.jsx    # React 完整示例
├── demo.html            # HTML 演示页面
├── API.md              # API 文档
├── package.json        # 项目配置
└── README.md          # 说明文档
```

## 🌙 主题定制

### 使用内置主题

```jsx
<Skeleton className="skeleton--theme-dark" rows={3} />
```

### 自定义主题

```css
.my-custom-skeleton {
  --skeleton-bg: #your-bg-color;
  --skeleton-highlight: #your-highlight-color;
  --skeleton-icon-color: #your-icon-color;
}
```

## 📱 响应式支持

组件内置响应式支持：

- **768px 以下**: 头像尺寸适当缩小，文本行高优化
- **480px 以下**: 进一步压缩尺寸，优化移动端显示

## 🔧 最佳实践

### 性能优化

```jsx
// 使用 React.memo 避免不必要重渲染
const MemoizedSkeleton = React.memo(Skeleton);

// 条件渲染而非显示隐藏
{loading ? <Skeleton rows={3} /> : <Content />}
```

### 用户体验

```jsx
// 根据内容结构设计骨架屏
<Skeleton avatar rows={2} />  // 用户卡片
<Skeleton image rows={3} />   // 文章卡片

// 保持一致的动画效果
<Skeleton animation="wave" active />
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 鸣谢

感谢所有为这个项目做出贡献的开发者！

---

如果你觉得这个组件对你有帮助，请给我们一个 ⭐️！
