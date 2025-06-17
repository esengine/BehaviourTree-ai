const { rollup } = require('rollup');
const fs = require('fs');
const path = require('path');

// 获取Rollup配置
const rollupConfig = require('../rollup.config.js');

async function build() {
  try {
    console.log('🚀 开始构建BehaviourTree-AI...');
    
    // 确保dist目录存在
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    
    // 复制package.json到dist目录
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 修改package.json的main字段指向正确的文件
    const distPackage = {
      ...pkg,
      main: 'index.js',
      types: 'index.d.ts',
      scripts: undefined, // 移除构建脚本
      devDependencies: undefined // 移除开发依赖
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(distPackage, null, 2));
    
    // 复制其他必要文件
    const filesToCopy = ['README.md', 'LICENSE'];
    for (const file of filesToCopy) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join('dist', file));
      }
    }
    
    // 构建所有配置
    for (const config of rollupConfig) {
      console.log(`📦 构建 ${config.output.file}...`);
      
      const bundle = await rollup(config);
      await bundle.write(config.output);
      await bundle.close();
    }
    
    console.log('✅ 构建完成！输出文件：');
    const distFiles = fs.readdirSync('dist');
    distFiles.forEach(file => {
      const filePath = path.join('dist', file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`   📄 ${file} (${size} KB)`);
    });
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

build(); 