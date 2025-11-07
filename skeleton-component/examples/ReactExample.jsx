import React, { useState, useEffect } from 'react';
import { Skeleton } from '../components';
import './ReactExample.css';

// 模拟数据获取
const fetchUserData = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: 1,
        name: '张三',
        avatar: 'http://iph.href.lu/50x50?fg=666666&bg=cccccc',
        title: '前端开发工程师',
        company: 'XX科技有限公司',
        description: '专注于前端技术栈，有丰富的React和Vue项目经验。'
      });
    }, 2000);
  });
};

const fetchArticles = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: '如何构建通用骨架屏组件',
          image: 'http://iph.href.lu/50x50?fg=666666&bg=cccccc',
          summary: '本文详细介绍了如何设计和实现一个高度可配置的骨架屏组件...',
          author: '李四',
          publishTime: '2024-01-15'
        },
        {
          id: 2,
          title: 'React性能优化最佳实践',
          image: 'http://iph.href.lu/50x50?fg=666666&bg=cccccc',
          summary: '分享在大型React应用中的性能优化经验和技巧...',
          author: '王五',
          publishTime: '2024-01-12'
        },
        {
          id: 3,
          title: 'CSS Grid布局完全指南',
          image: 'http://iph.href.lu/50x50?fg=666666&bg=cccccc',
          summary: '从基础到进阶，全面掌握CSS Grid布局的使用方法...',
          author: '赵六',
          publishTime: '2024-01-10'
        }
      ]);
    }, 1500);
  });
};

// 用户卡片组件
const UserCard = ({ loading, data }) => {
  if (loading) {
    return (
      <div className="user-card-wrapper">
        <Skeleton avatar rows={2} animation="wave" active />
      </div>
    );
  }

  return (
    <div className="user-card">
      <img src={data.avatar} alt={data.name} className="user-avatar" />
      <div className="user-info">
        <h3>{data.name}</h3>
        <p className="user-title">{data.title}</p>
        <p className="user-company">{data.company}</p>
        <p className="user-description">{data.description}</p>
      </div>
    </div>
  );
};

// 文章卡片组件
const ArticleCard = ({ loading, data }) => {
  if (loading) {
    return (
      <div className="article-card-wrapper">
        <Skeleton>
          <Skeleton.Image width="100%" height={200} />
          <div style={{ padding: '16px' }}>
            <Skeleton.Text rows={1} style={{ height: 20, marginBottom: 12 }} />
            <Skeleton.Text rows={2} />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton.Text rows={1} width="30%" />
              <Skeleton.Text rows={1} width="25%" />
            </div>
          </div>
        </Skeleton>
      </div>
    );
  }

  return (
    <div className="article-card">
      <img src={data.image} alt={data.title} className="article-image" />
      <div className="article-content">
        <h3>{data.title}</h3>
        <p className="article-summary">{data.summary}</p>
        <div className="article-meta">
          <span>作者: {data.author}</span>
          <span>{data.publishTime}</span>
        </div>
      </div>
    </div>
  );
};

// 列表组件
const SkeletonList = ({ count = 5, animation = "wave" }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton animation={animation} active>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <Skeleton.Avatar size="small" />
              <div style={{ flex: 1 }}>
                <Skeleton.Text rows={1} width="70%" style={{ marginBottom: 8 }} />
                <Skeleton.Text rows={1} width="50%" />
              </div>
              <Skeleton.Button size="small" width={60} />
            </div>
          </Skeleton>
        </div>
      ))}
    </div>
  );
};

// 表格骨架屏
const SkeletonTable = ({ rows = 5, columns = 4, animation = "wave" }) => {
  return (
    <div className="skeleton-table">
      <Skeleton animation={animation} active>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Text 
              key={colIndex}
              rows={1} 
              width={`${60 + Math.random() * 40}%`}
              style={{ flex: 1, marginRight: colIndex < columns - 1 ? 16 : 0 }}
            />
          ))}
        </div>
      ))}
      </Skeleton>
    </div>
  );
};

