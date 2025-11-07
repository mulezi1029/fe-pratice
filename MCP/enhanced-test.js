#!/usr/bin/env node

/**
 * 增强版 MCP 服务器测试文件
 * 测试所有工具模块的功能
 */

import EnhancedMCPServer from './enhanced-server.js';
import fs from 'fs/promises';
import path from 'path';

class EnhancedMCPTester {
  constructor() {
    this.server = new EnhancedMCPServer();
    this.testResults = [];
    this.testDataDir = './test-data';
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始增强版 MCP 服务器测试\n');

    // 创建测试数据目录
    await this.setupTestEnvironment();

    // 测试基础工具
    await this.testBuiltinTools();
    
    // 测试文件系统工具
    await this.testFilesystemTools();
    
    // 测试网络工具
    await this.testNetworkTools();
    
    // 测试系统工具
    await this.testSystemTools();

    // 清理测试环境
    await this.cleanupTestEnvironment();

    this.printTestResults();
  }

  /**
   * 设置测试环境
   */
  async setupTestEnvironment() {
    try {
      await fs.mkdir(this.testDataDir, { recursive: true });
      console.log('✅ 测试环境设置完成\n');
    } catch (error) {
      console.error('❌ 测试环境设置失败:', error.message);
    }
  }

  /**
   * 清理测试环境
   */
  async cleanupTestEnvironment() {
    try {
      await fs.rm(this.testDataDir, { recursive: true, force: true });
      console.log('🧹 测试环境清理完成\n');
    } catch (error) {
      console.warn('⚠️ 测试环境清理失败:', error.message);
    }
  }

