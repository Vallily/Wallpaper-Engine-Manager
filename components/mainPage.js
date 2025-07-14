const React = require('react');

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const OverflowingTitle = ({ title }) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const h3Ref = React.useRef(null);

  React.useLayoutEffect(() => {
    const checkOverflow = () => {
      if (h3Ref.current) {
        const hasOverflow = h3Ref.current.scrollWidth > h3Ref.current.clientWidth;
        if (hasOverflow !== isOverflowing) {
          setIsOverflowing(hasOverflow);
        }
      }
    };
    
    const timeoutId = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [title]);

  const className = isOverflowing ? 'is-overflowing' : '';

  return React.createElement('h3', { ref: h3Ref, className }, title);
};

const WallpaperGrid = ({ items, onWallpaperClick, onFolderClick, onContextMenu, runningApps, selectedItems, isBrowserMode = false }) => {
  if (items.length === 0) return React.createElement('div', { className: 'wallpaper-grid' }, React.createElement('p', null, '没有找到任何项目。'));

  return React.createElement('div', { className: 'wallpaper-grid' },
    items.map(item => {
      if (item.itemType === 'folder') {
        const isSelected = selectedItems.has(item.id);
        const folderClassName = `wallpaper-item is-folder ${isSelected ? 'is-selected' : ''}`;
        return React.createElement('div', {
          className: folderClassName,
          key: item.id,
          onClick: () => onFolderClick(item),
          onContextMenu: (e) => onContextMenu(e, item)
        },
          React.createElement('div', { className: 'wallpaper-preview' }), // This provides the folder icon via CSS
          React.createElement(OverflowingTitle, { title: item.title })
        );
      }

      if (isBrowserMode) {
        return null;
      }

      const isRunning = runningApps.has(item.id);
      const isSelected = selectedItems.has(item.id);
      const previewUrl = item.preview ? `url("${item.preview}")` : `url("assets/俺的图图呢.webp")`;
      const isLinked = item.type && item.type.toLowerCase() === 'application' && item.appPath;
      const itemClassName = `wallpaper-item ${isRunning ? 'is-running' : ''} ${isSelected ? 'is-selected' : ''} ${isLinked ? 'is-linked' : ''}`;

      return React.createElement('div', {
        className: itemClassName,
        key: item.id,
        onClick: (e) => onWallpaperClick(item, e),
        onContextMenu: (e) => onContextMenu(e, item)
      },
        React.createElement('div', { 
          className: 'wallpaper-preview', 
          style: { backgroundImage: previewUrl } 
        }),
        React.createElement(OverflowingTitle, { title: item.title })
      );
    })
  );
};

const WallpaperList = ({ items, onWallpaperClick, onFolderClick, onContextMenu, runningApps, selectedItems }) => {
  if (items.length === 0) return React.createElement('div', { className: 'wallpaper-list-container' }, React.createElement('p', null, '没有找到任何项目。'));

  return React.createElement('div', { className: 'wallpaper-list-container' },
    React.createElement('div', { className: 'wallpaper-list' },
      items.map(item => {
        const isRunning = item.itemType !== 'folder' && runningApps.has(item.id);
        const isSelected = selectedItems.has(item.id);
        const isLinked = item.type && item.type.toLowerCase() === 'application' && item.appPath;
        const className = `wallpaper-list-item ${item.itemType === 'folder' ? 'is-folder' : ''} ${isRunning ? 'is-running' : ''} ${isSelected ? 'is-selected' : ''} ${isLinked ? 'is-linked' : ''}`;
        
        const handleClick = (e) => {
          if (isRunning) return;
          if (item.itemType === 'folder') {
            onFolderClick(item);
          } else {
            onWallpaperClick(item, e);
          }
        };

        const previewStyle = item.itemType === 'folder' 
          ? { backgroundImage: 'none' } 
          : { backgroundImage: item.preview ? `url("${item.preview}")` : `url("assets/俺的图图呢.webp")` };

        return React.createElement('div', {
          className,
          key: item.id,
          onClick: handleClick,
          onContextMenu: (e) => onContextMenu(e, item)
        },
          React.createElement('div', { 
            className: 'list-item-preview', 
            style: previewStyle
          }),
          React.createElement('div', { className: 'list-item-details' },
            React.createElement('h4', { className: 'list-item-title' }, item.title),
            React.createElement('p', { className: 'list-item-meta' },
              item.itemType === 'folder'
                ? `大小: ${formatBytes(item.size || 0)}`
                : `类型: ${item.type} | 分级: ${item.rating || 'everyone'} | 大小: ${formatBytes(item.size || 0)}`
            )
          ),
          isRunning && React.createElement('div', { className: 'list-item-status' }, '运行中')
        );
      })
    )
  );
};

module.exports = {
    WallpaperGrid,
    WallpaperList,
    formatBytes,
    OverflowingTitle
};
