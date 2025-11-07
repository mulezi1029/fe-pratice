import React from 'react';

/**
 * 图片骨架屏组件
 */
const SkeletonImage = ({
  width = '100%',
  height = 200,
  className = '',
  style = {},
  showIcon = true,
  ...props
}) => {
  // 生成类名
  const baseClassName = [
    'skeleton-image',
    className
  ].filter(Boolean).join(' ');

  // 合并样式
  const finalStyle = {
    width,
    height,
    ...style
  };

  return (
    <div 
      className={baseClassName} 
      style={finalStyle}
      {...props}
    >
      {showIcon && (
        <div className="skeleton-image__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default SkeletonImage;

