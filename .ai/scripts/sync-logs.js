// sync-logs.js
// 役割: ~/.claude/projects/ の最新JSONLを .ai/logs/claude_cli/ にコピーし、
//       サマリーMarkdownを生成して .ai/aiteam.db に記録する
//       git commitは行わない

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const os = require('os');

// パス定義
const repoRoot = path.resolve(__dirname, '..', '..');
const dbPath = path.join(repoRoot, '.ai', 'aiteam.db');
const destDir = path.join(repoRoot, '.ai', 'logs', 'claude_cli');
const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');

// ── 最新JSONLを取得 ──────────────────────────────────────
function findLatestJsonl() {
    const files = [];
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) walk(full);
            else if (f.endsWith('.jsonl')) files.push({ path: full, mtime: stat.mtimeMs });
        }
    }
    walk(claudeProjectsDir);
    files.sort((a, b) => b.mtime - a.mtime);
    return files[0]?.path || null;
}

// ── SQLite初期化 ─────────────────────────────────────────
function initDb(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   TEXT,
            date         TEXT,
            timestamp    TEXT,
            jsonl_source TEXT,
            first_message TEXT,
            line_count   INTEGER,
            created_at   TEXT DEFAULT (datetime('now', 'localtime'))
        )
    `);
    db.exec(`
        CREATE TABLE IF NOT EXISTS gemini_decisions (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            category           TEXT,
            content            TEXT,
            status             TEXT DEFAULT 'approved',
            created_at         TEXT DEFAULT (datetime('now', 'localtime')),
            implemented_commit TEXT
        )
    `);
}

// ── JSONLをパースして最初のユーザーメッセージを取得 ────────
function parseJsonl(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    let firstMessage = '';
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (obj.type !== 'user') continue;
            const msg = obj.message;
            if (!msg?.content) continue;
            if (typeof msg.content === 'string') {
                firstMessage = msg.content.trim();
            } else if (Array.isArray(msg.content)) {
                firstMessage = msg.content.find(c => c.type === 'text')?.text?.trim() || '';
            }
            if (firstMessage) break;
        } catch {}
    }
    return { lines, firstMessage };
}

// ── Markdownサマリーを生成 ───────────────────────────────
function generateSummary(jsonlPath, mdPath, dateStr, lines) {
    const mdParts = [
        `# Claude CLI セッションログ - ${dateStr}`,
        '',
        '## メタ情報',
        `- 取得元: ${jsonlPath}`,
        `- 生成日時: ${new Date().toLocaleString('ja-JP')}`,
        `- 行数: ${lines.length}`,
        '',
        '## セッション内容',
        ''
    ];

    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (!['user', 'assistant'].includes(obj.type)) continue;
            const msg = obj.message;
            if (!msg) continue;
            const role = msg.role || obj.type;
            let text = '';
            if (typeof msg.content === 'string') {
                text = msg.content;
            } else if (Array.isArray(msg.content)) {
                text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
            }
            if (text.trim()) {
                mdParts.push(`### [${role}]`);
                mdParts.push(text.trim());
                mdParts.push('');
            }
        } catch {}
    }

    fs.writeFileSync(mdPath, mdParts.join('\n'), 'utf8');
}

// ── メイン ───────────────────────────────────────────────
function main() {
    // 1. 最新JSONL取得
    const jsonlPath = findLatestJsonl();
    if (!jsonlPath) {
        console.error('JSONLファイルが見つかりません:', claudeProjectsDir);
        process.exit(1);
    }
    console.log('取得元JSONL:', jsonlPath);

    // 2. タイムスタンプ生成
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    const date = dateStr.substring(0, 8);
    const sessionId = path.basename(jsonlPath, '.jsonl');

    // 3. コピー先ディレクトリ作成
    fs.mkdirSync(destDir, { recursive: true });

    // 4. JSONLコピー
    const destJsonl = path.join(destDir, `${dateStr}_${path.basename(jsonlPath)}`);
    fs.copyFileSync(jsonlPath, destJsonl);
    console.log('コピー完了:', destJsonl);

    // 5. パース
    const { lines, firstMessage } = parseJsonl(jsonlPath);

    // 6. Markdownサマリー生成
    const mdPath = path.join(destDir, `${dateStr}_summary.md`);
    generateSummary(jsonlPath, mdPath, dateStr, lines);
    console.log('サマリー生成:', mdPath);

    // 7. SQLiteに保存
    const db = new Database(dbPath);
    initDb(db);
    db.prepare(`
        INSERT INTO sessions (session_id, date, timestamp, jsonl_source, first_message, line_count)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, date, dateStr, jsonlPath, firstMessage.substring(0, 200), lines.length);
    db.close();
    console.log('SQLite保存完了:', dbPath);

    console.log('');
    console.log('=== 同期完了 ===');
    console.log('JSONL  :', destJsonl);
    console.log('Summary:', mdPath);
    console.log('DB     :', dbPath);
}

main();
