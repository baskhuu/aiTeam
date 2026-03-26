// migrate-logs.js
// 役割: .ai/logs/claude_cli/ の既存ファイルを aiteam.db に一括移行する（1回限り）
// 使い方: npm run migrate-logs
//         npm run migrate-logs -- --delete --confirm  ← 移行後にファイルを削除（--confirm 必須）

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..', '..');
const dbPath   = path.join(repoRoot, '.ai', 'aiteam.db');
const logsDir  = path.join(repoRoot, '.ai', 'logs', 'claude_cli');

const doDelete  = process.argv.includes('--delete');
const doConfirm = process.argv.includes('--confirm');

// ── スキーマ確保 ──────────────────────────────────────────
function ensureSchema(db) {
    db.exec(`
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
    const cols = db.prepare('PRAGMA table_info(sessions)').all().map(r => r.name);
    if (!cols.includes('jsonl_content')) db.exec('ALTER TABLE sessions ADD COLUMN jsonl_content TEXT');
    if (!cols.includes('summary_md'))    db.exec('ALTER TABLE sessions ADD COLUMN summary_md TEXT');
    if (!cols.includes('file_hash'))     db.exec('ALTER TABLE sessions ADD COLUMN file_hash TEXT');
}

// ── 最初のユーザーメッセージを取得 ───────────────────────
function extractFirstMessage(lines) {
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (obj.type !== 'user') continue;
            const msg = obj.message;
            if (!msg?.content) continue;
            if (typeof msg.content === 'string' && msg.content.trim()) return msg.content.trim();
            if (Array.isArray(msg.content)) {
                const text = msg.content.find(c => c.type === 'text')?.text?.trim();
                if (text) return text;
            }
        } catch {}
    }
    return '';
}

// ── MDサマリーを文字列として生成 ──────────────────────────
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
        } catch {}
    }
    return parts.join('\n');
}

// ── メイン ───────────────────────────────────────────────
function main() {
    if (!fs.existsSync(logsDir)) {
        console.log('ログディレクトリが存在しません:', logsDir);
        return;
    }

    const db = new Database(dbPath);
    ensureSchema(db);

    const insert = db.prepare(`
        INSERT INTO sessions (session_id, date, timestamp, jsonl_source, first_message, line_count, jsonl_content, summary_md, file_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const jsonlFiles = fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(logsDir, f));

    console.log(`対象JSONLファイル: ${jsonlFiles.length} 件`);

    let inserted = 0, skipped = 0;

    for (const filePath of jsonlFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');

        // 重複チェック
        const exists = db.prepare('SELECT id FROM sessions WHERE file_hash = ?').get(hash);
        if (exists) { skipped++; continue; }

        const lines = content.split('\n').filter(Boolean);
        const basename = path.basename(filePath); // 20260325_181025_<sessionId>.jsonl
        const parts = basename.split('_');
        const timestamp = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : parts[0];
        const date = timestamp.substring(0, 8);
        const sessionId = basename.replace(/^\d{8}_\d{6}_/, '').replace('.jsonl', '');

        const firstMessage = extractFirstMessage(lines);
        const summaryMd = buildSummary(filePath, timestamp, lines);

        insert.run(sessionId, date, timestamp, filePath, firstMessage.substring(0, 200), lines.length, content, summaryMd, hash);
        inserted++;
    }

    db.close();

    console.log(`移行完了: ${inserted} 件挿入, ${skipped} 件スキップ（重複）`);

    if (doDelete) {
        const allFiles = fs.readdirSync(logsDir);
        if (!doConfirm) {
            console.log('');
            console.log('以下のファイルを削除します:');
            allFiles.forEach(f => console.log(' ', f));
            console.log('');
            console.log('実行するには --confirm を追加してください:');
            console.log('  npm run migrate-logs -- --delete --confirm');
            return;
        }
        let deleted = 0;
        for (const f of allFiles) {
            fs.unlinkSync(path.join(logsDir, f));
            deleted++;
        }
        console.log(`旧ファイル削除: ${deleted} 件`);
    } else {
        console.log('ファイルは保持されています。削除するには --delete --confirm オプションを使用してください');
    }
}

main();
