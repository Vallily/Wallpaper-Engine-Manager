const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const unzipFeature = require('./experimental-features/unzip-feature'); // 引入新模块

const SETTINGS_PATH = path.join(__dirname, 'settings.json');
let runningProcesses = new Set();
let wallpaperCache = new Map(); // 全局壁纸缓存
let vfsData = null; // 全局VFS数据缓存

// --- Path Manager ---
const pathManager = {
  getWallpaperDir: () => {
    const settings = readSettings();
    if (settings.useCustomPath && settings.customPath) {
      return settings.customPath;
    }
    return path.join(__dirname, 'wallpapers');
  },
  getDbPath: () => {
    const settings = readSettings();
    if (settings.useCustomPath && settings.customPath) {
      return path.join(settings.customPath, 'wallpapers_db.json');
    }
    return path.join(__dirname, 'wallpapers_db.json');
  }
};

// --- Settings Helper Functions ---
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
      // Ensure defaults for new settings
      return {
        openInExplorerLimit: 5,
        useCustomPath: false,
        customPath: '',
        // UI State defaults
        viewMode: 'grid',
        sortOptions: { sortBy: 'title', sortOrder: 'asc' },
        filters: { type: ['scene', 'video', 'application', 'web'], rating: ['everyone', 'questionable', 'mature'] },
        autoHideAdultContent: false,
        vfsDisabled: false, // Add vfsDisabled setting
        // Experimental Features
        enableExperimentalDecompression: false,
        bandizipPath: '',
        cheatEnginePath: '',
        commonPaths: [],
        ...settings,
      };
    }
  } catch (err) {
    console.error("Error reading settings.json:", err);
  }
  // Default settings
  return {
    openInExplorerLimit: 5,
    useCustomPath: false,
    customPath: '',
    viewMode: 'grid',
    sortOptions: { sortBy: 'title', sortOrder: 'asc' },
    filters: { type: ['scene', 'video', 'application', 'web'], rating: ['everyone', 'questionable', 'mature'] },
    autoHideAdultContent: false,
    vfsDisabled: false, // Add vfsDisabled setting
    // Experimental Features
    enableExperimentalDecompression: false,
    bandizipPath: '',
    cheatEnginePath: '',
    commonPaths: [],
  };
}

function writeSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to settings.json:", err);
  }
}

// --- VFS DB Helper Functions ---
function readVfsDb() {
  const dbPath = pathManager.getDbPath();
  const initialDb = {
    vfs_tree: { name: "root", type: "folder", children: [] },
    wallpapers_meta: {}
  };

  try {
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, 'utf-8');
      if (fileContent.trim() === '') return initialDb;
      const data = JSON.parse(fileContent);
      if (data && data.vfs_tree && data.wallpapers_meta) return data;
    }
  } catch (err) {
    console.error(`Error reading or parsing ${dbPath}, returning initial structure. Error:`, err);
  }
  return initialDb;
}

function writeVfsDb() {
  const dbPath = pathManager.getDbPath();
  try {
    // Always write the global vfsData to disk
    fs.writeFileSync(dbPath, JSON.stringify(vfsData, null, 2));
  } catch (err) {
    console.error(`Error writing to ${dbPath}:`, err);
  }
}

// --- Helper function to get directory size ---
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        totalSize += await getDirectorySize(itemPath);
      } else {
        const stats = await fs.promises.stat(itemPath);
        totalSize += stats.size;
      }
    }
  } catch (err) {
    // Ignore errors for single files, e.g. permission denied
  }
  return totalSize;
}

// --- VFS Helper Functions ---
function findNodeByPath(tree, vpath) {
  if (vpath === './') return tree;
  const parts = vpath.split('/').filter(p => p && p !== '.');
  let currentNode = tree;
  for (const part of parts) {
    if (!currentNode || !currentNode.children) return null;
    const nextNode = currentNode.children.find(c => c.type === 'folder' && c.name === part);
    if (!nextNode) return null;
    currentNode = nextNode;
  }
  return currentNode;
}

