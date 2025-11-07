#!/usr/bin/env node

/**
 * 文件系统操作工具集
 * 提供文件和目录的基础操作功能
 */

import fs from 'fs/promises';
import path from 'path';

// 安全验证器
class SecurityValidator {
  static validateFilePath(filePath) {
    // 防止路径遍历攻击
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      throw new Error('不安全的文件路径：包含相对路径遍历');
    }
    
    // 限制访问目录（可根据需要修改）
    const allowedDirs = [
      process.cwd(), // 当前工作目录
      '/tmp',        // 临时目录
      path.join(process.cwd(), 'data'), // 项目数据目录
    ];
    
    const isAllowed = allowedDirs.some(dir => 
      normalizedPath.startsWith(path.normalize(dir))
    );
    
    if (!isAllowed) {
      throw new Error(`无权访问该路径：${normalizedPath}`);
    }
    
    return normalizedPath;
  }

  static sanitizeFileName(fileName) {
    // 移除或替换不安全的文件名字符
    return fileName.replace(/[<>:"/\\|?*]/g, '_');
  }
}

export default {
  definitions: [
    {
      name: 'list_directory',
      description: '列出目录内容，包括文件和子目录的详细信息',
      inputSchema: {
        type: 'object',
        properties: {
          path: { 
            type: 'string', 
            description: '要列出的目录路径' 
          },
          showHidden: { 
            type: 'boolean', 
            description: '是否显示隐藏文件（以.开头的文件）', 
            default: false 
          },
          recursive: {
            type: 'boolean',
            description: '是否递归列出子目录内容',
            default: false
          },
          maxDepth: {
            type: 'number',
            description: '递归最大深度',
            default: 3
          }
        },
        required: ['path']
      }
    },
    {
      name: 'read_file',
      description: '读取文件内容，支持多种编码格式',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { 
            type: 'string', 
            description: '要读取的文件路径' 
          },
          encoding: { 
            type: 'string', 
            description: '文件编码格式',
            enum: ['utf-8', 'utf8', 'ascii', 'base64', 'hex'],
            default: 'utf-8' 
          },
          maxSize: {
            type: 'number',
            description: '最大读取字节数（防止读取过大文件）',
            default: 1048576  // 1MB
          }
        },
        required: ['filePath']
      }
    },
    {
      name: 'write_file',
      description: '写入文件内容，如果目录不存在会自动创建',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { 
            type: 'string', 
            description: '要写入的文件路径' 
          },
          content: { 
            type: 'string', 
            description: '要写入的文件内容' 
          },
          encoding: { 
            type: 'string', 
            description: '文件编码格式',
            enum: ['utf-8', 'utf8', 'ascii', 'base64', 'hex'],
            default: 'utf-8' 
          },
          createDirs: {
            type: 'boolean',
            description: '如果目录不存在是否自动创建',
            default: true
          },
          backup: {
            type: 'boolean',
            description: '是否在写入前备份原文件',
            default: false
          }
        },
        required: ['filePath', 'content']
      }
    },
    {
      name: 'delete_file',
      description: '删除文件或目录',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '要删除的文件或目录路径'
          },
          recursive: {
            type: 'boolean',
            description: '是否递归删除目录及其内容',
            default: false
          },
          force: {
            type: 'boolean',
            description: '是否强制删除（忽略只读权限）',
            default: false
          }
        },
        required: ['path']
      }
    },
    {
      name: 'copy_file',
      description: '复制文件或目录',
      inputSchema: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description: '源文件或目录路径'
          },
          destination: {
            type: 'string',
            description: '目标路径'
          },
          recursive: {
            type: 'boolean',
            description: '是否递归复制目录',
            default: false
          },
          overwrite: {
            type: 'boolean',
            description: '如果目标文件存在是否覆盖',
            default: false
          }
        },
        required: ['source', 'destination']
      }
    },
    {
      name: 'file_stats',
      description: '获取文件或目录的详细统计信息',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '文件或目录路径'
          },
          followSymlinks: {
            type: 'boolean',
            description: '是否跟随符号链接',
            default: true
          }
        },
        required: ['path']
      }
    }
  ],

  handlers: {
    async list_directory(args) {
      const { path: dirPath, showHidden = false, recursive = false, maxDepth = 3 } = args;
      
      try {
        const safePath = SecurityValidator.validateFilePath(dirPath);
        
        const listItems = async (currentPath, currentDepth = 0) => {
          if (currentDepth > maxDepth) return [];
          
          const items = await fs.readdir(currentPath, { withFileTypes: true });
          const filtered = showHidden ? items : items.filter(item => !item.name.startsWith('.'));
          
          const result = [];
          
          for (const item of filtered) {
            const itemPath = path.join(currentPath, item.name);
            const relativePath = path.relative(safePath, itemPath);
            
            try {
              const stats = await fs.stat(itemPath);
              
              const itemInfo = {
                name: item.name,
                path: relativePath,
                type: item.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString(),
                permissions: stats.mode.toString(8),
                depth: currentDepth
              };

              result.push(itemInfo);
              
              // 如果是目录且需要递归
              if (item.isDirectory() && recursive) {
                const subItems = await listItems(itemPath, currentDepth + 1);
                result.push(...subItems);
              }
            } catch (error) {
              // 跳过无权限访问的文件
              console.warn(`跳过文件 ${itemPath}: ${error.message}`);
            }
          }
          
          return result;
        };

        const result = await listItems(safePath);

        return {
          content: [{
            type: 'text',
            text: `目录 ${dirPath} 内容:\n找到 ${result.length} 项\n\n${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error) {
        throw new Error(`无法列出目录: ${error.message}`);
      }
    },

    async read_file(args) {
      const { filePath, encoding = 'utf-8', maxSize = 1048576 } = args;
      
      try {
        const safePath = SecurityValidator.validateFilePath(filePath);
        
        // 检查文件大小
        const stats = await fs.stat(safePath);
        if (stats.size > maxSize) {
          throw new Error(`文件太大 (${stats.size} bytes)，最大允许 ${maxSize} bytes`);
        }
        
        const content = await fs.readFile(safePath, encoding);
        
        return {
          content: [{
            type: 'text',
            text: `文件: ${filePath}\n大小: ${stats.size} 字节\n编码: ${encoding}\n修改时间: ${stats.mtime.toISOString()}\n\n内容:\n${'='.repeat(50)}\n${content}\n${'='.repeat(50)}`
          }]
        };
      } catch (error) {
        throw new Error(`无法读取文件: ${error.message}`);
      }
    },

    async write_file(args) {
      const { filePath, content, encoding = 'utf-8', createDirs = true, backup = false } = args;
      
      try {
        const safePath = SecurityValidator.validateFilePath(filePath);
        const dirPath = path.dirname(safePath);
        
        // 创建目录（如果需要）
        if (createDirs) {
          await fs.mkdir(dirPath, { recursive: true });
        }
        
        // 备份原文件（如果需要且文件存在）
        if (backup) {
          try {
            await fs.access(safePath);
            const backupPath = `${safePath}.backup.${Date.now()}`;
            await fs.copyFile(safePath, backupPath);
            console.log(`原文件已备份到: ${backupPath}`);
          } catch (error) {
            // 文件不存在，无需备份
          }
        }
        
        await fs.writeFile(safePath, content, encoding);
        const stats = await fs.stat(safePath);
        
        return {
          content: [{
            type: 'text',
            text: `文件写入成功!\n路径: ${filePath}\n大小: ${stats.size} 字节\n编码: ${encoding}\n修改时间: ${stats.mtime.toISOString()}`
          }]
        };
      } catch (error) {
        throw new Error(`无法写入文件: ${error.message}`);
      }
    },

    async delete_file(args) {
      const { path: targetPath, recursive = false, force = false } = args;
      
      try {
        const safePath = SecurityValidator.validateFilePath(targetPath);
        
        const stats = await fs.stat(safePath);
        
        if (stats.isDirectory()) {
          if (!recursive) {
            throw new Error('无法删除目录：需要设置 recursive = true');
          }
          await fs.rm(safePath, { recursive: true, force });
        } else {
          await fs.unlink(safePath);
        }
        
        return {
          content: [{
            type: 'text',
            text: `成功删除 ${stats.isDirectory() ? '目录' : '文件'}: ${targetPath}`
          }]
        };
      } catch (error) {
        throw new Error(`删除失败: ${error.message}`);
      }
    },

    async copy_file(args) {
      const { source, destination, recursive = false, overwrite = false } = args;
      
      try {
        const safeSource = SecurityValidator.validateFilePath(source);
        const safeDest = SecurityValidator.validateFilePath(destination);
        
        // 检查目标是否存在
        if (!overwrite) {
          try {
            await fs.access(safeDest);
            throw new Error('目标文件/目录已存在，设置 overwrite = true 以覆盖');
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            // 文件不存在，可以继续
          }
        }
        
        const sourceStats = await fs.stat(safeSource);
        
        if (sourceStats.isDirectory()) {
          if (!recursive) {
            throw new Error('无法复制目录：需要设置 recursive = true');
          }
          await fs.cp(safeSource, safeDest, { recursive: true, force: overwrite });
        } else {
          // 确保目标目录存在
          await fs.mkdir(path.dirname(safeDest), { recursive: true });
          await fs.copyFile(safeSource, safeDest);
        }
        
        return {
          content: [{
            type: 'text',
            text: `成功复制 ${sourceStats.isDirectory() ? '目录' : '文件'}\n从: ${source}\n到: ${destination}`
          }]
        };
      } catch (error) {
        throw new Error(`复制失败: ${error.message}`);
      }
    },

    async file_stats(args) {
      const { path: targetPath, followSymlinks = true } = args;
      
      try {
        const safePath = SecurityValidator.validateFilePath(targetPath);
        
        const stats = followSymlinks 
          ? await fs.stat(safePath)
          : await fs.lstat(safePath);
        
        const fileInfo = {
          path: targetPath,
          type: stats.isDirectory() ? 'directory' : 
                stats.isFile() ? 'file' :
                stats.isSymbolicLink() ? 'symlink' :
                stats.isBlockDevice() ? 'block-device' :
                stats.isCharacterDevice() ? 'char-device' :
                stats.isFIFO() ? 'fifo' :
                stats.isSocket() ? 'socket' : 'unknown',
          size: stats.size,
          sizeHuman: this.formatBytes(stats.size),
          permissions: {
            octal: stats.mode.toString(8),
            readable: !!(stats.mode & 0o444),
            writable: !!(stats.mode & 0o222),
            executable: !!(stats.mode & 0o111)
          },
          timestamps: {
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
            changed: stats.ctime.toISOString()
          },
          uid: stats.uid,
          gid: stats.gid,
          blocks: stats.blocks,
          blockSize: stats.blksize
        };

        // 如果是符号链接，获取链接目标
        if (stats.isSymbolicLink()) {
          try {
            fileInfo.linkTarget = await fs.readlink(safePath);
          } catch (error) {
            fileInfo.linkTarget = 'unknown';
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: `文件统计信息:\n${JSON.stringify(fileInfo, null, 2)}`
          }]
        };
      } catch (error) {
        throw new Error(`获取文件信息失败: ${error.message}`);
      }
    }
  },

  // 辅助方法
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
