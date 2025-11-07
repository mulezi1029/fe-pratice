#!/usr/bin/env node

/**
 * 工具模块索引文件
 * 统一导出所有工具模块，方便管理和使用
 */

// 导入各个工具模块
export { default as filesystemTools } from './filesystem.js';
export { default as networkTools } from './network.js';

/**
 * 获取所有工具定义
 */
export function getAllToolDefinitions() {
  const modules = [
    { namespace: 'filesystem', module: filesystemTools },
    { namespace: 'network', module: networkTools }
  ];
  
  const tools = [];
  
  modules.forEach(({ namespace, module }) => {
    if (module.definitions) {
      module.definitions.forEach(tool => {
        tools.push({
          ...tool,
          name: `${namespace}.${tool.name}`,
          description: `[${namespace.toUpperCase()}] ${tool.description}`,
          namespace,
          originalName: tool.name
        });
      });
    }
  });
  
  return tools;
}

/**
 * 获取所有工具处理器
 */
export function getAllToolHandlers() {
  const handlers = {};
  
  const modules = [
    { namespace: 'filesystem', module: filesystemTools },
    { namespace: 'network', module: networkTools }
  ];
  
  modules.forEach(({ namespace, module }) => {
    if (module.handlers) {
      Object.entries(module.handlers).forEach(([name, handler]) => {
        handlers[`${namespace}.${name}`] = handler;
      });
    }
  });
  
  return handlers;
}

/**
 * 按命名空间分组工具
 */
export function getToolsByNamespace() {
  const modules = [
    { namespace: 'filesystem', module: filesystemTools },
    { namespace: 'network', module: networkTools }
  ];
  
  const grouped = {};
  
  modules.forEach(({ namespace, module }) => {
    if (module.definitions && module.handlers) {
      grouped[namespace] = {
        definitions: module.definitions,
        handlers: module.handlers,
        count: module.definitions.length
      };
    }
  });
  
  return grouped;
}

/**
 * 验证工具模块格式
 */
export function validateToolModule(moduleName, module) {
  const errors = [];
  
  if (!module) {
    errors.push(`模块 ${moduleName} 不存在`);
    return errors;
  }
  
  if (!module.definitions || !Array.isArray(module.definitions)) {
    errors.push(`模块 ${moduleName} 缺少 definitions 数组`);
  }
  
  if (!module.handlers || typeof module.handlers !== 'object') {
    errors.push(`模块 ${moduleName} 缺少 handlers 对象`);
  }
  
  if (module.definitions && module.handlers) {
    // 检查每个工具定义是否有对应的处理器
    module.definitions.forEach(tool => {
      if (!module.handlers[tool.name]) {
        errors.push(`工具 ${tool.name} 缺少对应的处理器`);
      }
      
      // 检查工具定义的必需字段
      if (!tool.name) {
        errors.push(`工具定义缺少 name 字段`);
      }
      if (!tool.description) {
        errors.push(`工具 ${tool.name} 缺少 description 字段`);
      }
      if (!tool.inputSchema) {
        errors.push(`工具 ${tool.name} 缺少 inputSchema 字段`);
      }
    });
    
    // 检查处理器是否都有对应的定义
    Object.keys(module.handlers).forEach(handlerName => {
      const hasDefinition = module.definitions.some(tool => tool.name === handlerName);
      if (!hasDefinition) {
        errors.push(`处理器 ${handlerName} 没有对应的工具定义`);
      }
    });
  }
  
  return errors;
}

/**
 * 获取工具使用帮助
 */
export function getToolHelp(toolName) {
  const modules = [
    { namespace: 'filesystem', module: filesystemTools },
    { namespace: 'network', module: networkTools }
  ];
  
  for (const { namespace, module } of modules) {
    if (module.definitions) {
      const tool = module.definitions.find(t => 
        t.name === toolName || `${namespace}.${t.name}` === toolName
      );
      
      if (tool) {
        return {
          name: tool.name,
          fullName: `${namespace}.${tool.name}`,
          description: tool.description,
          namespace,
          inputSchema: tool.inputSchema,
          examples: tool.examples || [],
          usage: `使用 ${namespace}.${tool.name} 调用此工具`
        };
      }
    }
  }
  
  return null;
}

/**
 * 生成工具文档
 */
export function generateToolsDocumentation() {
  const grouped = getToolsByNamespace();
  let doc = '# MCP 服务器工具文档\n\n';
  
  doc += `本服务器提供 ${Object.keys(grouped).length} 个命名空间的工具:\n\n`;
  
  Object.entries(grouped).forEach(([namespace, { definitions, count }]) => {
    doc += `## ${namespace.toUpperCase()} 工具 (${count} 个)\n\n`;
    
    definitions.forEach(tool => {
      doc += `### ${namespace}.${tool.name}\n\n`;
      doc += `**描述**: ${tool.description}\n\n`;
      
      doc += `**参数**:\n`;
      if (tool.inputSchema && tool.inputSchema.properties) {
        Object.entries(tool.inputSchema.properties).forEach(([prop, schema]) => {
          const required = tool.inputSchema.required?.includes(prop) ? '**必需**' : '可选';
          doc += `- \`${prop}\` (${schema.type}) - ${schema.description} - ${required}\n`;
        });
      }
      doc += '\n';
      
      if (tool.examples) {
        doc += `**示例**:\n`;
        tool.examples.forEach(example => {
          doc += `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\`\n\n`;
        });
      }
    });
  });
  
  return doc;
}

// 模块验证（启动时运行）
const modules = [
  { name: 'filesystem', module: filesystemTools },
  { name: 'network', module: networkTools }
];

console.log('🔍 验证工具模块...');
modules.forEach(({ name, module }) => {
  const errors = validateToolModule(name, module);
  if (errors.length === 0) {
    console.log(`✅ ${name} 模块验证通过`);
  } else {
    console.error(`❌ ${name} 模块验证失败:`);
    errors.forEach(error => console.error(`  - ${error}`));
  }
});

export default {
  getAllToolDefinitions,
  getAllToolHandlers,
  getToolsByNamespace,
  validateToolModule,
  getToolHelp,
  generateToolsDocumentation
};
