/**
 * IndexedDB utility for offline audio storage
 * Stores audio recordings when network is unavailable
 * Auto-syncs when connection is restored
 */

export interface PendingRecording {
  id: string;
  audioBlob: Blob;
  createdAt: number;
  size: number;
  attempts: number;
}

const DB_NAME = 'DecisionsOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingRecordings';

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store for pending recordings
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Save a recording to IndexedDB
 */
export async function saveRecordingToIndexedDB(audioBlob: Blob): Promise<string> {
  const database = await initDB();

  const recording: PendingRecording = {
    id: `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    audioBlob,
    createdAt: Date.now(),
    size: audioBlob.size,
    attempts: 0,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(recording);

    request.onsuccess = () => resolve(recording.id);
    request.onerror = () => reject(new Error('Failed to save recording to IndexedDB'));
  });
}

/**
 * Get all pending recordings from IndexedDB
 */
export async function getPendingRecordings(): Promise<PendingRecording[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get pending recordings'));
  });
}

/**
 * Get count of pending recordings
 */
export async function getPendingRecordingsCount(): Promise<number> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count pending recordings'));
  });
}

/**
 * Delete a recording from IndexedDB
 */
export async function deleteRecordingFromIndexedDB(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete recording from IndexedDB'));
  });
}

/**
 * Update recording attempts
 */
export async function incrementRecordingAttempts(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.get(id).onsuccess = (event) => {
      const recording = (event.target as IDBRequest).result as PendingRecording;
      if (recording) {
        recording.attempts += 1;
        store.put(recording).onsuccess = () => resolve();
      } else {
        reject(new Error('Recording not found'));
      }
    };

    transaction.onerror = () => reject(new Error('Failed to update recording'));
  });
}

/**
 * Clear all pending recordings
 */
export async function clearPendingRecordings(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear pending recordings'));
  });
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