function updateAllFolderSizes(node) {
  if (!node || node.type !== 'folder') {
    return 0;
  }

  let totalSize = 0;
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      if (child.type === 'folder') {
        // Recursively update size for child folders and add their size to the current folder
        totalSize += updateAllFolderSizes(child);
      } else {
        // Add size of wallpapers directly
        const wallpaper = wallpaperCache.get(child.id);
        if (wallpaper && wallpaper.size) {
          totalSize += wallpaper.size;
        }
      }
    }
  }
  
  // Assign the calculated size to the current folder node
  node.size = totalSize;
  return totalSize;
}

function removeNodeFromTree(node, wallpaperId) {
    if (!node.children) return false;

    const index = node.children.findIndex(child => child.id === wallpaperId);
    if (index !== -1) {
        node.children.splice(index, 1);
        return true;
    }

    for (const child of node.children) {
        if (child.type === 'folder' && removeNodeFromTree(child, wallpaperId)) {
            return true;
        }
    }

    return false;
}


// --- Wallpaper & VFS Scanning Logic (REFACTORED) ---
async function scanAndCacheWallpapers() {
  // console.log('Starting refactored wallpaper scan...');
  const wallpapersDir = pathManager.getWallpaperDir();
  // Load the DB into the global cache once
  if (!vfsData) {
    vfsData = readVfsDb();
  }
  const { vfs_tree, wallpapers_meta } = vfsData;

  const newCache = new Map();
  let dbChanged = false;

  // 1. Get all physical folder IDs
  let physicalFolderIds = new Set();
  try {
    const allFolders = await fs.promises.readdir(wallpapersDir, { withFileTypes: true });
    allFolders.forEach(folder => {
      if (folder.isDirectory()) {
        physicalFolderIds.add(folder.name);
      }
    });
  } catch (err) {
    console.error('Fatal: Could not read wallpapers directory:', err);
    // Return empty cache if the main directory is unreadable
    return newCache;
  }

  // 2. Clean up non-existent wallpapers from DB
  const allWallpaperIdsInMeta = Object.keys(wallpapers_meta);
  for (const wallpaperId of allWallpaperIdsInMeta) {
    if (!physicalFolderIds.has(wallpaperId)) {
      // console.log(`Cleanup: Removing non-existent wallpaper from DB: ${wallpaperId}`);
      delete wallpapers_meta[wallpaperId];
      removeNodeFromTree(vfs_tree, wallpaperId);
      dbChanged = true;
    }
  }

  // 3. Scan all physical folders and build the new cache
  for (const folderName of physicalFolderIds) {
    try {
      const folderPath = path.join(wallpapersDir, folderName);
      const stats = await fs.promises.stat(folderPath);
      const currentMtime = stats.mtimeMs;
      const cachedMeta = wallpapers_meta[folderName] || {};

      let projectData;
      try {
        const projectJsonPath = path.join(folderPath, 'project.json');
        const projectJsonContent = await fs.promises.readFile(projectJsonPath, 'utf-8');
        projectData = JSON.parse(projectJsonContent);
      } catch (projectErr) {
        console.error(`Error reading or parsing project.json for ${folderName}. Skipping.`, projectErr);
        continue; // Skip this folder if project.json is unreadable
      }

      let size;
      // Optimization: If mtime hasn't changed and size is stored, skip size calculation
      if (cachedMeta.mtime === currentMtime && cachedMeta.size !== undefined) {
        size = cachedMeta.size;
      } else {
        // console.log(`Change detected for ${folderName}, performing deep scan...`);
        size = await getDirectorySize(folderPath);
        // Update metadata for this wallpaper
        wallpapers_meta[folderName] = { ...cachedMeta, mtime: currentMtime, size: size };
        dbChanged = true;
      }
      
      const previewPath = path.join(folderPath, projectData.preview);
      let finalPreviewPath;
      let previewMissing = false;
      if (fs.existsSync(previewPath)) {
        finalPreviewPath = `file://${previewPath}`.replace(/\\/g, '/');
      } else {
        previewMissing = true;
        finalPreviewPath = `file://${path.join(__dirname, 'assets', '俺的图图呢.webp').replace(/\\/g, '/')}`;
      }
      
      const wallpaperInfo = {
        id: folderName,
        itemType: 'wallpaper',
        title: projectData.title || 'Untitled',
        type: (projectData.type || 'unknown').toLowerCase(),
        rating: projectData.contentrating || 'everyone',
        preview: finalPreviewPath,
        previewMissing,
        folderPath: folderPath,
        appPath: cachedMeta.appPath || null,
        dateAdded: stats.birthtimeMs,
        size: size,
      };

      if (wallpaperInfo.type === 'video' && projectData.file) {
        const videoPath = path.join(folderPath, projectData.file);
        wallpaperInfo.video = `file://${videoPath}`.replace(/\\/g, '/');
      }
      
      newCache.set(folderName, wallpaperInfo);

    } catch (err) {
      console.error(`Could not process folder ${folderName}. It will be skipped. Error:`, err);
    }
  }
  
  // 4. Auto-archive new wallpapers to the root of the VFS tree
  const getArchivedIds = (node) => {
    let ids = new Set();
    if (!node || !node.children) return ids;
    for (const child of node.children) {
      if (child.type === 'folder') {
        ids = new Set([...ids, ...getArchivedIds(child)]);
      } else {
        ids.add(child.id);
      }
    }
    return ids;
  };
  const archivedIds = getArchivedIds(vfs_tree);
  for (const wallpaperId of newCache.keys()) {
    if (!archivedIds.has(wallpaperId)) {
      // console.log(`Auto-archiving new wallpaper to root: ${wallpaperId}`);
      vfs_tree.children.push({
        id: wallpaperId,
        type: newCache.get(wallpaperId).type.toLowerCase()
      });
      dbChanged = true;
    }
  }

  // 5. Update all folder sizes based on the new cache
  updateAllFolderSizes(vfs_tree);

  // 6. Write back to DB if any changes were made
  if (dbChanged) {
    // console.log('Database has changed, writing updates to disk.');
    writeVfsDb();
  }

  console.log(`Wallpaper cache built. Found ${newCache.size} items.`);
  wallpaperCache = newCache; // Update the global cache directly
}

