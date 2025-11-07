import React from 'react';

/**
 * 头像骨架屏组件
 */
const SkeletonAvatar = ({
  size = 'default',
  shape = 'circle',
  className = '',
  style = {},
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    small: { width: 24, height: 24 },
    default: { width: 40, height: 40 },
    large: { width: 64, height: 64 },
  };

  // 获取尺寸样式
  const sizeStyle = typeof size === 'string' && sizeMap[size] 
    ? sizeMap[size] 
    : typeof size === 'number' 
    ? { width: size, height: size }
    : typeof size === 'object'
    ? size
    : sizeMap.default;

  // 生成类名
  const baseClassName = [
    'skeleton-avatar',
    `skeleton-avatar--${shape}`,
    `skeleton-avatar--${typeof size === 'string' ? size : 'custom'}`,
    className
  ].filter(Boolean).join(' ');

  // 合并样式
  const finalStyle = {
    ...sizeStyle,
    ...style
  };

  return (
    <div 
      className={baseClassName} 
      style={finalStyle}
      {...props}
    />
  );
};

export default SkeletonAvatar;

