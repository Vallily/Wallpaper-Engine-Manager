const { ipcRenderer } = require('electron');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { WallpaperGrid, WallpaperList } = require('./components/mainPage.js');
const { searchWallpapers } = require('./experimental-features/search.js');
const { LocalFileBrowser } = require('./components/LocalFileBrowser.js');

// --- 数据 ---
const ALL_TYPES = ['scene', 'video', 'application', 'web'];
const ALL_RATINGS = ['everyone', 'questionable', 'mature'];
let notificationIdCounter = 0;

// --- 组件 ---

// Helper function to find a node in the VFS tree, ensuring client-side navigation
const findNodeByVfsPath = (tree, vpath) => {
  if (!tree) return null;
  // Handle root case
  if (vpath === './' || vpath === '/') return tree;
  // Normalize path and split into parts
  const parts = vpath.replace(/^\.\//, '').replace(/\/$/, '').split('/').filter(Boolean);
  let currentNode = tree;
  for (const part of parts) {
    if (!part) continue;
    if (!currentNode || !currentNode.children) return null;
    const nextNode = currentNode.children.find(c => c.type === 'folder' && c.name === part);
    if (!nextNode) return null;
    currentNode = nextNode;
  }
  return currentNode;
};

const VirtualFolderBrowser = ({ itemToMove, onMoveConfirm, onCancel }) => {
  const [currentVPath, setCurrentVPath] = React.useState('./');
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [vfsTree, setVfsTree] = React.useState(null); // State for the full tree

  // Effect to load the full VFS tree once on mount
  React.useEffect(() => {
    setLoading(true);
    ipcRenderer.invoke('get-full-vfs-tree').then(tree => {
      setVfsTree(tree);
    }).catch(err => {
      console.error("Failed to load full VFS tree:", err);
      setVfsTree(null);
      setLoading(false);
    });
  }, []);

  // Effect to update displayed items when path or tree changes
  React.useEffect(() => {
    if (!vfsTree) return; // Wait for the tree to be loaded

    const currentNode = findNodeByVfsPath(vfsTree, currentVPath);
    let displayItems = [];

    if (currentNode && currentNode.children) {
      displayItems = currentNode.children
        .filter(child => child.type === 'folder')
        .map(child => ({
          id: `vfolder_${currentVPath}_${child.name}`,
          itemType: 'folder',
          title: child.name,
          vpath: (currentVPath === './' ? './' : currentVPath) + child.name + '/',
          size: child.size || 0
        }));
    }
    
    // Filter out the item being moved
    const filteredData = displayItems.filter(i => {
        if (itemToMove.itemType === 'folder') {
            return i.vpath !== itemToMove.vpath;
        }
        return true;
    });

    setItems(filteredData);
    setLoading(false);
  }, [currentVPath, vfsTree, itemToMove]);

  const handleFolderClick = (folder) => {
    setCurrentVPath(folder.vpath);
  };

  const handleMoveHere = () => {
    onMoveConfirm(currentVPath);
  };
  
  const pathParts = currentVPath.replace(/^\.\/|\/$/g, '').split('/').filter(p => p);
  const handlePathClick = (index) => {
    const newPath = './' + pathParts.slice(0, index + 1).join('/') + '/';
    setCurrentVPath(newPath);
  };
  const handleGoBack = () => {
    if (currentVPath === './') return;
    const parentPath = currentVPath.slice(0, -1).substring(0, currentVPath.slice(0, -1).lastIndexOf('/') + 1);
    setCurrentVPath(parentPath || './');
  };

  // Prevent moving a folder into itself or its children
  const isMoveDisabled = itemToMove.itemType === 'folder' && currentVPath.startsWith(itemToMove.vpath);

  return React.createElement('div', { className: 'file-browser' },
    React.createElement('div', { className: 'file-browser-header' },
      React.createElement('h2', null, `移动 "${itemToMove.title}"`),
      React.createElement('div', { style: { display: 'flex', gap: '10px' } },
        React.createElement('button', { onClick: handleMoveHere, disabled: isMoveDisabled, className: 'move-here-btn' }, '移动到这里'),
        React.createElement('button', { onClick: onCancel, className: 'modal-btn-cancel' }, '取消')
      )
    ),
    React.createElement('div', { className: 'file-browser-nav' },
       React.createElement('button', { onClick: handleGoBack, disabled: currentVPath === './' }, '↑'),
       React.createElement('div', { className: 'breadcrumbs' },
        React.createElement('span', { onClick: () => setCurrentVPath('./'), className: 'breadcrumb-part' }, '根目录'),
        pathParts.map((part, index) =>
          React.createElement(React.Fragment, { key: index },
            React.createElement('span', { className: 'breadcrumb-separator' }, '/'),
            React.createElement('span', { onClick: () => handlePathClick(index), className: 'breadcrumb-part' }, part)
          )
        )
      )
    ),
    React.createElement(WallpaperGrid, {
      items: items,
      onFolderClick: handleFolderClick,
      onWallpaperClick: () => {}, // No-op in browser mode
      onContextMenu: () => {}, // No-op in browser mode
      runningApps: new Set(),
      selectedItems: new Set(),
      isBrowserMode: true // Explicitly tell the grid to only show folders
    })
  );
};

const NewFolderModal = ({ onConfirm, onCancel }) => {
  const [folderName, setFolderName] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleConfirm = () => {
    if (folderName.trim()) {
      onConfirm(folderName.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('h2', null, '新建文件夹'),
      React.createElement('p', null, '请输入新文件夹的名称:'),
      React.createElement('input', {
        ref: inputRef,
        type: 'text',
        value: folderName,
        onChange: (e) => setFolderName(e.target.value),
        onKeyDown: handleKeyDown,
        className: 'modal-input'
      }),
      React.createElement('div', { className: 'modal-actions' },
        React.createElement('button', { onClick: onCancel, className: 'modal-btn-cancel' }, '取消'),
        React.createElement('button', { onClick: handleConfirm, className: 'modal-btn-confirm' }, '创建')
      )
    )
  );
};

const ViewModeSwitcher = ({ viewMode, onViewModeChange }) => {
  return React.createElement('div', { className: 'view-mode-switcher' },
    React.createElement('button', { className: `view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`, onClick: () => onViewModeChange('grid') }, '网格'),
    React.createElement('button', { className: `view-mode-btn ${viewMode === 'list' ? 'active' : ''}`, onClick: () => onViewModeChange('list') }, '列表')
  );
};

const Header = ({ currentVPath, onNavigate, onNewFolder, viewMode, onViewModeChange, onSelectAll, onDeselectAll, numItems, numSelected, isSearchModeActive, onSearchToggle, searchQuery, onSearchQueryChange }) => {
  const pathParts = currentVPath.replace(/^\.\/|\/$/g, '').split('/').filter(p => p);

  const handlePathClick = (index) => {
    const newPath = './' + pathParts.slice(0, index + 1).join('/') + '/';
    onNavigate(newPath);
  };

  const handleGoBack = () => {
    if (currentVPath === './') return;
    const parentPath = currentVPath.slice(0, -1).substring(0, currentVPath.slice(0, -1).lastIndexOf('/') + 1);
    onNavigate(parentPath || './');
  };

  const headerClassName = `header ${isSearchModeActive ? 'search-active' : ''}`;

  return React.createElement('div', { className: headerClassName },
    !isSearchModeActive && React.createElement('div', { className: 'header-nav' },
      React.createElement('button', { onClick: handleGoBack, disabled: currentVPath === './' }, '↑'),
      React.createElement('div', { className: 'breadcrumbs' },
        React.createElement('span', { onClick: () => onNavigate('./'), className: 'breadcrumb-part' }, '根目录'),
        pathParts.map((part, index) =>
          React.createElement(React.Fragment, { key: index },
            React.createElement('span', { className: 'breadcrumb-separator' }, '/'),
            React.createElement('span', { onClick: () => handlePathClick(index), className: 'breadcrumb-part' }, part)
          )
        )
      )
    ),
    React.createElement('div', { className: 'header-actions' },
      !isSearchModeActive && React.createElement(React.Fragment, null,
        React.createElement('button', {
          onClick: numSelected === numItems ? onDeselectAll : onSelectAll,
          className: 'select-all-btn',
          disabled: numItems === 0
        }, numSelected === numItems ? '取消全选' : '全选'),
      ),
      React.createElement('button', { className: 'search-btn', onClick: onSearchToggle }, '🔍'),
      isSearchModeActive && React.createElement('input', {
        type: 'text',
        className: 'search-input',
        placeholder: '搜索...',
        value: searchQuery,
        onChange: (e) => onSearchQueryChange(e.target.value),
        autoFocus: true
      }),
      !isSearchModeActive && React.createElement(ViewModeSwitcher, { viewMode, onViewModeChange }),
      !isSearchModeActive && React.createElement('button', { onClick: onNewFolder, className: 'new-folder-btn' }, '新建文件夹')
    )
  );
};


const DecompressionModal = ({ file, onConfirm, onCancel, commonPasswords, lastUsedPassword }) => {
  const [password, setPassword] = React.useState(lastUsedPassword || '');
  const [deleteOriginal, setDeleteOriginal] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    // Add event listener to handle clicks outside the component
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleConfirm = () => {
    onConfirm(file.path, password, deleteOriginal);
  };

  const handleSuggestionClick = (suggestedPassword) => {
    setPassword(suggestedPassword);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.blur(); // Change focus() to blur()
    }
  };

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('h2', null, '确认解压'),
      React.createElement('p', null, `你确定要将文件 "${file.name}" 解压到当前目录吗？`),
      
      React.createElement('div', { className: 'setting-item-column' },
        React.createElement('label', { htmlFor: 'decompression-password' }, '密码:'),
        React.createElement('div', { className: 'password-input-container', ref: wrapperRef },
          React.createElement('input', {
            ref: inputRef,
            id: 'decompression-password',
            className: 'password-input-beautified',
            type: 'text',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            onFocus: () => setShowSuggestions(true),
            onKeyDown: (e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            },
            placeholder: '输入密码或从建议中选择'
          }),
          React.createElement('div', { 
            className: `password-suggestions ${showSuggestions && commonPasswords && commonPasswords.length > 0 ? 'visible' : ''}` 
          },
            [...(commonPasswords || [])].reverse().map(p => 
              React.createElement('div', { 
                key: p, 
                className: 'suggestion-item',
                onClick: () => handleSuggestionClick(p)
              }, p)
            )
          )
        )
      ),

      React.createElement('div', { className: 'setting-item' },
        React.createElement('label', { htmlFor: 'delete-original-archive' }, '解压后删除源文件'),
        React.createElement('input', {
          id: 'delete-original-archive',
          type: 'checkbox',
          checked: deleteOriginal,
          onChange: (e) => setDeleteOriginal(e.target.checked)
        })
      ),
      deleteOriginal && React.createElement('p', { className: 'settings-warning' }, '警告：源文件将被移动到系统回收站。'),
      React.createElement('div', { className: 'modal-actions' },
        React.createElement('button', { onClick: onCancel, className: 'modal-btn-cancel' }, '取消'),
        React.createElement('button', { onClick: handleConfirm, className: 'modal-btn-confirm' }, '确认解压')
      )
    )
  );
};


