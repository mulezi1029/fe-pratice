import React from 'react';
import SkeletonAvatar from './SkeletonAvatar';
import SkeletonText from './SkeletonText';
import SkeletonImage from './SkeletonImage';
import SkeletonButton from './SkeletonButton';

/**
 * 主骨架屏组件
 * 支持快速配置和自定义子组件组合
 */
const Skeleton = ({
  children,
  className = '',
  style = {},
  
  // 快速配置选项
  loading = true,
  avatar = false,
  image = false,
  rows = 0,
  
  // 样式配置
  animation = 'wave',
  round = false,
  active = true,
  
  // 头像配置
  avatarProps = {},
  
  // 文本配置
  textProps = {},
  
  // 图片配置
  imageProps = {},
  
  ...props
}) => {
  // 如果不是加载状态，直接渲染子组件
  if (!loading) {
    return children || null;
  }

  // 生成基础类名
  const baseClassName = [
    'skeleton',
    animation && `skeleton--${animation}`,
    round && 'skeleton--round',
    active && 'skeleton--active',
    className
  ].filter(Boolean).join(' ');

  // 如果有自定义子组件，直接使用
  if (children) {
    return (
      <div className={baseClassName} style={style} {...props}>
        {children}
      </div>
    );
  }

  // 否则根据配置生成默认结构
  return (
    <div className={baseClassName} style={style} {...props}>
      {avatar && (
        <div className="skeleton__header">
          <SkeletonAvatar {...avatarProps} />
          {rows > 0 && (
            <div className="skeleton__content">
              <SkeletonText rows={Math.min(rows, 2)} {...textProps} />
            </div>
          )}
        </div>
      )}
      
      {!avatar && rows > 0 && (
        <SkeletonText rows={rows} {...textProps} />
      )}
      
      {image && (
        <SkeletonImage {...imageProps} />
      )}
    </div>
  );
};

// 静态方法，方便直接调用子组件
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Text = SkeletonText;
Skeleton.Image = SkeletonImage;
Skeleton.Button = SkeletonButton;

export default Skeleton;
