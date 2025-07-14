/**
 * 执行“有序子序列匹配”算法。
 * 检查 searchText 中的所有字符是否按顺序出现在 title 中，允许中间有间隔。
 * @param {string} searchText - 用户输入的搜索查询。
 * @param {string} title - 要匹配的壁纸标题。
 * @returns {boolean} - 如果匹配成功则返回 true，否则返回 false。
 */
function sparseMatch(searchText, title) {
  if (!searchText) {
    return true; // 空搜索词匹配所有
  }
  if (!title) {
    return false; // 无法在空标题中找到任何内容
  }

  // 为了不区分大小写，统一转换为小写进行比较
  const lowerSearchText = searchText.toLowerCase();
  const lowerTitle = title.toLowerCase();

  let search_ptr = 0;
  let title_ptr = 0;

  while (search_ptr < lowerSearchText.length && title_ptr < lowerTitle.length) {
    if (lowerSearchText[search_ptr] === lowerTitle[title_ptr]) {
      search_ptr++;
    }
    title_ptr++;
  }

  return search_ptr === lowerSearchText.length;
}

/**
 * 在壁纸列表中搜索匹配项。
 * @param {string} searchText - 搜索查询。
 * @param {Array<Object>} allWallpapers - 所有壁纸对象的完整列表。
 * @returns {Array<Object>} - 包含所有匹配壁纸的数组。
 */
function searchWallpapers(searchText, allWallpapers) {
  if (!searchText) {
    return []; // 如果搜索词为空，不返回任何结果，由调用方决定如何处理
  }
  return allWallpapers.filter(wallpaper => sparseMatch(searchText, wallpaper.title));
}

// 导出模块
module.exports = {
  sparseMatch,
  searchWallpapers,
};