async function getItemsFromCache(event, currentVPath = "./") {
  const settings = readSettings();

  // If VFS is disabled, return a flat list of all cached wallpapers
  if (settings.vfsDisabled) {
    const flatList = [];
    for (const item of wallpaperCache.values()) {
        const itemCopy = { ...item };
        itemCopy.preview = `${itemCopy.preview}?t=${Date.now()}`;
        if (itemCopy.video) {
          itemCopy.video = `${itemCopy.video}?t=${Date.now()}`;
        }
        flatList.push(itemCopy);
    }
    return flatList;
  }

  // --- Original VFS logic ---
  if (!vfsData || !vfsData.vfs_tree) {
    console.error('[后端] getItemsFromCache: 错误! 全局 vfsData 或 vfs_tree 未初始化!');
    return [];
  }
  
  const { vfs_tree } = vfsData;
  updateAllFolderSizes(vfs_tree);

  const items = [];
  const currentNode = findNodeByPath(vfs_tree, currentVPath);

  if (!currentNode) {
    console.error(`[后端] getItemsFromCache: 找不到节点，虚拟路径: ${currentVPath}`);
    return [];
  }

  for (const childNode of currentNode.children) {
    if (childNode.type === 'folder') {
      items.push({
        id: `vfolder_${currentVPath}_${childNode.name}`,
        itemType: 'folder',
        title: childNode.name,
        vpath: path.posix.join(currentVPath, childNode.name, '/'),
        size: childNode.size || 0
      });
    } else {
      const wallpaperId = childNode.id;
      const cachedItem = wallpaperCache.get(wallpaperId);
      if (cachedItem) {
        const itemCopy = { ...cachedItem };
        itemCopy.preview = `${itemCopy.preview}?t=${Date.now()}`;
        if (itemCopy.video) {
          itemCopy.video = `${itemCopy.video}?t=${Date.now()}`;
        }
        items.push(itemCopy);
      } else {
        console.warn(`Item ${wallpaperId} found in VFS but not in cache. It might be a broken entry.`);
      }
    }
  }
  return items;
}


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenu(null);
  
  mainWindow.webContents.openDevTools();
  
  return mainWindow;
}

let mainWindow; // Make mainWindow accessible to IPC handlers

// --- IPC Handlers ---
ipcMain.handle('get-items', getItemsFromCache);

