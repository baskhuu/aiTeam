// gemini-log.js
// 役割: Geminiの決定事項・承認内容をSQLiteに記録する
// 使い方: npm run gemini-log -- --category "approval" --content "内容"
//         npm run gemini-log -- --category "architecture" --content "内容" --status "pending"
//         npm run gemini-log -- --list

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const dbPath = path.join(repoRoot, '.ai', 'aiteam.db');
const historyPath = path.join(repoRoot, '.ai', 'AITEAM_HISTORY.md');

// ── 引数パース ───────────────────────────────────────────
function parseArgs(args) {
    const result = { category: null, content: null, status: 'approved', commit: null, list: false };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--category')  result.category = args[i + 1];
        if (args[i] === '--content')   result.content  = args[i + 1];
        if (args[i] === '--status')    result.status   = args[i + 1];
        if (args[i] === '--commit')    result.commit   = args[i + 1];
        if (args[i] === '--list')      result.list     = true;
    }
    return result;
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

// ── 一覧表示 ─────────────────────────────────────────────
function listDecisions(db) {
    const result = db.exec(`
        SELECT id, category, status, created_at, substr(content, 1, 60) AS excerpt, implemented_commit
        FROM gemini_decisions ORDER BY id DESC LIMIT 20
    `);
    if (!result.length || !result[0].values.length) {
        console.log('記録なし');
        return;
    }
    console.log('\n=== Gemini決定事項 (最新20件) ===');
    const cols = result[0].columns;
    for (const row of result[0].values) {
        const r = Object.fromEntries(cols.map((c, i) => [c, row[i]]));
        console.log(`[${r.id}] ${r.created_at} [${r.category}] [${r.status}]`);
        console.log(`    ${r.excerpt}${r.excerpt && r.excerpt.length >= 60 ? '...' : ''}`);
        if (r.implemented_commit) console.log(`    実装コミット: ${r.implemented_commit}`);
    }
}

// ── AITEAM_HISTORY.md へ追記 ──────────────────────────────
function appendToHistory(category, content, createdAt) {
    if (!fs.existsSync(historyPath)) {
        throw new Error(`AITEAM_HISTORY.md が見つかりません: ${historyPath}`);
    }

    const entry = `\n### [Gemini決定] ${createdAt} (${category})\n- ${content}\n`;
    const marker = '### 課題・TODO';
    const historyContent = fs.readFileSync(historyPath, 'utf8');

    // TODOセクションの直前に挿入（存在しない場合は末尾に追記）
    const markerIndex = historyContent.indexOf(marker);
    let updated;
    if (markerIndex >= 0) {
        updated = historyContent.substring(0, markerIndex) + entry + historyContent.substring(markerIndex);
    } else {
        updated = historyContent + entry;
    }
    fs.writeFileSync(historyPath, updated, 'utf8');
    console.log('AITEAM_HISTORY.md に追記しました');
}

// ── メイン ───────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const opts = parseArgs(args);

    const SQL = await initSqlJs();
    const db = loadDb(SQL);
    initDb(db);

    if (opts.list) {
        listDecisions(db);
        db.close();
        return;
    }

    if (!opts.category || !opts.content) {
        console.error('使い方: npm run gemini-log -- --category <種別> --content <内容>');
        console.error('        npm run gemini-log -- --list');
        console.error('種別例: approval / architecture / version / rule');
        db.close();
        process.exit(1);
    }

    // AITEAM_HISTORY.md への書き込みが必要な場合、DB記録前に検証
    const needsHistory = ['approval', 'architecture', 'rule'].includes(opts.category);
    if (needsHistory && !fs.existsSync(historyPath)) {
        console.error(`エラー: AITEAM_HISTORY.md が見つかりません: ${historyPath}`);
        db.close();
        process.exit(1);
    }

    db.run(
        `INSERT INTO gemini_decisions (category, content, status, implemented_commit) VALUES (?, ?, ?, ?)`,
        [opts.category, opts.content, opts.status, opts.commit || null]
    );

    const rowid = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    const createdAt = db.exec(`SELECT created_at FROM gemini_decisions WHERE id = ${rowid}`)[0].values[0][0];

    // 重要カテゴリは AITEAM_HISTORY.md にも追記（失敗時はDBレコードを削除してロールバック）
    if (needsHistory) {
        try {
            appendToHistory(opts.category, opts.content, createdAt);
        } catch (e) {
            db.run(`DELETE FROM gemini_decisions WHERE id = ${rowid}`);
            saveDb(db);
            db.close();
            console.error('エラー: AITEAM_HISTORY.md への追記に失敗しました。DB記録を取り消しました。');
            console.error(e.message);
            process.exit(1);
        }
    }

    saveDb(db);
    db.close();

    console.log(`記録しました [id=${rowid}] [${opts.category}] [${opts.status}]`);
    console.log(`内容: ${opts.content}`);
}

main().catch(e => { console.error(e); process.exit(1); });
