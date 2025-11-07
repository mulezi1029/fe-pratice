#!/usr/bin/env node

import MCPDemoServer from './server.js';

/**
 * MCP服务器测试文件
 * 用于测试各个工具的功能
 */
class MCPTester {
  constructor() {
    this.server = new MCPDemoServer();
    this.testResults = [];
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始MCP服务器工具测试\\n');

    await this.testAddNumbers();
    await this.testTextAnalysis();
    await this.testGenerateUUID();
    await this.testCurrentTime();

    this.printTestResults();
  }

  /**
   * 测试数字相加工具
   */
  async testAddNumbers() {
    console.log('📊 测试数字相加工具...');
    
    try {
      const result = await this.server.addNumbers({ a: 10, b: 20 });
      const success = result.content[0].text.includes('30');
      
      this.testResults.push({
        tool: 'add_numbers',
        success,
        message: success ? '✅ 测试通过' : '❌ 测试失败',
        result: result.content[0].text
      });
      
      console.log(`   ${success ? '✅' : '❌'} 10 + 20 = 30`);
    } catch (error) {
      this.testResults.push({
        tool: 'add_numbers',
        success: false,
        message: '❌ 测试失败',
        error: error.message
      });
      
      console.log(`   ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * 测试文本分析工具
   */
  async testTextAnalysis() {
    console.log('📝 测试文本分析工具...');
    
    try {
      const testText = 'Hello World\\nThis is a test.\\n\\nSecond paragraph.';
      const result = await this.server.analyzeText({ text: testText });
      const success = result.content[0].text.includes('字符数');
      
      this.testResults.push({
        tool: 'text_analysis',
        success,
        message: success ? '✅ 测试通过' : '❌ 测试失败',
        result: result.content[0].text
      });
      
      console.log(`   ${success ? '✅' : '❌'} 文本分析功能正常`);
      if (success) {
        console.log(`   分析结果包含字符数统计`);
      }
    } catch (error) {
      this.testResults.push({
        tool: 'text_analysis',
        success: false,
        message: '❌ 测试失败',
        error: error.message
      });
      
      console.log(`   ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * 测试UUID生成工具
   */
  async testGenerateUUID() {
    console.log('🔑 测试UUID生成工具...');
    
    try {
      const result = await this.server.generateUUID({});
      const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
      const success = uuidRegex.test(result.content[0].text);
      
      this.testResults.push({
        tool: 'generate_uuid',
        success,
        message: success ? '✅ 测试通过' : '❌ 测试失败',
        result: result.content[0].text
      });
      
      console.log(`   ${success ? '✅' : '❌'} UUID格式${success ? '正确' : '错误'}`);
      if (success) {
        const uuid = result.content[0].text.match(uuidRegex)[0];
        console.log(`   生成的UUID: ${uuid}`);
      }
    } catch (error) {
      this.testResults.push({
        tool: 'generate_uuid',
        success: false,
        message: '❌ 测试失败',
        error: error.message
      });
      
      console.log(`   ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }

  /**
   * 测试时间工具
   */
  async testCurrentTime() {
    console.log('⏰ 测试时间工具...');
    
    const formats = ['iso', 'timestamp', 'locale'];
    let allSuccess = true;
    
    for (const format of formats) {
      try {
        const result = await this.server.getCurrentTime({ format });
        const success = result.content[0].text.includes('当前时间');
        
        if (!success) allSuccess = false;
        
        console.log(`   ${success ? '✅' : '❌'} ${format}格式${success ? '正常' : '异常'}`);
        if (success) {
          console.log(`      ${result.content[0].text}`);
        }
      } catch (error) {
        allSuccess = false;
        console.log(`   ❌ ${format}格式错误: ${error.message}`);
      }
    }
    
    this.testResults.push({
      tool: 'current_time',
      success: allSuccess,
      message: allSuccess ? '✅ 测试通过' : '❌ 部分测试失败'
    });
    
    console.log('');
  }

  /**
   * 打印测试结果摘要
   */
  printTestResults() {
    console.log('📋 测试结果摘要\\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    this.testResults.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.tool.padEnd(15)} ${result.message}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 总计: ${successCount}/${totalCount} 个工具测试通过`);
    
    if (successCount === totalCount) {
      console.log('🎉 所有测试通过！MCP服务器工具运行正常。');
    } else {
      console.log('⚠️  部分测试失败，请检查相关工具实现。');
    }
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPTester();
  tester.runAllTests().catch(error => {
    console.error('❌ 运行测试时出错:', error);
    process.exit(1);
  });
}

export default MCPTester;
