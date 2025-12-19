chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展程序已安装，设置初始状态为OFF');
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

chrome.action.onClicked.addListener(async (tab) => {
  console.log(`用户点击扩展图标，当前标签页: ${tab.url}`);
  
  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
    console.log('检测到支持的网站，开始处理');
    
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';
    
    console.log(`状态切换: ${prevState} -> ${nextState}`);

    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
    
    if (nextState === "ON") {
      console.log('开始注入CSS和JavaScript内容脚本');
      
      // 编程式注入CSS
      try {
        await chrome.scripting.insertCSS({
          files: ["focus.css"],
          target: { tabId: tab.id },
        });
        console.log('CSS注入成功');
      } catch (error) {
        console.error('CSS注入失败:', error);
      }
      
      // 编程式注入JavaScript内容脚本
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        console.log('JavaScript内容脚本注入成功');
      } catch (error) {
        console.error('JavaScript内容脚本注入失败:', error);
      }
      
    } else if (nextState === "OFF") {
      console.log('开始清理已注入的内容');
      
      // 移除CSS
      try {
        await chrome.scripting.removeCSS({
          files: ["focus.css"],
          target: { tabId: tab.id },
        });
        console.log('CSS移除成功');
      } catch (error) {
        console.error('CSS移除失败:', error);
      }
      
      // 注入清理代码
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log('开始清理页面上的阅读时间元素');
            
            // 清理已添加的元素
            const badges = document.querySelectorAll('.color-secondary-text.type--caption');
            console.log(`找到 ${badges.length} 个阅读时间元素需要清理`);
            badges.forEach(badge => badge.remove());
            
            // 停止MutationObserver
            if (window.readingTimeObserver) {
              window.readingTimeObserver.disconnect();
              delete window.readingTimeObserver;
              console.log('MutationObserver已停止');
            }
            
            // 重置注入标记
            delete window.readingTimeInjected;
            console.log('清理完成，注入标记已重置');
          }
        });
        console.log('清理脚本注入成功');
      } catch (error) {
        console.error('清理脚本注入失败:', error);
      }
    }
    
    console.log('处理完成');
  } else {
    console.log('当前网站不支持，跳过处理');
  }
});