ipcMain.handle('refresh-wallpapers', async () => {
  try {
    await scanAndCacheWallpapers(); // This now handles cache update and size calculation
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', true);
    }
    return { success: true };
  } catch (error) {
    console.error("Refresh wallpapers failed:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', false);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-full-vfs-tree', () => {
  return vfsData ? vfsData.vfs_tree : null;
});

ipcMain.handle('get-all-metadata', () => {
  return vfsData ? vfsData.wallpapers_meta : {};
});

ipcMain.handle('get-settings', () => {
  return readSettings();
});

ipcMain.handle('save-settings', (event, settings) => {
  writeSettings(settings);
  return { success: true };
});

// 添加常用密码
ipcMain.handle('add-common-password', (event, password) => {
    const settings = readSettings();
    const MAX_PASSWORDS = 5;
    try {
        if (!password) {
            return { success: false, error: 'Password cannot be empty.' };
        }

        let passwords = settings.commonPasswords || [];

        // Remove existing instance to move it to the end (most recent)
        const existingIndex = passwords.indexOf(password);
        if (existingIndex > -1) {
            passwords.splice(existingIndex, 1);
        }

        // Add the new password to the end
        passwords.push(password);

        // Enforce the limit
        if (passwords.length > MAX_PASSWORDS) {
            passwords = passwords.slice(passwords.length - MAX_PASSWORDS);
        }

        settings.commonPasswords = passwords;
        writeSettings(settings);
        return { success: true, passwords: settings.commonPasswords };

    } catch (error) {
        console.error('Failed to add common password:', error);
        return { success: false, error: error.message };
    }
});

// 获取常用密码
ipcMain.handle('get-common-passwords', () => {
    const settings = readSettings();
    return settings.commonPasswords || [];
});

ipcMain.handle('clear-database', async () => {
  try {
    vfsData = {
      vfs_tree: { name: "root", type: "folder", children: [] },
      wallpapers_meta: {}
    };
    writeVfsDb(); // Write the cleared global state
    await scanAndCacheWallpapers(); // Rescan after clearing
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', true);
    }
    return { success: true };
  } catch (error) {
    console.error("Clear database failed:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', false);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-virtual-folder', (event, folderName, parentVPath) => {
  if (!folderName || folderName.includes('/') || folderName.includes('\\') || folderName.trim() === '.') {
    return { success: false, error: '无效的文件夹名称。' };
  }
  const parentNode = findNodeByPath(vfsData.vfs_tree, parentVPath);
  if (!parentNode) {
    return { success: false, error: '父文件夹不存在。' };
  }
  const alreadyExists = parentNode.children.some(c => c.type === 'folder' && c.name.toLowerCase() === folderName.toLowerCase());
  if (alreadyExists) {
    return { success: false, error: '该位置已存在同名文件夹。' };
  }
  const newFolder = {
    name: folderName,
    type: 'folder',
    children: [],
    size: 0 // Initialize with size 0
  };
  parentNode.children.push(newFolder);
  updateAllFolderSizes(vfsData.vfs_tree);
  writeVfsDb();
  return { success: true };
});

ipcMain.handle('move-item', async (event, itemIds, targetVPath) => {
  const { vfs_tree, wallpapers_meta } = vfsData;
  const idsToMove = Array.isArray(itemIds) ? itemIds : [itemIds];
  console.log('Moving items:', idsToMove, 'to', targetVPath);

  const targetNode = findNodeByPath(vfs_tree, targetVPath);
  if (!targetNode) {
    return { success: false, error: '目标文件夹不存在。' };
  }

  let movedCount = 0;
  for (const itemId of idsToMove) {
    // Check if the item is a virtual folder
    if (itemId.startsWith('vfolder_')) {
      const vpath = itemId.substring('vfolder_'.length).replace(/_/g, '/');
      const parentPath = path.posix.dirname(vpath.slice(0, -1)) + '/';
      const folderName = path.basename(vpath);
      
      const parentNode = findNodeByPath(vfs_tree, parentPath);
      if (!parentNode || !parentNode.children) continue;

      const folderIndex = parentNode.children.findIndex(c => c.type === 'folder' && c.name === folderName);
      if (folderIndex === -1) continue;

      // Check for illegal move (moving a folder into itself or its descendant)
      if (targetVPath.startsWith(vpath)) {
        return { success: false, error: '不能将文件夹移动到其自身或其子文件夹中。' };
      }

      const [folderToMove] = parentNode.children.splice(folderIndex, 1);
      targetNode.children.push(folderToMove);
      movedCount++;
    } else { // It's a wallpaper
      // Remove any existing instance of this wallpaper from the tree.
      removeNodeFromTree(vfs_tree, itemId);

      let itemType = wallpapers_meta[itemId]?.type;

      if (!itemType) {
        try {
          const projectJsonPath = path.join(pathManager.getWallpaperDir(), itemId, 'project.json');
          const projectJsonContent = await fs.promises.readFile(projectJsonPath, 'utf-8');
          const projectData = JSON.parse(projectJsonContent);
          itemType = (projectData.type || 'unknown').toLowerCase();
        } catch (err) {
          console.error(`Could not read project.json for ${itemId} during move:`, err);
          itemType = 'unknown';
        }
      }
      
      const newNode = { id: itemId, type: itemType };
      targetNode.children.push(newNode);
      
      if (!wallpapers_meta[itemId]) {
        wallpapers_meta[itemId] = {};
      }
      wallpapers_meta[itemId].type = itemType;

      movedCount++;
    }
  }

  updateAllFolderSizes(vfs_tree);
  writeVfsDb();
  console.log('Move complete, moved count:', movedCount);
  return { success: true, movedCount };
});

ipcMain.handle('open-in-workshop', (event, wallpaperId) => {
  if (wallpaperId && /^\d+$/.test(wallpaperId)) {
    const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${wallpaperId}`;
    shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid wallpaper ID for Workshop.' };
});

ipcMain.handle('delete-virtual-folder', (event, vpath) => {
  const parentPath = path.posix.dirname(vpath.slice(0, -1)) + '/';
  const folderName = path.basename(vpath);
  
  const parentNode = findNodeByPath(vfsData.vfs_tree, parentPath);
  if (!parentNode || !parentNode.children) {
      return { success: false, error: '找不到父文件夹。' };
  }

  const folderIndex = parentNode.children.findIndex(c => c.type === 'folder' && c.name === folderName);
  if (folderIndex === -1) {
      return { success: false, error: '找不到要删除的文件夹。' };
  }

  const folderToDelete = parentNode.children[folderIndex];
  if (folderToDelete.children && folderToDelete.children.length > 0) {
      return { success: false, error: '不能删除非空文件夹。' };
  }

  parentNode.children.splice(folderIndex, 1);
  updateAllFolderSizes(vfsData.vfs_tree);
  writeVfsDb();
  return { success: true };
});

ipcMain.handle('open-folder', (event, folderPath) => {
  // 根据用户要求，统一行为，总是直接打开文件夹
  shell.openPath(folderPath);
});

ipcMain.handle('delete-folder', async (event, folderPath, wallpaperId) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['移至回收站', '取消'],
    defaultId: 1,
    cancelId: 1, // 确保点击 'X' 等同于取消
    title: '确认删除',
    message: `你确定要将此壁纸移至回收站吗？`,
    detail: `路径: ${folderPath}`
  });

  if (result.response === 0) { // 仅当用户明确点击“移至回收站”
    try {
      await shell.trashItem(folderPath);
      if (vfsData.wallpapers_meta[wallpaperId]) {
        delete vfsData.wallpapers_meta[wallpaperId];
      }
      removeNodeFromTree(vfsData.vfs_tree, wallpaperId);
      writeVfsDb();
      return { success: true };
    } catch (err) {
      console.error(`Failed to move folder to trash ${folderPath}:`, err);
      dialog.showErrorBox('删除失败', `无法将文件移至回收站。\n错误: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
  return { success: false, cancelled: true };
});

ipcMain.handle('delete-multiple-folders', async (event, folderPaths, ids) => {
  let deletedCount = 0;
  try {
    for (const folderPath of folderPaths) {
      await shell.trashItem(folderPath);
      deletedCount++;
    }
    for (const id of ids) {
      if (vfsData.wallpapers_meta[id]) {
        delete vfsData.wallpapers_meta[id];
      }
      removeNodeFromTree(vfsData.vfs_tree, id);
    }
    writeVfsDb();
    return { success: true, deletedCount };
  } catch (error) {
    console.error(`批量删除文件夹失败:`, error);
    return { success: false, error: error.message, deletedCount };
  }
});

// 新增：处理将单个文件移动到回收站的请求
ipcMain.handle('delete-file-to-recycle-bin', async (event, filePath) => {
  try {
    await shell.trashItem(filePath);
    console.log(`Successfully moved to recycle bin: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to move file to recycle bin: ${filePath}`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-folder-contents', async (event, dirPath) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: path.join(dirPath, item.name)
    }));
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return [];
  }
});

ipcMain.handle('rename-file', async (event, { oldPath, newPath }) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    console.error(`Failed to rename file from ${oldPath} to ${newPath}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-app-path', (event, wallpaperId, relativeExePath, wallpaperType) => {
  if (!vfsData.wallpapers_meta[wallpaperId]) {
    vfsData.wallpapers_meta[wallpaperId] = {};
  }
  vfsData.wallpapers_meta[wallpaperId].appPath = relativeExePath;
  vfsData.wallpapers_meta[wallpaperId].type = wallpaperType; // Save the correct type

  // If item is not in tree, add it to root with the correct type
  let found = false;
  function findInTree(node) {
      if (node.children) {
          for(const child of node.children) {
              if (child.id === wallpaperId) {
                  found = true;
                  // Also update the type in the tree if it's wrong
                  if (child.type !== wallpaperType) {
                      child.type = wallpaperType;
                  }
                  return;
              }
              if (child.type === 'folder') findInTree(child);
              if (found) return;
          }
      }
  }
  findInTree(vfsData.vfs_tree);
  if (!found) {
      vfsData.vfs_tree.children.push({ id: wallpaperId, type: wallpaperType });
  }

  writeVfsDb();
  return { success: true };
});

ipcMain.handle('launch-app', (event, wallpaperId, fullExePath) => {
  try {
    const options = { cwd: path.dirname(fullExePath) };
    const appProcess = execFile(fullExePath, options, (error, stdout, stderr) => {
      if (error && !error.killed) {
        console.error(`execFile error: ${error}`);
        dialog.showErrorBox('启动失败', `无法启动应用程序。\n路径: ${fullExePath}\n错误: ${error.message}`);
      }
    });

    runningProcesses.add(wallpaperId);
    mainWindow.webContents.send('app-started', wallpaperId);

    appProcess.on('close', () => {
      runningProcesses.delete(wallpaperId);
      mainWindow.webContents.send('app-stopped', wallpaperId);
    });

    return { success: true };
  } catch (err) {
    console.error(`Failed to launch app ${fullExePath}:`, err);
    dialog.showErrorBox('启动失败', `无法启动应用程序。\n路径: ${fullExePath}\n错误: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-path-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null };
  }
  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('open-exe-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe', 'bat'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null };
  }
  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('validate-and-set-custom-path', async (event, customPath) => {
  try {
    if (!fs.existsSync(customPath)) {
      return { success: false, error: '路径不存在。' };
    }
    const items = await fs.promises.readdir(customPath, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        if (!/^\d+$/.test(item.name)) {
          return { success: false, error: `路径包含无效的文件夹名称: ${item.name} (只允许纯数字)。` };
        }
      } else if (item.name !== 'wallpapers_db.json') {
        return { success: false, error: `路径包含无效的文件: ${item.name} (只允许文件夹和 wallpapers_db.json)。` };
      }
    }

    const settings = readSettings();
    settings.useCustomPath = true;
    settings.customPath = customPath;
    writeSettings(settings);

    // CRITICAL: Reset caches to force a full reload from the new custom path
    vfsData = null;
    wallpaperCache = new Map();

    // Create DB if it doesn't exist
    const dbPath = path.join(customPath, 'wallpapers_db.json');
    if (!fs.existsSync(dbPath)) {
      const initialDb = {
        vfs_tree: { name: "root", type: "folder", children: [] },
        wallpapers_meta: {}
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
    }

    await scanAndCacheWallpapers(); // Rescan after setting new path
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', true);
    }
    return { success: true };
  } catch (err) {
    console.error('Error validating custom path:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', false);
    }
    return { success: false, error: `扫描路径时发生错误: ${err.message}` };
  }
});

