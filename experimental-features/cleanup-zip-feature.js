const { ipcRenderer } = require('electron');
const { showFileBrowser } = require('../components/LocalFileBrowser');
const { showModal } = require('../components/mainPage');

// 定义允许的文件扩展名
const ALLOWED_EXTENSIONS = ['.zip', '.7z', '.rar', '.001', '.002', '.003', '.004', '.005', '.006', '.007', '.008', '.009', '.010'];

/**
 * 初始化清理ZIP文件的功能
 * @param {string} projectPath - 当前操作的项目路径
 */
async function initCleanupZipFeature(projectPath) {
  console.log(`[清理ZIP功能] 功能启动，操作的项目路径: ${projectPath}`);
  try {
    const selectedFile = await showFileBrowser({
      title: '选择要清理的压缩文件',
      buttonLabel: '删除此文件',
      fileFilter: (file) => ALLOWED_EXTENSIONS.includes(file.extension.toLowerCase()),
      showOnlySelectable: true
    });

    if (selectedFile) {
      console.log(`[清理ZIP功能] 用户已选择文件: ${selectedFile}`);
      // 弹出确认对话框
      const confirmed = await showModal({
        title: '确认删除',
        message: `您确定要将以下文件移动到回收站吗？\n\n${selectedFile}`,
        confirmText: '确认删除',
        cancelText: '取消'
      });

      if (confirmed) {
        console.log(`[清理ZIP功能] 用户已确认删除，正在调用后端接口...`);
        // 调用主进程将文件移动到回收站
        ipcRenderer.invoke('delete-file-to-recycle-bin', selectedFile)
          .then(result => {
            if (result.success) {
              console.log(`[清理ZIP功能] 后端报告成功: 文件已移至回收站: ${selectedFile}`);
              showModal({ title: '操作成功', message: `文件已成功移至回收站。` });
            } else {
              console.error(`[清理ZIP功能] 后端报告错误: ${result.error}`);
              showModal({ title: '操作失败', message: `无法将文件移至回收站：\n${result.error}` });
            }
          });
      } else {
        console.log('[清理ZIP功能] 用户取消了删除操作。');
      }
    } else {
      console.log('[清理ZIP功能] 用户关闭了文件选择器，未选择任何文件。');
    }
  } catch (error) {
    if (error.message !== 'File browser was closed by the user.') {
      console.error('[清理ZIP功能] 执行过程中捕获到意外错误:', error);
      showModal({ title: '发生错误', message: `执行清理操作时出错：\n${error.message}` });
    } else {
      console.log('[清理ZIP功能] 文件浏览器被用户关闭。');
    }
  }
}

module.exports = { initCleanupZipFeature };
