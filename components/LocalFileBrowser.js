const React = require('react');
const { ipcRenderer } = require('electron');
const { useEffect } = React;

const path = require('path');

const LocalFileBrowser = ({
  title,
  rootPath,
  targetExtensions,
  onFileSelected,
  onCancel
}) => {
  const [currentPath, setCurrentPath] = React.useState(rootPath);
  const [items, setItems] = React.useState([]);
  const [history, setHistory] = React.useState([rootPath]);
  const [loading, setLoading] = React.useState(true);
  const [renamingPath, setRenamingPath] = React.useState(null);

  useEffect(() => {
    const styleId = 'local-file-browser-style';
    // 检查样式是否已存在
    if (document.getElementById(styleId)) {
      return;
    }

    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = './components/css/LocalFileBrowser.css';
    
    document.head.appendChild(link);

    // 组件卸载时移除样式
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []); // 空依赖数组确保只在挂载和卸载时运行

  const loadItems = (path) => {
    setLoading(true);
    ipcRenderer.invoke('get-folder-contents', path)
      .then(setItems)
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    loadItems(currentPath);
  }, [currentPath]);

  const handleItemClick = (item) => {
    if (item.isDirectory) {
      const newPath = item.path;
      // Security check: Prevent navigating above the root path
      if (!newPath.startsWith(rootPath)) {
        console.warn("Navigation outside of the root path is blocked.");
        return;
      }
      setHistory(prev => [...prev, newPath]);
      setCurrentPath(newPath);
    } else {
      const isTargetFile = targetExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
      if (isTargetFile) {
        onFileSelected(item.path);
      }
    }
  };

  const handleGoBack = () => {
    // Prevent going back beyond the initial path
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentPath(newHistory[newHistory.length - 1]);
    }
  };

  const handleRename = async (item, newName) => {
    const newPath = path.join(path.dirname(item.path), newName);
    if (newName && newPath !== item.path) {
      const result = await ipcRenderer.invoke('rename-file', { oldPath: item.path, newPath });
      if (result.success) {
        loadItems(currentPath); // Refresh the list
      } else {
        console.error('Rename failed:', result.error);
        // Optionally, show an error to the user
      }
    }
    setRenamingPath(null); // Exit renaming mode
  };

  const sortedItems = React.useMemo(() => {
    if (loading) return [];
    // Create a shallow copy before sorting
    return items.slice().sort((a, b) => {
      const isSelectableA = !a.isDirectory && targetExtensions.some(ext => a.name.toLowerCase().endsWith(ext));
      const isSelectableB = !b.isDirectory && targetExtensions.some(ext => b.name.toLowerCase().endsWith(ext));

      const getPriority = (item, isSelectable) => {
        if (item.isDirectory) return 0; // Highest priority
        if (isSelectable) return 1;    // Medium priority
        return 2;                      // Lowest priority
      };

      const priorityA = getPriority(a, isSelectableA);
      const priorityB = getPriority(b, isSelectableB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If priorities are the same, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [items, loading, targetExtensions]);

  return React.createElement('div', { className: 'local-file-browser' },
    React.createElement('div', { className: 'local-file-browser-header' },
      React.createElement('h2', null, title),
      React.createElement('button', { onClick: onCancel }, '取消')
    ),
    React.createElement('div', { className: 'local-file-browser-nav' },
      React.createElement('button', { onClick: handleGoBack, disabled: history.length <= 1 }, '返回上一级'),
      // Display path relative to the root
      React.createElement('span', null, currentPath.replace(rootPath, ''))
    ),
    loading
      ? React.createElement('p', null, '正在加载文件列表...')
      : React.createElement('div', { className: 'local-file-browser-list' },
          sortedItems.map(item => {
            const isSelectable = !item.isDirectory && targetExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
            
            const classNames = ['local-file-browser-item'];
            if (item.isDirectory) {
                classNames.push('folder');
            } else {
                classNames.push('file');
                if (isSelectable) {
                  classNames.push('is-selectable');
                }
            }
            
            if (item.path === renamingPath) {
              return React.createElement('div', {
                key: item.path,
                className: classNames.join(' '),
              },
                '📄',
                React.createElement('input', {
                  type: 'text',
                  defaultValue: item.name,
                  autoFocus: true,
                  onBlur: (e) => handleRename(item, e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') handleRename(item, e.target.value);
                    if (e.key === 'Escape') setRenamingPath(null);
                  },
                  onClick: (e) => e.stopPropagation(), // Prevent item click from firing
                })
              );
            }
            
            return React.createElement('div', {
              key: item.path, // Use path for a more unique key
              className: classNames.join(' '),
              onClick: () => handleItemClick(item),
              onContextMenu: (e) => {
                if (!item.isDirectory) {
                  e.preventDefault();
                  setRenamingPath(item.path);
                }
              }
            },
              `${item.isDirectory ? '📁' : '📄'} ${item.name}`
            );
          })
        )
  );
};

module.exports = { LocalFileBrowser };
