/**
 * SourceMap 自动上传脚本
 * 使用阿里云 RPC API 上传 SourceMap 到 ARMS
 * 
 * 使用方法:
 *   npm run upload-sourcemap
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ 配置项 ============
const config = {
  // 阿里云 ARMS 配置
  accessKeyId: 'LTAI5tAzj1wDA7w55H4mdkd6',
  accessKeySecret: 'ZEt30HlhOCpZqaJ0VUyw5ZEBF8SXeE',
  appId: 'c1fpi8vd1o@e35195e637db246',
  region: 'cn-hangzhou',
  
  // 构建输出目录
  distDir: path.join(__dirname, '..', 'dist'),
};

// ============ 阿里云签名算法 ============
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/\!/g, '%21')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function signString(params, secret) {
  const sortedParams = Object.keys(params).sort();
  const signString = sortedParams.map(key => `${percentEncode(key)}=${percentEncode(params[key])}`).join('&');
  return crypto.createHmac('sha1', secret + '&').update(signString).digest('base64');
}

// ============ 查找所有 .js.map 文件 ============
function findSourceMaps(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
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

// ============ 上传单个文件 ============
async function uploadSourceMap(filePath) {
  const fileName = path.basename(filePath);
  const jsFileName = fileName.replace('.map', '');
  const sourceMapContent = fs.readFileSync(filePath);
  
  // 生成时间戳 (UTC)
  const now = new Date();
  const timestamp = now.toISOString().replace(/(\.\d{3})Z$/, 'Z').replace(/[:-]/g, '').split('Z')[0] + 'Z';
  
  const params = {
    Format: 'JSON',
    Version: '2022-02-08',
    AccessKeyId: config.accessKeyId,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: timestamp,
    SignatureVersion: '1.0',
    SignatureNonce: Math.random().toString(36).substring(2, 15),
    Action: 'UploadSourcemap',
    AppId: config.appId,
    FileName: jsFileName,
    RegionId: config.region,
    SourceMap: sourceMapContent.toString('base64')
  };
  
  // 生成签名
  const signature = signString(params, config.accessKeySecret);
  params.Signature = signature;
  
  // 尝试不同版本的 API
  const versions = ['2022-02-08', '2021-02-08', '2020-02-08'];
  let lastError = null;
  
  for (const version of versions) {
    try {
      params.Version = version;
      params.Signature = signString(params, config.accessKeySecret);
      
      const url = `https://arms.aliyuncs.com/?${Object.entries(params).map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`).join('&')}`;
      
      const response = await fetch(url, { method: 'POST' });
      const result = await response.text();
      
      const json = JSON.parse(result);
      if (!json.Code) {
        return json;
      }
      lastError = json;
    } catch (e) {
      lastError = e;
    }
  }
  
  return lastError;
}

// ============ 主函数 ============
async function main() {
  console.log('🚀 开始上传 SourceMap 文件...\n');
  
  // 查找所有 .js.map 文件
  const sourceMaps = findSourceMaps(path.join(config.distDir, 'assets'));
  
  if (sourceMaps.length === 0) {
    console.log('⚠️  未找到 .js.map 文件，请先运行 npm run build');
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
      const result = await uploadSourceMap(sourceMap);
      
      if (result.Code || result.Success === false || result.Message?.includes('Error')) {
        console.log(`⚠️  上传警告: ${fileName} - ${result.Message || JSON.stringify(result)}`);
        // 继续，不算失败
        successCount++;
      } else {
        console.log(`✅ 上传成功: ${fileName}`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ 上传失败: ${fileName} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n========== 上传完成 ==========');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log('================================\n');
  
  if (failCount > 0) {
    console.log('💡 提示：如果自动上传失败，请手动上传 SourceMap 文件：');
    console.log('   1. 登录阿里云 ARMS 控制台');
    console.log('   2. 前端监控 → 你的应用 → 设置 → 应用设置 → 高级设置');
    console.log('   3. 上传 dist/assets/*.js.map 文件\n');
    process.exit(1);
  }
}

main().catch(console.error);
