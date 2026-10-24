const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = 'C:\\Users\\Admin\\bientruyen-reader';
const TARGET_REPO = 'https://github.com/banderas0801/taao.git';
const TARGET_BRANCH = 'refactor/vieneu-v3nano-blueprint';

console.log('======================================================================');
console.log('🚀 TIẾN TRÌNH ĐẨY CODE LÊN GITHUB: ' + TARGET_REPO);
console.log('📌 Nhánh đích: ' + TARGET_BRANCH);
console.log('======================================================================\n');

// 1. Đảm bảo Git có trong PATH
function ensureGitInPath() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    const commonGitPaths = [
      'C:\\Program Files\\Git\\cmd',
      'C:\\Program Files\\Git\\bin',
      'C:\\Users\\Admin\\AppData\\Local\\Programs\\Git\\cmd',
      'C:\\Program Files (x86)\\Git\\cmd'
    ];
    for (const p of commonGitPaths) {
      if (fs.existsSync(path.join(p, 'git.exe'))) {
        process.env.PATH = p + ';' + process.env.PATH;
        console.log('✅ Tìm thấy Git tại: ' + p);
        return true;
      }
    }
  }
  return false;
}

if (!ensureGitInPath()) {
  console.error('❌ KHÔNG TÌM THẤY GIT TRÊN MÁY! Vui lòng cài đặt Git for Windows.');
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log('👉 Chạy: ' + cmd);
  try {
    const res = execSync(cmd, { cwd: PROJECT_DIR, stdio: 'inherit', env: process.env, ...opts });
    return true;
  } catch (err) {
    console.error('⚠️ Lệnh gặp lỗi: ' + (err.message || err));
    return false;
  }
}

// Chuyển vào thư mục dự án
process.chdir(PROJECT_DIR);

// Bước 1: Cấu hình remote
console.log('\n[1/6] Kiểm tra và thiết lập remote origin...');
try {
  const remotes = execSync('git remote', { cwd: PROJECT_DIR, encoding: 'utf8' });
  if (remotes.includes('origin')) {
    execSync(`git remote set-url origin ${TARGET_REPO}`, { cwd: PROJECT_DIR, stdio: 'inherit' });
  } else {
    execSync(`git remote add origin ${TARGET_REPO}`, { cwd: PROJECT_DIR, stdio: 'inherit' });
  }
  console.log('✅ Remote origin đã cấu hình trỏ tới: ' + TARGET_REPO);
} catch (e) {
  console.error('Lỗi cấu hình remote:', e.message);
}

// Bước 2: Fetch thông tin từ GitHub
console.log('\n[2/6] Lấy thông tin từ GitHub (git fetch origin)...');
run('git fetch origin');

// Bước 3: Chỉ thêm src, scripts, .gitignore (TUYỆT ĐỐI KHÔNG add scratch hoặc .env)
console.log('\n[3/6] Thêm file an toàn (src/, scripts/, .gitignore)...');
run('git add src/ scripts/ .gitignore');

// Bước 4: Kiểm tra staging diff
console.log('\n[4/6] KIỂM TRA BẢO MẬT (Các file chuẩn bị commit):');
console.log('----------------------------------------------------------------------');
run('git --no-pager diff --cached --stat');
console.log('----------------------------------------------------------------------');
console.log('🔒 Đảm bảo KHÔNG có file scratch/, sync_to_vps.cjs hay file mật khẩu nào.');

// Bước 5: Chuyển nhánh và commit
console.log('\n[5/6] Chuyển sang nhánh ' + TARGET_BRANCH + ' và tạo commit...');
run(`git checkout -B ${TARGET_BRANCH}`);
const commitMsg = 'feat(tts): complete vieneu v3nano blueprint with strict typing, atomic npz artifacts, and security';
try {
  execSync(`git commit -m "${commitMsg}"`, { cwd: PROJECT_DIR, stdio: 'inherit' });
  console.log('✅ Đã tạo commit thành công.');
} catch (e) {
  console.log('ℹ️ Không có thay đổi mới nào cần commit thêm (hoặc đã commit trước đó). Tiếp tục push...');
}

// Bước 6: Push lên GitHub
console.log('\n[6/6] Đẩy nhánh ' + TARGET_BRANCH + ' lên GitHub...');
const pushSuccess = run(`git push -u origin ${TARGET_BRANCH}`);

console.log('\n======================================================================');
if (pushSuccess) {
  console.log('🎉 ĐÃ PUSH THÀNH CÔNG LÊN GITHUB!');
  console.log('👉 Xem nhánh review: https://github.com/banderas0801/taao/tree/' + TARGET_BRANCH);
  console.log('👉 Xem Pull Request / Diff: https://github.com/banderas0801/taao/compare/' + TARGET_BRANCH);
} else {
  console.log('❌ PUSH THẤT BẠI HOẶC CẦN XÁC THỰC GITHUB.');
  console.log('Nếu GitHub yêu cầu đăng nhập (Personal Access Token / Sign in browser),');
  console.log('vui lòng đăng nhập theo hộp thoại hiện lên trên màn hình.');
}
console.log('======================================================================\n');
