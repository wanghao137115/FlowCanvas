/**
 * SourceMap 上传脚本
 * 用于将构建后的 .js.map 文件自动上传到阿里云 ARMS
 * 
 * 使用方法:
 *   node scripts/upload-sourcemap.js
 * 
 * 或者在 package.json 中配置:
 *   "upload-sourcemap": "node scripts/upload-sourcemap.js"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

// ============ 配置项 ============
const config = {
  // ARMS 应用配置
  appId: 'c1fpi8vd1o@e35195e637db246',
  workspaceId: 'default-cms-1222771575239628-cn-hangzhou',
  region: 'cn-hangzhou',
  version: '1.0.0',
  
  // 构建输出目录
  distDir: path.join(__dirname, '..', 'dist'),
  
  // ARMS API 端点
  apiHost: 'arms-apm.aliyuncs.com',
  apiPath: '/rpc/v2/json/webhub'
};

// ============ 查找所有 .js.map 文件 ============
function findSourceMaps(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findSourceMaps(fullPath, files);
    } else if (item.endsWith('.js.map')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// ============ 读取 SourceMap 文件 ============
function readSourceMap(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// ============ 生成上传请求 ============
function generateRequestParams(sourceMapPath, sourceMapContent) {
  const fileName = path.basename(sourceMapPath);
  const jsFileName = fileName.replace('.map', '');
  
  return {
    appId: config.appId,
    workspaceId: config.workspaceId,
    version: config.version,
    fileName: jsFileName,
    sourceMap: sourceMapContent
  };
}

// ============ 上传单个文件 ============
function uploadSourceMap(sourceMapPath) {
  return new Promise((resolve, reject) => {
    const sourceMapContent = readSourceMap(sourceMapPath);
    const params = generateRequestParams(sourceMapPath, JSON.stringify(sourceMapContent));
    
    const postData = querystring.stringify({
      ...params,
      action: 'UploadSourcemap',
      service: 'arms'
    });
    
    const options = {
      hostname: config.apiHost,
      path: config.apiPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success || result.Code === 'Success') {
            resolve(result);
          } else {
            reject(new Error(result.Message || 'Upload failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ============ 主函数 ============
async function main() {
  console.log('🚀 开始上传 SourceMap 文件...\n');
  
  // 检查 dist 目录是否存在
  if (!fs.existsSync(config.distDir)) {
    console.error('❌ dist 目录不存在，请先运行 npm run build');
    process.exit(1);
  }
  
  // 查找所有 .js.map 文件
  const sourceMaps = findSourceMaps(path.join(config.distDir, 'assets'));
  
  if (sourceMaps.length === 0) {
    console.log('⚠️  未找到 .js.map 文件，请确保 vite.config.ts 中 sourcemap: true');
    return;
  }
  
  console.log(`📦 找到 ${sourceMaps.length} 个 SourceMap 文件:\n`);
  sourceMaps.forEach((file, i) => {
    console.log(`   ${i + 1}. ${path.basename(file)}`);
  });
  console.log('');
  
  // 上传每个文件
  let successCount = 0;
  let failCount = 0;
  
  for (const sourceMap of sourceMaps) {
    const fileName = path.basename(sourceMap);
    try {
      console.log(`⬆️  上传中: ${fileName}...`);
      await uploadSourceMap(sourceMap);
      console.log(`✅  上传成功: ${fileName}`);
      successCount++;
    } catch (error) {
      console.log(`❌  上传失败: ${fileName} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n========== 上传完成 ==========');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log('================================\n');
  
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