// 主应用组件
const App = () => {
  const [userLoading, setUserLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [articlesData, setArticlesData] = useState([]);

  // 演示不同的骨架屏配置
  const [demoConfig, setDemoConfig] = useState({
    animation: 'wave',
    active: true,
    round: false
  });

  useEffect(() => {
    // 获取用户数据
    fetchUserData().then(data => {
      setUserData(data);
      setUserLoading(false);
    });

    // 获取文章数据
    fetchArticles().then(data => {
      setArticlesData(data);
      setArticlesLoading(false);
    });
  }, []);

  const handleReload = () => {
    setUserLoading(true);
    setArticlesLoading(true);
    setUserData(null);
    setArticlesData([]);

    setTimeout(() => {
      fetchUserData().then(data => {
        setUserData(data);
        setUserLoading(false);
      });

      fetchArticles().then(data => {
        setArticlesData(data);
        setArticlesLoading(false);
      });
    }, 500);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>React 骨架屏组件示例</h1>
        <button onClick={handleReload} className="reload-btn">
          重新加载数据
        </button>
      </header>

      {/* 配置控制面板 */}
      <div className="config-panel">
        <h3>配置选项</h3>
        <div className="config-controls">
          <label>
            动画效果:
            <select 
              value={demoConfig.animation} 
              onChange={e => setDemoConfig(prev => ({...prev, animation: e.target.value}))}
            >
              <option value="wave">波浪</option>
              <option value="pulse">脉冲</option>
              <option value="blink">闪烁</option>
              <option value="none">无动画</option>
            </select>
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={demoConfig.active}
              onChange={e => setDemoConfig(prev => ({...prev, active: e.target.checked}))}
            />
            激活状态
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={demoConfig.round}
              onChange={e => setDemoConfig(prev => ({...prev, round: e.target.checked}))}
            />
            圆角样式
          </label>
        </div>
      </div>

      <main className="app-main">
        {/* 用户信息区域 */}
        <section className="section">
          <h2>用户信息</h2>
          <UserCard loading={userLoading} data={userData} />
        </section>

        {/* 文章列表区域 */}
        <section className="section">
          <h2>文章列表</h2>
          <div className="articles-grid">
            {articlesLoading ? (
              // 显示3个文章骨架屏
              Array.from({ length: 3 }).map((_, index) => (
                <ArticleCard key={index} loading={true} />
              ))
            ) : (
              articlesData.map(article => (
                <ArticleCard key={article.id} loading={false} data={article} />
              ))
            )}
          </div>
        </section>

        {/* 各种骨架屏模式演示 */}
        <section className="section">
          <h2>骨架屏模式演示</h2>
          
          {/* 基础用法 */}
          <div className="demo-group">
            <h3>基础用法</h3>
            <Skeleton 
              rows={3} 
              animation={demoConfig.animation}
              active={demoConfig.active}
              round={demoConfig.round}
            />
          </div>

          {/* 头像+文本 */}
          <div className="demo-group">
            <h3>头像+文本</h3>
            <Skeleton 
              avatar 
              rows={2}
              animation={demoConfig.animation}
              active={demoConfig.active}
              round={demoConfig.round}
            />
          </div>

          {/* 图片骨架 */}
          <div className="demo-group">
            <h3>图片骨架</h3>
            <Skeleton 
              image 
              animation={demoConfig.animation}
              active={demoConfig.active}
              round={demoConfig.round}
            />
          </div>

          {/* 自定义组合 */}
          <div className="demo-group">
            <h3>自定义组合</h3>
            <Skeleton animation={demoConfig.animation} active={demoConfig.active}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <Skeleton.Avatar size="large" shape={demoConfig.round ? 'square' : 'circle'} />
                <div style={{ flex: 1 }}>
                  <Skeleton.Text rows={1} style={{ height: 24, marginBottom: 8 }} />
                  <Skeleton.Text rows={1} width="60%" />
                </div>
              </div>
              <Skeleton.Image width="100%" height={120} />
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <Skeleton.Button size="default" />
                <Skeleton.Button size="default" width={80} />
              </div>
            </Skeleton>
          </div>

          {/* 列表骨架 */}
          <div className="demo-group">
            <h3>列表骨架</h3>
            <SkeletonList count={3} animation={demoConfig.animation} />
          </div>

          {/* 表格骨架 */}
          <div className="demo-group">
            <h3>表格骨架</h3>
            <SkeletonTable rows={4} columns={3} animation={demoConfig.animation}/>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

// 对应的CSS样式可以参考以下结构:
const styles = `
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9e9e9;
}

.reload-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.config-panel {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.config-controls {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.user-card, .article-card {
  border: 1px solid #e9e9e9;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.demo-group {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e9e9e9;
  border-radius: 8px;
}

.demo-group h3 {
  margin-bottom: 12px;
  color: #34495e;
}

.skeleton-list-item {
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-table-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
`;

// 使用说明:
/*
1. 安装依赖: 确保项目中已安装 React

2. 导入样式: 
   import '../styles/skeleton.css';

3. 使用组件:
   import { Skeleton } from '../components';
   
4. 基础用法:
   <Skeleton rows={3} />
   <Skeleton avatar rows={2} />
   <Skeleton image />
   
5. 高级用法:
   <Skeleton animation="wave" active>
     <Skeleton.Avatar size="large" />
     <Skeleton.Text rows={2} />
     <Skeleton.Button />
   </Skeleton>
*/


