import { openDB } from 'idb';

const DB_NAME = 'scene-partner';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clips')) {
          db.createObjectStore('clips', { keyPath: 'lineIndex' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveClip(lineIndex, blob) {
  const db = await getDB();
  await db.put('clips', { lineIndex, blob, savedAt: Date.now() });
}

export async function getClip(lineIndex) {
  const db = await getDB();
  const record = await db.get('clips', lineIndex);
  return record?.blob || null;
}

export async function getAllClipIndexes() {
  const db = await getDB();
  const all = await db.getAll('clips');
  return all.map(r => r.lineIndex);
}

export async function deleteClip(lineIndex) {
  const db = await getDB();
  await db.delete('clips', lineIndex);
}

export async function saveScript(script) {
  const db = await getDB();
  await db.put('meta', script, 'script');
}

export async function loadScript() {
  const db = await getDB();
  return db.get('meta', 'script');
}

export async function clearAll() {
  const db = await getDB();
  await db.clear('clips');
  await db.clear('meta');
}
