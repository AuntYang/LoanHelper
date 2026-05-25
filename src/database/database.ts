import * as SQLite from 'expo-sqlite';
import { LoanCase, DocumentRecord, DocType, DocOrder, ExtractedInfo, defaultExtractedInfo } from '../models/types';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('loan_helper.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS loan_cases (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      status TEXT DEFAULT 'processing',
      extracted_info TEXT DEFAULT '{}',
      pdf_uri TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      type TEXT NOT NULL,
      uri TEXT NOT NULL,
      file_name TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES loan_cases(id) ON DELETE CASCADE
    );
  `);
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ===== °¸¼þ CRUD =====
export async function createCase(clientName: string): Promise<string> {
  const id = genId();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO loan_cases (id, client_name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    [id, clientName, now, now]
  );
  return id;
}

export async function getCases(): Promise<LoanCase[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM loan_cases ORDER BY updated_at DESC');
  const results: LoanCase[] = [];
  for (const r of rows) {
    results.push(await rowToCase(r));
  }
  return results;
}

export async function getCase(caseId: string): Promise<LoanCase | null> {
  const row = await db.getFirstAsync<any>('SELECT * FROM loan_cases WHERE id = ?', [caseId]);
  return row ? rowToCase(row) : null;
}

export async function updateCaseInfo(caseId: string, info: ExtractedInfo): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE loan_cases SET extracted_info = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(info), now, caseId]
  );
}

export async function updateCaseStatus(caseId: string, status: CaseStatus): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE loan_cases SET status = ?, updated_at = ? WHERE id = ?', [status, now, caseId]);
}

export async function updateCasePdf(caseId: string, pdfUri: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE loan_cases SET pdf_uri = ?, status = ?, updated_at = ? WHERE id = ?', [pdfUri, 'completed', now, caseId]);
}

export async function deleteCase(caseId: string): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE case_id = ?', [caseId]);
  await db.runAsync('DELETE FROM loan_cases WHERE id = ?', [caseId]);
}

// ===== ÎÄµµ CRUD =====
export async function addDocument(caseId: string, type: DocType, uri: string, fileName: string): Promise<DocumentRecord> {
  const id = genId();
  const now = new Date().toISOString();
  const order = DocOrder.indexOf(type);
  await db.runAsync(
    'INSERT INTO documents (id, case_id, type, uri, file_name, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, caseId, type, uri, fileName, order, now]
  );
  return { id, caseId, type, uri, fileName, order, createdAt: now };
}

export async function getDocuments(caseId: string): Promise<DocumentRecord[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM documents WHERE case_id = ? ORDER BY sort_order ASC, created_at ASC', [caseId]
  );
  return rows.map(r => ({
    id: r.id, caseId: r.case_id, type: r.type as DocType,
    uri: r.uri, fileName: r.file_name, order: r.sort_order, createdAt: r.created_at,
  }));
}

export async function deleteDocument(docId: string): Promise<void> {
  await db.runAsync('DELETE FROM documents WHERE id = ?', [docId]);
}

// ===== ¸¨Öú =====
async function rowToCase(row: any): Promise<LoanCase> {
  const docs = await getDocuments(row.id);
  return {
    id: row.id,
    clientName: row.client_name,
    status: row.status || 'processing',
    extractedInfo: { ...defaultExtractedInfo, ...JSON.parse(row.extracted_info || '{}') },
    documents: docs,
    pdfUri: row.pdf_uri || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
