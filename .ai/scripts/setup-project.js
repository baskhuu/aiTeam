#!/usr/bin/env node
// setup-project.js
// 役割: aiTeam を他プロジェクトに導入するセットアップCLI
// 使い方: npx aiteam  （対象プロジェクトのルートで実行）

const fs   = require('fs');
const path = require('path');

const targetDir = process.cwd();
const sourceDir = path.resolve(__dirname, '..', '..');

// aiTeam 自身のディレクトリで実行された場合は中止
if (targetDir === sourceDir) {
    console.error('エラー: aiTeam 自身のディレクトリでは実行できません。');
    console.error('導入先プロジェクトのルートで実行してください。');
    process.exit(1);
}

console.log('aiTeam セットアップ開始');
console.log('導入先:', targetDir);
console.log('');

// ── ファイルコピー ────────────────────────────────────────
function copyFile(relPath) {
    const src  = path.join(sourceDir, relPath);
    const dest = path.join(targetDir, relPath);
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
        console.log(`スキップ（既存）: ${relPath}`);
        return;
    }
    fs.copyFileSync(src, dest);
    console.log(`コピー: ${relPath}`);
}

// コピー対象ファイル
copyFile('CLAUDE.md');
copyFile('.env.example');
copyFile('.github/copilot-instructions.md');
copyFile('.ai/scripts/sync-logs.js');
copyFile('.ai/scripts/gemini-log.js');
copyFile('.ai/scripts/migrate-logs.js');

// .ai/logs/ ディレクトリだけ作成（中身はコピーしない）
const logsDir = path.join(targetDir, '.ai', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('作成: .ai/logs/');
}

// ── package.json に scripts を追記 ───────────────────────
const pkgPath = path.join(targetDir, 'package.json');
let pkg;
if (fs.existsSync(pkgPath)) {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} else {
    pkg = { name: path.basename(targetDir), version: '1.0.0', scripts: {} };
}

pkg.scripts = pkg.scripts || {};
const aiScripts = { sync: 'node .ai/scripts/sync-logs.js', 'gemini-log': 'node .ai/scripts/gemini-log.js', 'migrate-logs': 'node .ai/scripts/migrate-logs.js' };
let scriptsAdded = 0;
for (const [key, val] of Object.entries(aiScripts)) {
    if (!pkg.scripts[key]) {
        pkg.scripts[key] = val;
        scriptsAdded++;
    }
}

pkg.dependencies = pkg.dependencies || {};
if (!pkg.dependencies['sql.js']) {
    pkg.dependencies['sql.js'] = '^1.12.0';
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`package.json 更新: スクリプト ${scriptsAdded} 件追加`);

// ── .gitignore に aiTeam 除外ルールを追記 ────────────────
const gitignorePath = path.join(targetDir, '.gitignore');
const aiIgnoreBlock = `
# aiTeam
.ai/logs/
.ai/*.db
.env
`;
const currentIgnore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
if (!currentIgnore.includes('# aiTeam')) {
    fs.appendFileSync(gitignorePath, aiIgnoreBlock, 'utf8');
    console.log('.gitignore に aiTeam 除外ルールを追記');
}

// ── 完了メッセージ ────────────────────────────────────────
console.log('');
console.log('=== セットアップ完了 ===');
console.log('');
console.log('次のステップ:');
console.log('  1. npm install          # better-sqlite3 をインストール');
console.log('  2. CLAUDE.md を編集     # プロジェクト名・チーム構成を更新');
console.log('  3. Claude Code CLI の Stop hook を設定:');
console.log('       .claude/settings.json の hooks.Stop に以下を追加:');
console.log('       { "type": "command", "command": "node .ai/scripts/sync-logs.js" }');