  /**
   * 测试内置工具
   */
  async testBuiltinTools() {
    console.log('🔧 测试内置工具...');

    const tests = [
      {
        name: 'add_numbers',
        args: { a: 15, b: 25 },
        expectedInResult: '40'
      },
      {
        name: 'text_analysis',
        args: { text: '这是一个测试文本。\n包含中文和English。\n多行内容测试。' },
        expectedInResult: '字符数'
      },
      {
        name: 'generate_uuid',
        args: {},
        expectedInResult: 'UUID'
      },
      {
        name: 'current_time',
        args: { format: 'locale' },
        expectedInResult: '当前时间'
      },
      {
        name: 'system_info',
        args: {},
        expectedInResult: '服务器信息'
      },
      {
        name: 'tool_stats',
        args: {},
        expectedInResult: '工具总数'
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('builtin', test.name, test.args, test.expectedInResult);
    }

    console.log('');
  }

  /**
   * 测试文件系统工具
   */
  async testFilesystemTools() {
    console.log('📁 测试文件系统工具...');

    // 创建测试文件
    const testFilePath = path.join(this.testDataDir, 'test.txt');
    const testContent = 'Hello, MCP Server!\nThis is a test file.';

    const tests = [
      {
        name: 'filesystem.write_file',
        args: { filePath: testFilePath, content: testContent },
        expectedInResult: '写入成功'
      },
      {
        name: 'filesystem.read_file',
        args: { filePath: testFilePath },
        expectedInResult: testContent
      },
      {
        name: 'filesystem.file_stats',
        args: { path: testFilePath },
        expectedInResult: '文件统计信息'
      },
      {
        name: 'filesystem.list_directory',
        args: { path: this.testDataDir },
        expectedInResult: 'test.txt'
      },
      {
        name: 'filesystem.copy_file',
        args: { 
          source: testFilePath, 
          destination: path.join(this.testDataDir, 'test-copy.txt') 
        },
        expectedInResult: '成功复制'
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('filesystem', test.name, test.args, test.expectedInResult);
    }

    console.log('');
  }

  /**
   * 测试网络工具
   */
  async testNetworkTools() {
    console.log('🌐 测试网络工具...');

    const tests = [
      {
        name: 'network.http_request',
        args: { url: 'https://httpbin.org/get', method: 'GET' },
        expectedInResult: 'HTTP GET'
      },
      {
        name: 'network.ping_host',
        args: { host: 'google.com', port: 80, attempts: 2 },
        expectedInResult: '连通性测试'
      },
      {
        name: 'network.check_website',
        args: { url: 'https://www.google.com' },
        expectedInResult: '网站状态检查'
      },
      {
        name: 'network.get_ip_info',
        args: { provider: 'ipapi' },
        expectedInResult: 'IP地址信息'
      }
    ];

    for (const test of tests) {
      await this.runSingleTest('network', test.name, test.args, test.expectedInResult);
    }

    console.log('');
  }

  /**
   * 测试系统工具
   */
  async testSystemTools() {
    console.log('🖥️ 测试系统相关功能...');

    // 测试资源访问
    try {
      console.log('   📊 测试服务器统计资源...');
      const statsResource = await this.server.getServerStatsResource();
      const success = statsResource.contents && statsResource.contents.length > 0;
      this.testResults.push({
        tool: 'server-stats-resource',
        success,
        message: success ? '✅ 资源访问正常' : '❌ 资源访问失败'
      });
    } catch (error) {
      this.testResults.push({
        tool: 'server-stats-resource',
        success: false,
        message: '❌ 资源访问失败',
        error: error.message
      });
    }

    console.log('');
  }

  /**
   * 运行单个测试
   */
  async runSingleTest(category, toolName, args, expectedInResult) {
    try {
      console.log(`   🔧 测试 ${toolName}...`);
      
      const result = await this.server.executeToolSafely(toolName, args);
      const success = !result.isError && 
                     result.content && 
                     result.content[0] && 
                     result.content[0].text.includes(expectedInResult);
      
      this.testResults.push({
        tool: toolName,
        category,
        success,
        message: success ? '✅ 测试通过' : '❌ 测试失败',
        result: success ? '符合预期' : `期望包含: ${expectedInResult}`
      });
      
      console.log(`      ${success ? '✅' : '❌'} ${toolName} ${success ? '通过' : '失败'}`);
      
      if (!success && result.content) {
        console.log(`      详情: ${result.content[0]?.text?.substring(0, 100)}...`);
      }
    } catch (error) {
      this.testResults.push({
        tool: toolName,
        category,
        success: false,
        message: '❌ 测试失败',
        error: error.message
      });
      
      console.log(`      ❌ ${toolName} 错误: ${error.message}`);
    }
  }

  /**
   * 打印测试结果摘要
   */
  printTestResults() {
    console.log('📋 增强版 MCP 服务器测试结果摘要\n');
    console.log('━'.repeat(60));
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    // 按类别分组显示结果
    const categories = {};
    this.testResults.forEach(result => {
      const category = result.category || 'system';
      if (!categories[category]) {
        categories[category] = { total: 0, success: 0, tests: [] };
      }
      categories[category].total++;
      if (result.success) categories[category].success++;
      categories[category].tests.push(result);
    });

    Object.entries(categories).forEach(([category, data]) => {
      console.log(`\n📂 ${category.toUpperCase()} 工具 (${data.success}/${data.total} 通过)`);
      console.log('─'.repeat(40));
      
      data.tests.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const toolName = result.tool.padEnd(25);
        console.log(`${icon} ${toolName} ${result.message}`);
        if (result.error) {
          console.log(`   错误: ${result.error}`);
        }
      });
    });
    
    console.log('\n' + '━'.repeat(60));
    console.log(`📊 总计: ${successCount}/${totalCount} 个测试通过`);
    console.log(`📈 成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！增强版 MCP 服务器运行完全正常。');
    } else if (successCount / totalCount >= 0.8) {
      console.log('✅ 大部分测试通过，服务器基本功能正常。');
    } else {
      console.log('⚠️ 多个测试失败，请检查服务器配置和网络连接。');
    }

    // 提供改进建议
    console.log('\n💡 测试建议:');
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length === 0) {
      console.log('- 所有功能正常，可以投入使用');
    } else {
      console.log('- 检查失败的工具实现');
      console.log('- 确认网络连接状况');
      console.log('- 验证文件权限设置');
      if (failedTests.some(t => t.category === 'network')) {
        console.log('- 网络工具测试失败可能是由于网络环境限制');
      }
    }
  }

  /**
   * 性能测试
   */
  async runPerformanceTest() {
    console.log('⚡ 运行性能测试...');

    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await this.server.executeToolSafely('add_numbers', { a: i, b: i + 1 });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`📊 性能测试结果:`);
    console.log(`   总时间: ${totalTime}ms`);
    console.log(`   平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`   每秒处理请求: ${(1000 / avgTime).toFixed(0)} 个`);
    
    return { totalTime, avgTime, throughput: 1000 / avgTime };
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EnhancedMCPTester();
  
  async function main() {
    try {
      await tester.runAllTests();
      
      // 可选：运行性能测试
      if (process.argv.includes('--performance')) {
        console.log('\n' + '='.repeat(60));
        await tester.runPerformanceTest();
      }
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    }
  }
  
  main();
}

export default EnhancedMCPTester;