ipcMain.handle('disable-custom-path', async () => {
  try {
    const settings = readSettings();
    settings.useCustomPath = false;
    settings.customPath = '';
    writeSettings(settings);

    console.log('Custom path disabled. Resetting cache and rescanning...');
    // CRITICAL: Reset caches to force a full reload from the default path
    vfsData = null;
    wallpaperCache = new Map();

    await scanAndCacheWallpapers();

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', true);
    }

    return { success: true };
  } catch (error) {
    console.error("Disable custom path failed:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-complete', false);
    }
    return { success: false, error: error.message };
  }
});

// 新的 IPC Handler，调用解耦后的模块
ipcMain.handle('decompress-archive', async (event, archivePath, password, deleteOriginal) => {
  const settings = readSettings();
  // 调用外部模块的函数，并传递所需的参数
  return await unzipFeature.decompress(settings.bandizipPath, archivePath, password, deleteOriginal);
});

ipcMain.handle('launch-tool', async (event, toolId) => {
  const settings = readSettings();
  if (toolId === 'cheat-engine') {
    const cePath = settings.cheatEnginePath;
    if (!cePath || !fs.existsSync(cePath)) {
      return { success: false, error: 'Cheat Engine 路径未设置或无效。请在设置中配置。' };
    }
    try {
      execFile(cePath, (error, stdout, stderr) => {
        if (error) {
          console.error(`execFile error for Cheat Engine: ${error}`);
          dialog.showErrorBox('启动失败', `无法启动 Cheat Engine。\n错误: ${error.message}`);
        }
      });
      return { success: true };
    } catch (err) {
      console.error(`Failed to launch Cheat Engine with path ${cePath}:`, err);
      dialog.showErrorBox('启动失败', `无法启动 Cheat Engine。\n路径: ${cePath}\n错误: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: '未知的工具ID。' };
});

ipcMain.handle('check-wallpapers-health', async () => {
  const wallpapersDir = pathManager.getWallpaperDir();
  const report = {
    missingProjectJson: [],
    invalidProjectJson: []
  };

  try {
    const allFolders = await fs.promises.readdir(wallpapersDir, { withFileTypes: true });
    for (const folder of allFolders) {
      if (folder.isDirectory()) {
        const folderPath = path.join(wallpapersDir, folder.name);
        const projectJsonPath = path.join(folderPath, 'project.json');

        if (!fs.existsSync(projectJsonPath)) {
          report.missingProjectJson.push({
            id: folder.name,
            path: folderPath,
            reason: '缺少 project.json 文件'
          });
          continue;
        }

        try {
          const content = await fs.promises.readFile(projectJsonPath, 'utf-8');
          const data = JSON.parse(content);
          if (!data.title || !data.type) {
            report.invalidProjectJson.push({
              id: folder.name,
              path: folderPath,
              reason: `缺少关键字段: ${!data.title ? 'title ' : ''}${!data.type ? 'type' : ''}`.trim()
            });
          }
        } catch (err) {
          report.invalidProjectJson.push({
            id: folder.name,
            path: folderPath,
            reason: `无法解析 project.json: ${err.message}`
          });
        }
      }
    }
    return { success: true, report };
  } catch (err) {
    console.error('Health check failed:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(async () => {
  mainWindow = createWindow();
  
  let isScanFinished = false;
  let isRendererReady = false;
  let scanSuccess = false;

  const sendScanComplete = () => {
    if (isScanFinished && isRendererReady && mainWindow && !mainWindow.isDestroyed()) {
      console.log(`[后端] 扫描和渲染器都已就绪，发送 "scan-complete" 事件，成功状态: ${scanSuccess}`);
      mainWindow.webContents.send('scan-complete', scanSuccess);
    } else {
      console.log(`[后端] 状态检查: isScanFinished=${isScanFinished}, isRendererReady=${isRendererReady}`);
    }
  };

  ipcMain.on('renderer-ready', () => {
    console.log('[后端] 收到 "renderer-ready" 事件。');
    isRendererReady = true;
    sendScanComplete();
  });
  
  // Start the scan but don't block the window creation
  console.log('[后端] App Ready: 准备开始首次扫描...');
  scanAndCacheWallpapers()
    .then(() => {
      console.log('[后端] 首次扫描成功完成，全局缓存已更新。');
      scanSuccess = true;
    })
    .catch((err) => {
      console.error('[后端] 首次扫描失败:', err);
      scanSuccess = false;
    })
    .finally(() => {
      isScanFinished = true;
      sendScanComplete();
    });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
