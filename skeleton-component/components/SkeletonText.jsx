import React from 'react';

/**
 * 文本骨架屏组件
 */
const SkeletonText = ({
  rows = 1,
  width = '100%',
  className = '',
  style = {},
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = '60%',
  ...props
}) => {
  // 生成类名
  const baseClassName = [
    'skeleton-text',
    className
  ].filter(Boolean).join(' ');

  // 生成多行文本
  const renderLines = () => {
    const lines = [];
    
    for (let i = 0; i < rows; i++) {
      const isLastLine = i === rows - 1;
      const lineWidth = isLastLine && rows > 1 ? lastLineWidth : width;
      
      const lineStyle = {
        height: lineHeight,
        width: lineWidth,
        marginBottom: i < rows - 1 ? spacing : 0,
      };

      lines.push(
        <div
          key={i}
          className="skeleton-text__line"
          style={lineStyle}
        />
      );
    }
    
    return lines;
  };

  return (
    <div className={baseClassName} style={style} {...props}>
      {renderLines()}
    </div>
  );
};

export default SkeletonText;