const ContextMenu = ({ menu, onAction, selectedItems, settings }) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0, opacity: 0 });
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (menu && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const { innerWidth, innerHeight } = window;
      const { x, y } = menu;

      let newX = x;
      let newY = y;

      // Adjust horizontally
      if (x + menuWidth > innerWidth) {
        newX = innerWidth - menuWidth - 5; // 5px buffer
      }

      // Adjust vertically
      if (y + menuHeight > innerHeight) {
        newY = innerHeight - menuHeight - 5; // 5px buffer
      }
      
      // Ensure it's not off-screen top/left
      if (newX < 0) newX = 5;
      if (newY < 0) newY = 5;

      setPosition({ top: newY, left: newX, opacity: 1 });
    }
  }, [menu]);

  if (!menu) return null;

  const { item, isMultiSelect } = menu;
  const menuStyle = { top: `${position.top}px`, left: `${position.left}px`, opacity: position.opacity };

  // A helper component for menu items to standardize them.
  const MenuItem = ({ iconClass, text, onClick, className = '', disabled = false }) => {
    const fullClassName = `context-menu-item ${className} ${disabled ? 'disabled' : ''}`;
    // The icon is now an empty span with a specific class for the SVG mask
    return React.createElement('div', { className: fullClassName, onClick: disabled ? null : onClick },
      React.createElement('span', { className: `menu-item-icon ${iconClass || ''}` }),
      React.createElement('span', { className: 'menu-item-text' }, text)
    );
  };
  
  const MenuSeparator = () => React.createElement('hr', { className: 'context-menu-separator' });

  if (isMultiSelect && selectedItems.size > 1) {
    const openInExplorerEnabled = selectedItems.size <= (settings?.openInExplorerLimit || 5);
    return React.createElement('div', { ref: menuRef, style: menuStyle, className: 'context-menu' },
      React.createElement('div', { className: 'context-menu-header' }, `已选择 ${selectedItems.size} 个项目`),
      React.createElement(MenuSeparator),
      React.createElement(MenuItem, { iconClass: 'icon-move-to', text: '移动...', onClick: () => onAction('move-multiple') }),
      React.createElement(MenuItem, { 
        iconClass: 'icon-show-in-explorer', 
        text: `在资源管理器中显示 (${selectedItems.size})`, 
        onClick: () => onAction('open-multiple'),
        disabled: !openInExplorerEnabled
      }),
      React.createElement(MenuItem, { iconClass: 'icon-delete', text: '删除...', onClick: () => onAction('delete-multiple'), className: 'danger' })
    );
  }

  if (item.itemType === 'folder') {
    return React.createElement('div', { ref: menuRef, style: menuStyle, className: 'context-menu' },
      React.createElement(MenuItem, { iconClass: 'icon-move-to', text: '移动...', onClick: () => onAction('move-folder') }),
      React.createElement(MenuItem, { iconClass: 'icon-delete', text: '删除...', onClick: () => onAction('delete-folder'), className: 'danger' })
    );
  }

  // Single wallpaper context menu
  const showDecompressOption = item.type && item.type.toLowerCase() === 'application';

  const handleDecompressClick = () => {
    if (!settings.bandizipPath) {
      // 指向正确的设置位置
      onAction('show-notification', '错误：请先在“设置”>“常规”中配置 Bandizip 的路径。');
      return;
    }
    onAction('decompress');
  };

  return React.createElement('div', { ref: menuRef, style: menuStyle, className: 'context-menu' },
    item.type && item.type.toLowerCase() === 'application'
      ? React.createElement(MenuItem, { iconClass: 'icon-set-wallpaper', text: '定位可执行文件...', onClick: () => onAction('locate') })
      : React.createElement(MenuItem, { iconClass: 'icon-open', text: '预览', onClick: () => onAction('preview') }),
    React.createElement(MenuSeparator),
    React.createElement(MenuItem, { iconClass: 'icon-move-to', text: '移动到...', onClick: () => onAction('move-wallpaper') }),
    React.createElement(MenuItem, { iconClass: 'icon-show-in-explorer', text: '在资源管理器中显示', onClick: () => onAction('open') }),
    /^\d+$/.test(item.id) && React.createElement(MenuItem, {
        iconClass: 'icon-steam',
        text: '在创意工坊中浏览',
        onClick: () => onAction('open-in-workshop')
    }),
    React.createElement(MenuSeparator),
    // 移除实验性标志和文本
    showDecompressOption && React.createElement(MenuItem, { iconClass: 'icon-unzip', text: '浏览并解压...', onClick: handleDecompressClick }),
    React.createElement(MenuItem, { iconClass: 'icon-delete', text: '清理ZIP文件', onClick: () => onAction('cleanup-zip') }),
    React.createElement(MenuSeparator),
    React.createElement(MenuItem, { iconClass: 'icon-delete', text: '移至回收站...', onClick: () => onAction('delete'), className: 'danger' })
  );
};

