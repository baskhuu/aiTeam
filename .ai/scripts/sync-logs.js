// sync-logs.js
// 役割: ~/.claude/projects/ の最新JSONLを読み取り、内容をすべて aiteam.db に保存する
//       ファイルへの書き出しは行わない / git commitは行わない

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// パス定義
const repoRoot = path.resolve(__dirname, '..', '..');
const dbPath = path.join(repoRoot, '.ai', 'aiteam.db');
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
    files.sort((a, b) => b.mtime - a.mtime || b.path.localeCompare(a.path));
    return files[0]?.path || null;
}

// ── DB ロード／セーブ ─────────────────────────────────────
function loadDb(SQL) {
    if (fs.existsSync(dbPath)) return new SQL.Database(fs.readFileSync(dbPath));
    return new SQL.Database();
}

function saveDb(db) {
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

// ── SQLite初期化 ─────────────────────────────────────────
function initDb(db) {
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id    TEXT,
            date          TEXT,
            timestamp     TEXT,
            jsonl_source  TEXT,
            first_message TEXT,
            line_count    INTEGER,
            created_at    TEXT DEFAULT (datetime('now', 'localtime')),
            jsonl_content TEXT,
            summary_md    TEXT,
            file_hash     TEXT
        )
    `);
    const colResult = db.exec('PRAGMA table_info(sessions)');
    const cols = colResult.length > 0 ? colResult[0].values.map(r => r[1]) : [];
    if (!cols.includes('jsonl_content')) db.run('ALTER TABLE sessions ADD COLUMN jsonl_content TEXT');
    if (!cols.includes('summary_md'))    db.run('ALTER TABLE sessions ADD COLUMN summary_md TEXT');
    if (!cols.includes('file_hash'))     db.run('ALTER TABLE sessions ADD COLUMN file_hash TEXT');

    db.run(`
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
function parseJsonl(content) {
    const lines = content.split('\n').filter(Boolean);
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
        } catch (e) {
            console.warn(`行パース失敗（スキップ）: ${line.substring(0, 80)}`);
        }
    }
    return { lines, firstMessage };
}

// ── Markdownサマリーを文字列として生成 ───────────────────
function buildSummary(jsonlPath, dateStr, lines) {
    const parts = [
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
            if (typeof msg.content === 'string') text = msg.content;
            else if (Array.isArray(msg.content))
                text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
            if (text.trim()) { parts.push(`### [${role}]`); parts.push(text.trim()); parts.push(''); }
        } catch (e) {
            console.warn(`サマリー生成スキップ: ${line.substring(0, 80)}`);
        }
    }
    return parts.join('\n');
}

// ── メイン ───────────────────────────────────────────────
async function main() {
    // 1. 最新JSONL取得
    const jsonlPath = findLatestJsonl();
    if (!jsonlPath) {
        console.error('JSONLファイルが見つかりません:', claudeProjectsDir);
        process.exit(1);
    }
    console.log('取得元JSONL:', jsonlPath);

    // 2. ファイル読み込み・ハッシュ計算
    const jsonlContent = fs.readFileSync(jsonlPath, 'utf8');
    const fileHash = crypto.createHash('sha256').update(jsonlContent).digest('hex');

    // 3. タイムスタンプ生成
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    const date = dateStr.substring(0, 8);
    const sessionId = path.basename(jsonlPath, '.jsonl');

    // 4. DB初期化
    const SQL = await initSqlJs();
    const db = loadDb(SQL);
    initDb(db);

    // 5. 重複チェック
    const stmt = db.prepare('SELECT id FROM sessions WHERE file_hash = ?');
    stmt.bind([fileHash]);
    const exists = stmt.step();
    stmt.free();
    if (exists) {
        console.log('変更なし（同一ハッシュ）、スキップします');
        db.close();
        return;
    }

    // 6. パース
    const { lines, firstMessage } = parseJsonl(jsonlContent);

    // 7. MDサマリー生成
    const summaryMd = buildSummary(jsonlPath, dateStr, lines);

    // 8. SQLiteに保存
    db.run(
        `INSERT INTO sessions (session_id, date, timestamp, jsonl_source, first_message, line_count, jsonl_content, summary_md, file_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, date, dateStr, jsonlPath, firstMessage.substring(0, 200), lines.length, jsonlContent, summaryMd, fileHash]
    );

    saveDb(db);
    db.close();

    console.log('');
    console.log('=== 同期完了 ===');
    console.log('DB     :', dbPath);
    console.log('行数   :', lines.length);
    console.log('冒頭   :', firstMessage.substring(0, 60));
}

main().catch(e => { console.error(e); process.exit(1); });
