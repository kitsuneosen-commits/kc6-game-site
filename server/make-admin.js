/**
 * KC-6游戏站 - 管理员设置工具
 * 
 * 用法：
 *   node make-admin.js <MIS_ID>        设置指定用户为管理员
 *   node make-admin.js --list          查看所有用户
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'db', 'kc6.db'));

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
🔑 KC-6游戏站 管理员设置工具

用法：
  node make-admin.js <MIS_ID>    将指定用户设为管理员
  node make-admin.js --list      列出所有用户
  node make-admin.js --help      显示帮助
`);
  process.exit(0);
}

if (args[0] === '--list') {
  const users = db.prepare('SELECT id, mis_id, nickname, role, points, created_at FROM users ORDER BY id').all();
  if (users.length === 0) {
    console.log('暂无注册用户。请先在网站注册一个账号。');
  } else {
    console.log(`\n共 ${users.length} 个用户：\n`);
    console.log('ID  | MIS ID          | 昵称             | 角色     | 积分  | 注册时间');
    console.log('-'.repeat(85));
    for (const u of users) {
      const role = u.role === 'admin' ? '🔑管理员' : u.role === 'verified' ? '✅已认证' : '👤普通';
      console.log(`${String(u.id).padEnd(3)} | ${u.mis_id.padEnd(15)} | ${(u.nickname || '').padEnd(16)} | ${role.padEnd(8)} | ${String(u.points).padEnd(5)} | ${u.created_at}`);
    }
  }
  console.log('');
  process.exit(0);
}

const misId = args[0];
const user = db.prepare('SELECT id, mis_id, nickname, role FROM users WHERE mis_id = ?').get(misId);
if (!user) {
  console.log(`❌ 用户 "${misId}" 不存在，请先在网站注册这个账号。`);
  console.log('💡 提示：运行 node make-admin.js --list 查看所有已注册用户。');
  process.exit(1);
}

if (user.role === 'admin') {
  console.log(`ℹ️ 用户 "${misId}" (${user.nickname}) 已经是管理员了。`);
  process.exit(0);
}

db.prepare("UPDATE users SET role = 'admin' WHERE mis_id = ?").run(misId);
console.log(`✅ 成功！用户 "${misId}" (${user.nickname}) 已被设为管理员。`);
console.log('🌐 现在登录网站，点击右上角头像即可看到「管理后台」入口。');