const NotificationContainer = ({ notifications }) => {
  return React.createElement('div', { className: 'notification-container' },
    notifications.map(note => React.createElement('div', { key: note.id, className: 'notification' }, note.message))
  );
};

const VideoPlayer = ({ videoSrc, onClose }) => {
  if (!videoSrc) return null;
  return React.createElement('div', { className: 'video-player-overlay', onClick: onClose },
    React.createElement('video', { src: videoSrc, controls: true, autoPlay: true, onClick: (e) => e.stopPropagation() })
  );
};

const FilterGroup = ({ title, items, selectedItems, onFilterChange }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  return React.createElement('div', { className: 'filter-group' },
    React.createElement('h3', { onClick: () => setIsOpen(!isOpen), className: 'filter-title' }, (isOpen ? '▼ ' : '► ') + title),
    isOpen && React.createElement('div', { className: 'filter-options' },
      items.map(item =>
        React.createElement('label', { key: item, className: 'filter-label' },
          React.createElement('input', { type: 'checkbox', checked: selectedItems.includes(item), onChange: () => onFilterChange(item) }),
          item
        )
      )
    )
  );
};

const SortOptions = ({ sortBy, sortOrder, onSortChange }) => {
  return React.createElement('div', { className: 'sort-options filter-group' },
    React.createElement('h3', { className: 'filter-title' }, '排序方式'),
    React.createElement('div', { className: 'sort-by-group' },
      React.createElement('label', null,
        React.createElement('input', { type: 'radio', name: 'sort-by', value: 'title', checked: sortBy === 'title', onChange: (e) => onSortChange('sortBy', e.target.value) }),
        '名称'
      ),
      React.createElement('label', null,
        React.createElement('input', { type: 'radio', name: 'sort-by', value: 'dateAdded', checked: sortBy === 'dateAdded', onChange: (e) => onSortChange('sortBy', e.target.value) }),
        '加入时间'
      ),
      React.createElement('label', null,
        React.createElement('input', { type: 'radio', name: 'sort-by', value: 'size', checked: sortBy === 'size', onChange: (e) => onSortChange('sortBy', e.target.value) }),
        '大小'
      )
    ),
    React.createElement('div', { className: 'sort-order-group' },
      React.createElement('button', { className: `sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`, onClick: () => onSortChange('sortOrder', 'asc') }, '↑ 升序'),
      React.createElement('button', { className: `sort-order-btn ${sortOrder === 'desc' ? 'active' : ''}`, onClick: () => onSortChange('sortOrder', 'desc') }, '↓ 降序')
    )
  );
};

const Sidebar = ({ 
  filters, onFilterChange, 
  sortOptions, onSortChange,
  onRefresh, onNavigateToSettings, isActionInProgress
}) => {
  return React.createElement('div', { className: 'sidebar' },
    React.createElement('div', { className: 'sidebar-main-controls' },
      React.createElement('h2', null, '浏览选项'),
      React.createElement('button', { className: 'refresh-btn', onClick: onRefresh }, '刷新')
    ),
    React.createElement('div', { className: 'filter-groups' },
      React.createElement(SortOptions, { sortBy: sortOptions.sortBy, sortOrder: sortOptions.sortOrder, onSortChange }),
      React.createElement(FilterGroup, { title: '筛选 - 类型', items: ALL_TYPES, selectedItems: filters.type, onFilterChange: (type) => onFilterChange('type', type) }),
      React.createElement(FilterGroup, { title: '筛选 - 年龄分级', items: ALL_RATINGS, selectedItems: filters.rating, onFilterChange: (rating) => onFilterChange('rating', rating) })
    ),
    React.createElement('div', { className: 'sidebar-footer' },
      React.createElement('button', { 
        className: 'settings-btn', 
        onClick: onNavigateToSettings,
        disabled: isActionInProgress
      }, '⚙️ 设置')
    )
  );
};



// 新的“常用工具”设置组件
const CommonToolsSettings = ({ settings, onSettingsChange, showNotification }) => {
  const handleBandizipPathChange = (e) => {
    onSettingsChange({ ...settings, bandizipPath: e.target.value });
  };

  const handleBandizipBrowse = async () => {
    const result = await ipcRenderer.invoke('open-exe-dialog');
    if (result.success) {
      onSettingsChange({ ...settings, bandizipPath: result.path });
      showNotification('Bandizip 路径已更新。');
    }
  };

  const handleCheatEnginePathChange = (e) => {
    onSettingsChange({ ...settings, cheatEnginePath: e.target.value });
  };

  const handleCheatEngineBrowse = async () => {
    const result = await ipcRenderer.invoke('open-exe-dialog');
    if (result.success) {
      onSettingsChange({ ...settings, cheatEnginePath: result.path });
      showNotification('Cheat Engine 路径已更新。');
    }
  };
  
  const handleLaunchCheatEngine = () => {
    showNotification('正在尝试启动 Cheat Engine...');
    ipcRenderer.invoke('launch-tool', 'cheat-engine').then(result => {
      if (!result.success) {
        showNotification(result.error, true);
      }
    });
  };

  return React.createElement('div', { className: 'common-tools-settings' },
    React.createElement('h3', null, '常用工具'),
    // Bandizip Section
    React.createElement('div', { className: 'setting-item-column' },
      React.createElement('label', { htmlFor: 'bandizip-path' }, 'Bandizip (bz.exe) 路径:'),
      React.createElement('div', { className: 'custom-path-controls' },
        React.createElement('input', {
          id: 'bandizip-path',
          type: 'text',
          value: settings.bandizipPath || '',
          onChange: handleBandizipPathChange,
          placeholder: '例如 C:\\Program Files\\Bandizip\\bz.exe',
          style: { flexGrow: 1 }
        }),
        React.createElement('button', { onClick: handleBandizipBrowse }, '浏览...')
      )
    ),
    // Cheat Engine Section
    React.createElement('div', { className: 'setting-item-column' },
      React.createElement('label', { htmlFor: 'cheat-engine-path' }, 'Cheat Engine 路径:'),
      React.createElement('div', { className: 'custom-path-controls' },
        React.createElement('input', {
          id: 'cheat-engine-path',
          type: 'text',
          value: settings.cheatEnginePath || '',
          onChange: handleCheatEnginePathChange,
          placeholder: '例如 C:\\Program Files\\Cheat Engine\\Cheat Engine.exe',
          style: { flexGrow: 1 }
        }),
        React.createElement('button', { onClick: handleCheatEngineBrowse }, '浏览...'),
        React.createElement('button', { onClick: handleLaunchCheatEngine }, '启动 Cheat Engine')
      )
    )
  );
};

