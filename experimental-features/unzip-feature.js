const { execFile } = require('child_process');
const { shell } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegex(str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Finds all parts of a multi-volume archive given the path to one of its files.
 * @param {string} filePath - The path to one of the archive files.
 * @returns {Promise<string[]>} A promise that resolves to an array of full paths for all related archive files.
 */
async function findRelatedArchiveFiles(filePath) {
  try {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const filesInDir = await fs.promises.readdir(dir);
    const relatedFiles = new Set([filePath]); // Always include the original file

    let match;

    // Pattern 1: .7z.001, .7z.002 ...
    match = filename.match(/^(.*\.7z)\.\d{3}$/i);
    if (match) {
      const base = match[1]; // e.g., "archive.7z"
      const re = new RegExp(`^${escapeRegex(base)}\\.\\d{3}$`, 'i');
      filesInDir.forEach(f => {
        if (re.test(f)) {
          relatedFiles.add(path.join(dir, f));
        }
      });
      return Array.from(relatedFiles);
    }

    // Pattern 2: .part1.rar, .part2.rar ...
    match = filename.match(/^(.*)\.part\d+\.rar$/i);
    if (match) {
      const base = match[1]; // e.g., "archive"
      const re = new RegExp(`^${escapeRegex(base)}\\.part\\d+\\.rar$`, 'i');
      filesInDir.forEach(f => {
        if (re.test(f)) {
          relatedFiles.add(path.join(dir, f));
        }
      });
      return Array.from(relatedFiles);
    }

    // Pattern 3: .z01, .z02, ... .zip
    match = filename.match(/^(.*)\.z\d{2}$/i);
    if (match) {
      const base = match[1]; // e.g., "archive"
      const re = new RegExp(`^${escapeRegex(base)}\\.(z\\d{2}|zip)$`, 'i');
      filesInDir.forEach(f => {
        if (re.test(f)) {
          relatedFiles.add(path.join(dir, f));
        }
      });
      return Array.from(relatedFiles);
    }
    
    // Pattern 4: .r01, .r02, ... .rar
    match = filename.match(/^(.*)\.r\d{2}$/i);
    if (match) {
      const base = match[1]; // e.g., "archive"
      const re = new RegExp(`^${escapeRegex(base)}\\.(r\\d{2}|rar)$`, 'i');
      filesInDir.forEach(f => {
        if (re.test(f)) {
          relatedFiles.add(path.join(dir, f));
        }
      });
      return Array.from(relatedFiles);
    }

    // If no multi-volume pattern matched, it's a single file archive.
    return [filePath];
  } catch (err) {
    console.error(`Error finding related archive files for ${filePath}:`, err);
    // On error, fall back to just the original file to avoid breaking the delete process.
    return [filePath];
  }
}


/**
 * 使用 Bandizip 解压一个压缩包。
 * @param {string} bandizipPath - bandizip.exe 的完整路径。
 * @param {string} archivePath - 要解压的压缩包文件的完整路径。
 * @param {string|null} password - 压缩包的密码，如果没有则为 null。
 * @param {boolean} deleteOriginal - 如果成功，是否将原始压缩包移动到回收站。
 * @returns {Promise<{success: boolean, error?: string, warning?: string}>}
 */
async function decompress(bandizipPath, archivePath, password, deleteOriginal) {
  if (!bandizipPath || !fs.existsSync(bandizipPath)) {
    return { success: false, error: 'Bandizip 路径无效或未在设置中配置。' };
  }

  const outputPath = path.dirname(archivePath);
  const args = ['x', `-o:${outputPath}`];
  if (password) {
    args.push(`-p:${password}`);
  }
  args.push(archivePath);

  return new Promise((resolve) => {
    execFile(bandizipPath, args, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Bandizip Error: ${error.message}`);
        console.error(`Bandizip Stderr: ${stderr}`);
        let userError = `解压失败: ${error.message}`;
        if (stderr.toLowerCase().includes('password')) {
          userError = '解压失败：密码错误或压缩文件已损坏。';
        } else if (stderr.toLowerCase().includes('cannot open')) {
          userError = '解压失败：无法打开文件，可能不是支持的格式或已损坏。';
        }
        resolve({ success: false, error: userError });
        return;
      }

      // 如果解压成功且 deleteOriginal 为 true，则查找所有分卷并移至回收站
      if (deleteOriginal) {
        try {
          const filesToDelete = await findRelatedArchiveFiles(archivePath);
          for (const file of filesToDelete) {
            await shell.trashItem(file);
            console.log(`成功将 ${file} 移至回收站。`);
          }
        } catch (trashError) {
          console.error(`无法将一个或多个分卷文件移至回收站:`, trashError);
          // 解析为 success=true 但包含关于删除失败的警告
          resolve({ success: true, warning: '解压成功，但删除一个或多个源文件失败。' });
          return;
        }
      }
      
      console.log(`Bandizip Stdout: ${stdout}`);
      resolve({ success: true });
    });
  });
}

module.exports = {
  decompress,
};
