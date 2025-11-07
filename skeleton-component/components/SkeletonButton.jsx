import React from 'react';

/**
 * 按钮骨架屏组件
 */
const SkeletonButton = ({
  size = 'default',
  shape = 'default',
  width,
  className = '',
  style = {},
  ...props
}) => {
  // 尺寸映射
  const sizeMap = {
    small: { height: 24, width: width || 80 },
    default: { height: 32, width: width || 100 },
    large: { height: 40, width: width || 120 },
  };

  // 获取尺寸样式
  const sizeStyle = sizeMap[size] || sizeMap.default;
  
  if (width) {
    sizeStyle.width = width;
  }

  // 生成类名
  const baseClassName = [
    'skeleton-button',
    `skeleton-button--${size}`,
    `skeleton-button--${shape}`,
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

export default SkeletonButton;