const DebugView = ({ settings, onSettingsChange, showNotification, onDatabaseCleared }) => {
  const handleClearDatabase = () => {
    const isConfirmed = window.confirm('你确定要清空并初始化整个数据库吗？此操作不可逆！');
    if (isConfirmed) {
      ipcRenderer.invoke('clear-database').then(result => {
        if (result.success) {
          showNotification('数据库已成功清除和初始化。');
          onDatabaseCleared();
        } else {
          showNotification('数据库清除失败。');
        }
      });
    }
  };

  return React.createElement('div', { className: 'settings-section' }, // Use a more generic class
    React.createElement('h3', null, '调试工具'),
    
    React.createElement('h4', { style: { marginTop: '20px' } }, '重置数据库'),
    React.createElement('p', null, '将数据库重置为初始状态。所有虚拟文件夹和元数据都将被删除。'),
    React.createElement('button', { className: 'debug-btn danger', onClick: handleClearDatabase }, '清空并初始化数据库')
  );
};

const HealthCheckView = ({ showNotification }) => {
  const [report, setReport] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleStartCheck = async () => {
    setIsLoading(true);
    setReport(null);
    const result = await ipcRenderer.invoke('check-wallpapers-health');
    setIsLoading(false);
    if (result.success) {
      setReport(result.report);
      const totalIssues = result.report.missingProjectJson.length + result.report.invalidProjectJson.length;
       showNotification(`检查完成，发现 ${totalIssues} 个问题。`);
    } else {
      showNotification(`健康检查失败: ${result.error}`, true);
    }
  };

  const handleOpenFolder = (folderPath) => {
    ipcRenderer.invoke('open-folder', folderPath);
  };

  const ReportSection = ({ title, items }) => {
    if (items.length === 0) return null;
    return React.createElement('div', { className: 'report-section' },
      React.createElement('h4', null, `${title} (${items.length})`),
      React.createElement('ul', { className: 'report-list' },
        items.map(item =>
          React.createElement('li', { key: item.id, className: 'report-item' },
            React.createElement('div', { className: 'report-item-info' },
              React.createElement('strong', null, `ID: ${item.id}`),
              React.createElement('span', null, ` - ${item.reason}`)
            ),
            React.createElement('button', { onClick: () => handleOpenFolder(item.path) }, '打开文件夹')
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'health-check-view' },
    React.createElement('h3', null, '壁纸库健康检查'),
    React.createElement('p', null, '此工具将扫描您的壁纸库文件夹，以查找格式不正确或丢失的元数据文件。'),
    React.createElement('button', { onClick: handleStartCheck, disabled: isLoading },
      isLoading ? '正在检查...' : '开始检查'
    ),
    isLoading && React.createElement('p', null, '正在扫描，请稍候...'),
    report && React.createElement('div', { className: 'health-report' },
      (report.missingProjectJson.length === 0 && report.invalidProjectJson.length === 0)
        ? React.createElement('p', { className: 'report-success' }, '恭喜！未发现任何问题。')
        : React.createElement(React.Fragment, null,
            React.createElement(ReportSection, { title: '缺少 project.json 的文件夹', items: report.missingProjectJson }),
            React.createElement(ReportSection, { title: '无效的 project.json 文件', items: report.invalidProjectJson })
          )
    )
  );
};

const PathSettings = ({ settings, onSettingsChange, showNotification }) => {
  const [customPath, setCustomPath] = React.useState(settings.customPath || '');
  const [useCustom, setUseCustom] = React.useState(settings.useCustomPath || false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Use settings.commonPaths directly, defaulting to an empty array
  const commonPaths = settings.commonPaths || [];

  React.useEffect(() => {
    setCustomPath(settings.customPath || '');
    setUseCustom(settings.useCustomPath || false);
  }, [settings]);

  const handleBrowse = async () => {
    const result = await ipcRenderer.invoke('open-path-dialog');
    if (result.success) {
      setCustomPath(result.path);
    }
  };

  const handleToggleCustomPath = (e) => {
    const isEnabled = e.target.checked;
    setUseCustom(isEnabled);
    if (!isEnabled) {
      // If disabling, call the backend immediately
      ipcRenderer.invoke('disable-custom-path').then(result => {
        if (result.success) {
          showNotification('自定义路径已禁用，正在重新加载壁纸库...');
          // Update settings via the centralized handler
          onSettingsChange({ ...settings, useCustomPath: false, customPath: '' });
        } else {
          showNotification('禁用自定义路径失败。', true);
          setUseCustom(true); // Revert checkbox state on failure
        }
      });
    }
  };

  const handleApplyCustomPath = async () => {
    if (!customPath) {
      showNotification('路径不能为空。', true);
      return;
    }
    setIsSaving(true);
    const result = await ipcRenderer.invoke('validate-and-set-custom-path', customPath);
    setIsSaving(false);
    if (result.success) {
      showNotification('自定义路径已应用，正在重新加载壁纸库...');
      // Update settings via the centralized handler
      onSettingsChange({ ...settings, useCustomPath: true, customPath: customPath });
    } else {
      showNotification(`路径验证失败: ${result.error}`, true);
    }
  };
  
  const handleAddCommonPath = () => {
    if (!customPath) {
      showNotification('路径不能为空。', true);
      return;
    }
    if (commonPaths.includes(customPath)) {
      showNotification('该路径已存在于常用列表中。', true);
      return;
    }
    const newCommonPaths = [...commonPaths, customPath];
    onSettingsChange({ ...settings, commonPaths: newCommonPaths });
    showNotification('常用路径已添加。');
  };

  const handleRemoveCommonPath = (pathToRemove) => {
    const newCommonPaths = commonPaths.filter(p => p !== pathToRemove);
    onSettingsChange({ ...settings, commonPaths: newCommonPaths });
    showNotification('常用路径已移除。');
  };
  
  const handleUseCommonPath = (path) => {
    setCustomPath(path);
  };

  return React.createElement('div', { className: 'path-settings' },
    React.createElement('h3', null, '壁纸库路径'),
    React.createElement('div', { className: 'setting-item' },
      React.createElement('label', null,
        React.createElement('input', {
          type: 'checkbox',
          checked: useCustom,
          onChange: handleToggleCustomPath
        }),
        '使用自定义壁纸库路径'
      )
    ),
    useCustom && React.createElement('div', { className: 'custom-path-container' }, // New container
      React.createElement('div', { className: 'custom-path-controls' },
          React.createElement('input', {
            type: 'text',
            value: customPath,
            onChange: (e) => setCustomPath(e.target.value),
            placeholder: '选择壁纸库文件夹',
            style: { flexGrow: 1 } // Allow input to grow
          }),
          React.createElement('button', { onClick: handleBrowse }, '浏览...'),
          React.createElement('button', { onClick: handleAddCommonPath, title: '将当前路径添加到常用列表' }, '添加到常用'),
          React.createElement('button', { onClick: handleApplyCustomPath, disabled: isSaving }, isSaving ? '验证中...' : '应用路径')
      ),
      
      // Common Paths List
      commonPaths.length > 0 && React.createElement('div', { className: 'common-paths-list' },
        React.createElement('h4', { style: { marginTop: '15px', marginBottom: '5px'} }, '常用路径'),
        React.createElement('ul', null,
          commonPaths.map(p => React.createElement('li', { key: p, className: 'common-path-item' },
            React.createElement('span', { className: 'common-path-text', onClick: () => handleUseCommonPath(p), title: `使用此路径: ${p}` }, p),
            React.createElement('button', { className: 'common-path-delete', onClick: () => handleRemoveCommonPath(p) }, '×')
          ))
        )
      )
    )
  );
};

const GeneralSettings = ({ settings, onSettingsChange }) => {
  // This component is now "controlled" by the parent. It doesn't hold its own state.
  // It receives the current settings and a function to call when a setting changes.

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    // Allow empty input for typing, but don't save if it's not a valid number
    if (!isNaN(newLimit) && newLimit > 0) {
      onSettingsChange({ ...settings, openInExplorerLimit: newLimit });
    } else if (e.target.value === '') {
       // Handle case where user deletes the number
       onSettingsChange({ ...settings, openInExplorerLimit: '' }); // Pass empty string to parent
    }
  };

  const handleAutoHideChange = (e) => {
    onSettingsChange({ ...settings, autoHideAdultContent: e.target.checked });
  };

  const handleVfsDisabledChange = (e) => {
    onSettingsChange({ ...settings, vfsDisabled: e.target.checked });
  };

  return React.createElement('div', { className: 'general-settings' },
    React.createElement('h3', null, '常规设置'),
    React.createElement('div', { className: 'setting-item' },
      React.createElement('label', { htmlFor: 'explorer-limit' }, '“在资源管理器中显示”数量阈值'),
      React.createElement('input', {
        id: 'explorer-limit',
        type: 'number',
        // Use settings from props directly
        value: settings.openInExplorerLimit,
        onChange: handleLimitChange,
        min: '1'
      })
    ),
    React.createElement('div', { className: 'setting-item' },
      React.createElement('label', { htmlFor: 'auto-hide-adult' }, '自动隐藏成人内容'),
      React.createElement('input', {
        id: 'auto-hide-adult',
        type: 'checkbox',
        // Use settings from props directly
        checked: settings.autoHideAdultContent,
        onChange: handleAutoHideChange
      })
    ),
    React.createElement('div', { className: 'setting-item' },
      React.createElement('label', { htmlFor: 'vfs-disabled' }, '关闭vfs（虚拟文件夹）功能'),
      React.createElement('input', {
        id: 'vfs-disabled',
        type: 'checkbox',
        checked: settings.vfsDisabled || false,
        onChange: handleVfsDisabledChange
      })
    ),
    React.createElement('p', { className: 'settings-info-box' }, '勾选后，壁纸将以无文件夹的扁平列表形式展示。')
    // The save button is removed as changes are now handled in real-time by the parent.
  );
};

const SettingsHeader = ({ onGoBack, activeTab, onTabChange }) => {
  return React.createElement('div', { className: 'settings-header' },
    React.createElement('div', { className: 'settings-header-left' },
      React.createElement('button', { className: 'settings-back-btn', onClick: onGoBack }, '←'),
      React.createElement('h2', { className: 'settings-title' }, '设置')
    ),
    React.createElement('div', { className: 'settings-nav' },
      React.createElement('button', {
        className: `settings-nav-btn ${activeTab === 'general' ? 'active' : ''}`,
        onClick: () => onTabChange('general')
      }, '常规'),
      React.createElement('button', {
        className: `settings-nav-btn ${activeTab === 'debug' ? 'active' : ''}`,
        onClick: () => onTabChange('debug')
      }, '调试'),
      React.createElement('button', {
        className: `settings-nav-btn ${activeTab === 'health' ? 'active' : ''}`,
        onClick: () => onTabChange('health')
      }, '健康检查')
    )
  );
};

const SettingsPage = ({ onGoBack, showNotification, onDatabaseCleared, settings, onSettingsChange }) => {
  const [activeTab, setActiveTab] = React.useState('general');

  const handleFolderClick = (path) => {
    onGoBack(path);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return React.createElement(React.Fragment, null,
          React.createElement(GeneralSettings, { settings, onSettingsChange, showNotification }),
          React.createElement(PathSettings, { settings, onSettingsChange, showNotification }),
          React.createElement(CommonToolsSettings, { settings, onSettingsChange, showNotification })
        );
      case 'debug':
        return React.createElement(DebugView, { settings, onSettingsChange, showNotification, onDatabaseCleared });
      case 'health':
        return React.createElement(HealthCheckView, { showNotification });
      default:
        return null;
    }
  };

  return React.createElement('div', { className: 'settings-page' },
    React.createElement(SettingsHeader, { onGoBack: () => onGoBack(), activeTab, onTabChange: setActiveTab }),
    React.createElement('div', { className: 'settings-content' },
      renderContent()
    )
  );
};

const App = () => {
  const [allItems, setAllItems] = React.useState([]);
  const [filteredItems, setFilteredItems] = React.useState([]);
  // State will be initialized from settings
  const [filters, setFilters] = React.useState(null);
  const [sortOptions, setSortOptions] = React.useState(null);
  const [viewMode, setViewMode] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [playingVideo, setPlayingVideo] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [browserConfig, setBrowserConfig] = React.useState({ isVisible: false });
  const [isDecompressionModalVisible, setDecompressionModalVisible] = React.useState(false);
  const [fileToDecompress, setFileToDecompress] = React.useState(null);
  const [runningApps, setRunningApps] = React.useState(new Set());
  const [currentVPath, setCurrentVPath] = React.useState("./");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [movingItem, setMovingItem] = React.useState(null);
  const [currentView, setCurrentView] = React.useState('grid'); // 'grid' or 'settings'
  const [selectedItems, setSelectedItems] = React.useState(new Set());
  const [settings, setSettings] = React.useState(null);
  const [isInitialScanComplete, setIsInitialScanComplete] = React.useState(false);
  const [commonPasswords, setCommonPasswords] = React.useState([]);
  const [lastUsedPassword, setLastUsedPassword] = React.useState('');
  const [isSearchModeActive, setIsSearchModeActive] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const styleId = 'search-component-style';
    if (isSearchModeActive) {
      // If the style already exists, do nothing.
      if (document.getElementById(styleId)) return;

      const link = document.createElement('link');
      link.id = styleId;
      link.rel = 'stylesheet';
      link.href = 'components/css/Search.css'; // Path relative to index.html
      document.head.appendChild(link);
    }

    // Return a cleanup function
    return () => {
      if (isSearchModeActive) {
        const linkElement = document.getElementById(styleId);
        if (linkElement) {
          // console.log('Unloading Search.css');
          document.head.removeChild(linkElement);
        }
      }
    };
  }, [isSearchModeActive]);

  // This is the single source of truth for updating and saving settings.
  const handleSettingsChange = (newSettings) => {
    // Check if a setting that requires a data refresh has changed
    const vfsToggled = settings && settings.vfsDisabled !== newSettings.vfsDisabled;

    // Update the local state immediately for a responsive UI
    setSettings(newSettings);
    
    // Persist the changes to the backend
    ipcRenderer.invoke('save-settings', newSettings)
      .then(() => {
        // If the VFS setting was toggled, we need to reload the items
        if (vfsToggled) {
          // console.log('[前端] VFS 设置已更改，正在重新加载项目...');
          fetchItems(currentVPath);
        }
      })
      .catch(err => {
        console.error("Failed to save settings:", err);
        showNotification("设置保存失败!", true);
        // Optional: Revert to old settings on failure.
      });
  };

  const fetchItems = (vpath) => {
    // console.log(`[前端] fetchItems: 开始从虚拟路径 "${vpath}" 加载项目。`);
    setLoading(true);
    ipcRenderer.invoke('get-items', vpath).then(data => {
      // console.log(`[前端] fetchItems: 从后端接收到 ${data.length} 个项目。`);
      data.forEach(item => {
        if (item.previewMissing) {
          // console.warn(`壁纸 "${item.title}" (ID: ${item.id}) 未找到封面，已使用占位符。`);
        }
      });
      setAllItems(data);
      setLoading(false);
    }).catch(err => { console.error("获取项目失败:", err); setLoading(false); });
  };

  const refreshItems = () => {
    setLoading(true);
    // The "正在刷新" state is handled by the loading spinner, so this notification is redundant.
    // showNotification('正在刷新壁纸库...'); 
    ipcRenderer.invoke('refresh-wallpapers').then(result => {
      if (result.success) {
        showNotification('壁纸库刷新完成！');
        // After a manual refresh, explicitly fetch items for the *current* path
        // to ensure the view stays in the same folder.
        fetchItems(currentVPath);
      } else {
        showNotification('刷新失败!', true);
        setLoading(false); // Only set loading false on failure, success is handled by fetchItems
      }
    }).catch(err => {
      console.error("刷新失败:", err);
      showNotification('刷新失败!', true);
      setLoading(false);
    });
  };

  // Effect for one-time setup on component mount
  React.useEffect(() => {
    // 1. Load settings and apply one-time logic
    ipcRenderer.invoke('get-settings').then(loadedSettings => {
      setSettings(loadedSettings);
      setViewMode(loadedSettings.viewMode);
      setSortOptions(loadedSettings.sortOptions);
      setCommonPasswords(loadedSettings.commonPasswords || []);
      
      let activeFilters = { ...loadedSettings.filters };
      // This logic now correctly runs only once on startup
      if (loadedSettings.autoHideAdultContent && !isInitialScanComplete) {
        console.log('[前端] 启动时检测到自动隐藏成人内容，正在调整当前会话的过滤器。');
        activeFilters.rating = ['everyone'];
      }
      setFilters(activeFilters);
    });

    // 2. Set up scan completion listener
    const handleScanComplete = (event, success) => {
      // console.log(`[前端] 收到 "scan-complete" 事件，成功: ${success}`);
      // This handler is now ONLY responsible for the INITIAL scan.
      // Manual refreshes handle their own data fetching.
      if (!isInitialScanComplete) {
        if (success) {
          fetchItems(currentVPath); // Fetch for the first time
        } else {
          showNotification('扫描或刷新失败。', true);
          setLoading(false);
        }
        setIsInitialScanComplete(true);
      }
      // For subsequent (manual) refreshes, this listener does nothing,
      // as the refreshItems function now handles the data refetch.
    };
    ipcRenderer.on('scan-complete', handleScanComplete);

    // 3. Notify backend that renderer is ready
    console.log('[前端] 发送 "renderer-ready" 事件到后端。');
    ipcRenderer.send('renderer-ready');

    // 4. Cleanup listener on unmount
    return () => {
      ipcRenderer.removeListener('scan-complete', handleScanComplete);
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to show the "Initial Scan Complete" message exactly once.
  React.useEffect(() => {
    if (isInitialScanComplete) {
      // This effect runs when isInitialScanComplete changes from false to true.
      // We use a timeout to ensure it appears after the main UI is visible.
      setTimeout(() => showNotification('首次扫描完成！'), 100);
    }
  }, [isInitialScanComplete]);

  // Effect to save UI state (filters, sort, view mode) whenever it changes
  React.useEffect(() => {
    // Don't save until all states are initialized
    if (!settings || !filters || !sortOptions || !viewMode) {
      return;
    }
    
    // Create a new settings object with the latest UI state
    const newSettings = {
      ...settings,
      filters,
      sortOptions,
      viewMode,
    };

    // Only save if there's an actual change to prevent write loops
    // Note: This is a shallow comparison, but sufficient here.
    if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
      handleSettingsChange(newSettings);
    }
  }, [filters, sortOptions, viewMode]);

  React.useEffect(() => {
    // This effect now only fetches items when the scan is complete or the path changes.
    if (isInitialScanComplete) {
      fetchItems(currentVPath);
    }
  }, [isInitialScanComplete, currentVPath]);

  React.useEffect(() => {
    const handleAppStarted = (event, wallpaperId) => {
      setRunningApps(prev => new Set(prev).add(wallpaperId));
    };
    const handleAppStopped = (event, wallpaperId) => {
      setRunningApps(prev => {
        const newSet = new Set(prev);
        newSet.delete(wallpaperId);
        return newSet;
      });
    };

    ipcRenderer.on('app-started', handleAppStarted);
    ipcRenderer.on('app-stopped', handleAppStopped);

    return () => {
      ipcRenderer.removeListener('app-started', handleAppStarted);
      ipcRenderer.removeListener('app-stopped', handleAppStopped);
    };
  }, []);

  React.useEffect(() => {
    if (!filters) return;

    let itemsToProcess = [...allItems];

    // Step 0: Search if active. This runs before other filters.
    if (isSearchModeActive && searchQuery) {
      // Note: This searches only within the current folder view.
      itemsToProcess = searchWallpapers(searchQuery, itemsToProcess);
    }
    
    // Step 1: Filter by type and rating
    const filteredForDisplay = itemsToProcess.filter(item => {
      if (item.itemType === 'folder') {
        // Hide folders when searching, otherwise show them.
        return !isSearchModeActive;
      }
      const typeMatch = filters.type.length === 0 || (item.type && filters.type.includes(item.type.toLowerCase()));
      let rating = (item.rating || 'everyone').toLowerCase();
      if (rating === 'adult') rating = 'mature';
      const ratingMatch = filters.rating.length === 0 || filters.rating.includes(rating);
      return typeMatch && ratingMatch;
    });

    // Step 2: Sort
    const folders = filteredForDisplay.filter(item => item.itemType === 'folder');
    const wallpapers = filteredForDisplay.filter(item => item.itemType !== 'folder');
    const order = sortOptions.sortOrder === 'asc' ? 1 : -1;

    const sortFunction = (a, b) => {
      switch (sortOptions.sortBy) {
        case 'size':
          return ((a.size || 0) - (b.size || 0)) * order;
        case 'dateAdded':
           // Folders don't have dateAdded, so we sort them by title in this case
          if (a.itemType === 'folder') {
            return a.title.localeCompare(b.title) * order;
          }
          return ((a.dateAdded || 0) - (b.dateAdded || 0)) * order;
        case 'title':
        default:
          return a.title.localeCompare(b.title) * order;
      }
    };

    folders.sort(sortFunction);
    wallpapers.sort(sortFunction);

    setFilteredItems([...folders, ...wallpapers]);
  }, [filters, allItems, sortOptions, isSearchModeActive, searchQuery]);
  
  React.useEffect(() => {
    const handleClick = (e) => {
      // Always close context menu on any click
      setContextMenu(null);

      // Clear selection if clicking outside of a selectable item, but not on the select-all button
      if (selectedItems.size > 0 && !e.target.closest('.wallpaper-item, .wallpaper-list-item, .select-all-btn')) {
        setSelectedItems(new Set());
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedItems]);

  const showNotification = (message) => {
    const id = notificationIdCounter++;
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(note => note.id !== id)), 3000);
  };

  const handleFilterChange = (filterGroup, value) => {
    const newFilters = { 
      ...filters, 
      [filterGroup]: filters[filterGroup].includes(value) 
        ? filters[filterGroup].filter(i => i !== value) 
        : [...filters[filterGroup], value] 
    };
    setFilters(newFilters);
    // The useEffect for saving will pick this change up.
  };

  const handleSortChange = (key, value) => {
    setSortOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleWallpaperClick = (item, event) => {
    if (event.ctrlKey) {
      // Multi-select logic
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
        return newSelection;
      });
      return; // Prevent default action
    }

    // Clear selection if not holding ctrl
    setSelectedItems(new Set());

    if (runningApps.has(item.id)) {
      showNotification(`"${item.title}" 正在运行中`);
      return;
    }

    if (item.type.toLowerCase() === 'application') {
      if (item.appPath) {
        const fullPath = item.folderPath + item.appPath;
        ipcRenderer.invoke('launch-app', item.id, fullPath);
      } else {
        showNotification('请先右键点击 "定位可执行文件"');
      }
    } else if (item.type.toLowerCase() === 'video' && item.video) {
      setPlayingVideo(item.video);
    } else {
      showNotification(`"${item.type}" 类型不支持预览`);
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentVPath(folder.vpath);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    if (item.itemType === 'wallpaper' && runningApps.has(item.id)) return;

    // If right-clicking an item that is not part of the current selection,
    // clear the selection and select only the clicked item.
    if (!selectedItems.has(item.id)) {
      setSelectedItems(new Set([item.id]));
      setContextMenu({ x: e.clientX, y: e.clientY, item, isMultiSelect: false });
    } else {
      // If right-clicking an item that is part of the selection, show multi-select menu.
      setContextMenu({ x: e.clientX, y: e.clientY, item, isMultiSelect: true });
    }
  };

  const handleContextMenuAction = async (action, data) => {
    if (!contextMenu) return;
    const { item } = contextMenu;
    setContextMenu(null);

    switch (action) {
      case 'preview': handleWallpaperClick(item, {}); break;
      case 'locate':
        setBrowserConfig({
          isVisible: true,
          title: `为 "${item.title}" 定位可执行文件`,
          rootPath: item.folderPath,
          targetExtensions: ['.exe', '.bat'],
          onFileSelected: (selectedFilePath) => {
            handleFileSelected(selectedFilePath, item);
            setBrowserConfig({ isVisible: false }); // Close browser
          }
        });
        break;
      case 'decompress':
        console.log('[前端] "浏览并解压" 功能启动，配置 LocalFileBrowser...');
        setBrowserConfig({
          isVisible: true,
          title: `为 "${item.title}" 选择要解压的文件`,
          rootPath: item.folderPath,
          targetExtensions: ['.zip', '.7z', '.rar', '.part1.rar', '.7z.001', '.z01'],
          onFileSelected: (selectedFilePath) => {
            console.log(`[前端] LocalFileBrowser 返回已选文件: ${selectedFilePath}`);
            const fileName = selectedFilePath.split(/[\\/]/).pop();
            setFileToDecompress({ path: selectedFilePath, name: fileName });
            setDecompressionModalVisible(true);
            setBrowserConfig({ isVisible: false });
          }
        });
        break;
      case 'show-notification': showNotification(data, true); break;
      case 'cleanup-zip':
        setBrowserConfig({
          isVisible: true,
          title: `选择要清理的压缩文件 (位于 "${item.title}" 项目中)`,
          rootPath: item.folderPath,
          targetExtensions: ['.zip', '.7z', '.rar', '.001', '.002', '.003', '.004', '.005', '.006', '.007', '.008', '.009', '.010'],
          onFileSelected: async (selectedFilePath) => {
            const fileName = selectedFilePath.split(/[\\/]/).pop();
            const isConfirmed = window.confirm(`您确定要将文件 "${fileName}" 移动到回收站吗？`);
            if (isConfirmed) {
              console.log(`[SENSITIVE ACTION] Requesting to delete file: ${selectedFilePath}`);
              const result = await ipcRenderer.invoke('delete-file-to-recycle-bin', selectedFilePath);
              if (result.success) {
                showNotification(`文件 "${fileName}" 已移至回收站。`);
              } else {
                showNotification(`删除失败: ${result.error}`, true);
              }
            }
            // Always close the browser after action
            setBrowserConfig({ isVisible: false });
          },
          onCancel: () => setBrowserConfig({ isVisible: false })
        });
        break;
      case 'open': ipcRenderer.invoke('open-folder', item.folderPath); break;
      case 'open-in-workshop': ipcRenderer.invoke('open-in-workshop', item.id); break;
      case 'delete': {
        console.log(`[SENSITIVE ACTION] Requesting to delete wallpaper: ${item.title} (ID: ${item.id})`);
        const result = await ipcRenderer.invoke('delete-folder', item.folderPath, item.id);
        if (result.success) {
          showNotification(`"${item.title}" 已移至回收站`);
          fetchItems(currentVPath); // 轻量级刷新
        } else if (!result.cancelled) {
          showNotification(`删除失败: ${result.error}`);
        }
        break;
      }
      case 'move-wallpaper':
      case 'move-folder':
        setMovingItem(item);
        break;
      case 'delete-folder': {
        // This is not a sensitive action as it only affects the database, so no log is needed.
        const deleteResult = await ipcRenderer.invoke('delete-virtual-folder', item.vpath);
        if (deleteResult.success) {
          showNotification(`文件夹 "${item.title}" 已删除`);
          fetchItems(currentVPath); // 轻量级刷新
        } else {
          showNotification(`删除失败: ${deleteResult.error}`);
        }
        break;
      }
      case 'move-multiple': {
        const firstSelectedItem = allItems.find(i => selectedItems.has(i.id));
        if (firstSelectedItem) {
          // We create a generic item for the move dialog
          setMovingItem({ 
            title: `${selectedItems.size} 个项目`, 
            isMultiple: true,
            ids: Array.from(selectedItems), // Pass the selected IDs
            // The following properties are needed to prevent crashes, but won't be used directly
            itemType: 'multiple', 
            id: 'multiple'
          });
        }
        break;
      }
      case 'open-multiple': {
        const selectedWallpapers = allItems.filter(i => selectedItems.has(i.id));
        for (const wallpaper of selectedWallpapers) {
          ipcRenderer.invoke('open-folder', wallpaper.folderPath);
        }
        break;
      }
      case 'delete-multiple': {
        const isConfirmed = window.confirm(`你确定要删除选中的 ${selectedItems.size} 个项目吗？此操作不可逆！`);
        if (isConfirmed) {
          const itemsToDelete = allItems.filter(i => selectedItems.has(i.id));
          const idsToDelete = itemsToDelete.map(i => i.id);
          const folderPathsToDelete = itemsToDelete.map(i => i.folderPath);
          
          console.log(`[SENSITIVE ACTION] Requesting to delete multiple items. Count: ${idsToDelete.length}, IDs: ${idsToDelete.join(', ')}`);
          const result = await ipcRenderer.invoke('delete-multiple-folders', folderPathsToDelete, idsToDelete);
          if (result.success) {
            showNotification(`${result.deletedCount} 个项目已移至回收站`);
            fetchItems(currentVPath); // 轻量级刷新
            setSelectedItems(new Set());
          } else {
            showNotification(`删除失败: ${result.error}`);
          }
        }
        break;
      }
    }
  };

  const handleCreateFolder = (folderName) => {
    ipcRenderer.invoke('create-virtual-folder', folderName, currentVPath).then(result => {
      if (result.success) {
        showNotification(`文件夹 "${folderName}" 创建成功`);
        fetchItems(currentVPath); // 轻量级刷新
      } else {
        showNotification(`创建失败: ${result.error}`);
      }
      setIsCreatingFolder(false);
    });
  };

  const handleMoveItem = (targetVPath) => {
    if (!movingItem) return;

    const idsToMove = movingItem.isMultiple ? movingItem.ids : [movingItem.id];
    
    ipcRenderer.invoke('move-item', idsToMove, targetVPath).then(result => {
      if (result.success) {
        const message = `${result.movedCount || 0} 个项目移动成功`;
        showNotification(message);
        fetchItems(currentVPath); // 轻量级刷新
        if (movingItem.isMultiple) {
          setSelectedItems(new Set());
        }
      } else {
        showNotification(`移动失败: ${result.error}`);
      }
      setMovingItem(null);
    });
  };

  const handleFileSelected = (fullExePath, wallpaper) => {
    const relativePath = fullExePath.replace(wallpaper.folderPath, '');
    ipcRenderer.invoke('save-app-path', wallpaper.id, relativePath, wallpaper.type).then(() => {
      showNotification(`已为 "${wallpaper.title}" 定位成功`);
      // No need for a full refresh here, a simple fetch should suffice if the backend updates the cache.
      // However, a full refresh is safer if the type changes, so we'll keep it.
      refreshItems();
    });
  };

  // console.log(`[前端] App Render: allItems=${allItems.length}, filteredItems=${filteredItems.length}, loading=${loading}, initialScanComplete=${isInitialScanComplete}`);

  if (!isInitialScanComplete || !settings || !filters) {
    return React.createElement('h1', { style: { textAlign: 'center' } }, '正在扫描壁纸库...');
  }

  const handleGoBackFromSettings = (path) => {
    if (path && typeof path === 'string') {
      setCurrentVPath(path);
    }
    setCurrentView('grid');
  };

  const handleDatabaseCleared = () => {
    // Go back to root and refresh
    setCurrentVPath('./');
    refreshItems();
  };


  const renderMainContent = () => {
    if (currentView === 'settings') {
      return React.createElement(SettingsPage, { 
        onGoBack: handleGoBackFromSettings, 
        showNotification,
        onDatabaseCleared: handleDatabaseCleared,
        settings: settings,
        onSettingsChange: handleSettingsChange
      });
    }

    const mainView = viewMode === 'grid'
      ? React.createElement(WallpaperGrid, { items: filteredItems, onWallpaperClick: handleWallpaperClick, onFolderClick: handleFolderClick, onContextMenu: handleContextMenu, runningApps: runningApps, selectedItems: selectedItems })
      : React.createElement(WallpaperList, { items: filteredItems, onWallpaperClick: handleWallpaperClick, onFolderClick: handleFolderClick, onContextMenu: handleContextMenu, runningApps: runningApps, selectedItems: selectedItems });

    const handleSelectAll = () => {
      const allItemIds = new Set(filteredItems.filter(i => i.itemType !== 'folder').map(i => i.id));
      setSelectedItems(allItemIds);
    };
  
    const handleDeselectAll = () => {
      setSelectedItems(new Set());
    };

    // Default to 'grid' view
    if (movingItem) {
      return React.createElement(VirtualFolderBrowser, { itemToMove: movingItem, onMoveConfirm: handleMoveItem, onCancel: () => setMovingItem(null) });
    }

    if (browserConfig.isVisible) {
        return React.createElement(LocalFileBrowser, {
            title: browserConfig.title,
            rootPath: browserConfig.rootPath,
            targetExtensions: browserConfig.targetExtensions,
            onFileSelected: browserConfig.onFileSelected,
            onCancel: browserConfig.onCancel || (() => setBrowserConfig({ isVisible: false }))
        });
    }

    if (isDecompressionModalVisible) {
        const handleConfirmDecompression = async (filePath, password, deleteOriginal) => {
            const fileName = filePath.split(/[\\/]/).pop();
            showNotification(`正在开始解压 ${fileName}...`);
            setDecompressionModalVisible(false);
            setFileToDecompress(null);

            if (deleteOriginal) {
                console.log(`[SENSITIVE ACTION] Decompressing with delete option for: ${filePath}`);
            }

            const result = await ipcRenderer.invoke('decompress-archive', filePath, password, deleteOriginal);

            if (result.success) {
                showNotification('解压成功！正在刷新文件列表...');
                setLastUsedPassword(password);
                if (password && !commonPasswords.includes(password)) {
                    ipcRenderer.invoke('add-common-password', password).then(res => {
                        if (res.success) setCommonPasswords(res.passwords);
                    });
                }
                if (result.warning) {
                    showNotification(result.warning, true);
                }
                refreshItems();
            } else {
                showNotification(`解压失败: ${result.error}`, true);
            }
        };

        return React.createElement(DecompressionModal, {
            file: fileToDecompress,
            onConfirm: handleConfirmDecompression,
            onCancel: () => {
                setDecompressionModalVisible(false);
                setFileToDecompress(null);
            },
            commonPasswords: commonPasswords,
            lastUsedPassword: lastUsedPassword
        });
    }

    return React.createElement(React.Fragment, null, 
      React.createElement(Header, { 
        currentVPath: currentVPath, 
        onNavigate: setCurrentVPath, 
        onNewFolder: () => setIsCreatingFolder(true),
        viewMode: viewMode,
        onViewModeChange: setViewMode,
        onSelectAll: handleSelectAll,
        onDeselectAll: handleDeselectAll,
        numItems: filteredItems.filter(i => i.itemType !== 'folder').length,
        numSelected: selectedItems.size,
        isSearchModeActive: isSearchModeActive,
        onSearchToggle: () => setIsSearchModeActive(!isSearchModeActive),
        searchQuery: searchQuery,
        onSearchQueryChange: setSearchQuery
      }),
      mainView
    );
  };

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'app-container' },
      React.createElement(Sidebar, { 
        filters, 
        onFilterChange: handleFilterChange, 
        sortOptions,
        onSortChange: handleSortChange,
        onRefresh: refreshItems, 
        onNavigateToSettings: () => setCurrentView('settings'),
        isActionInProgress: !!movingItem
      }),
      React.createElement('div', { className: 'main-content' }, renderMainContent())
    ),
    isCreatingFolder && React.createElement(NewFolderModal, { onConfirm: handleCreateFolder, onCancel: () => setIsCreatingFolder(false) }),
    React.createElement(VideoPlayer, { videoSrc: playingVideo, onClose: () => setPlayingVideo(null) }),
    React.createElement(NotificationContainer, { notifications: notifications }),
    React.createElement(ContextMenu, { menu: contextMenu, onAction: handleContextMenuAction, selectedItems: selectedItems, settings: settings })
  );
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(React.createElement(App));
