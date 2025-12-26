import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'sudu-player-db';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_METADATA = 'metadata';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_FILES)) {
            db.createObjectStore(STORE_FILES);
        }
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
            // Key is ID
            db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
        }
    },
});

export const StorageService = {
    async saveFile(file) {
        const id = uuidv4();
        const metadata = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            addedAt: Date.now(),
            loopCount: 1,
        };

        const db = await dbPromise;
        const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
        await Promise.all([
            tx.objectStore(STORE_FILES).put(file, id),
            tx.objectStore(STORE_METADATA).put(metadata),
            tx.done,
        ]);
        return metadata;
    },

    async getAllMetadata() {
        return (await dbPromise).getAll(STORE_METADATA);
    },

    async getFileBlob(id) {
        return (await dbPromise).get(STORE_FILES, id);
    },

    async deleteFile(id) {
        const db = await dbPromise;
        const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
        await Promise.all([
            tx.objectStore(STORE_FILES).delete(id),
            tx.objectStore(STORE_METADATA).delete(id),
            tx.done,
        ]);
    },

    async updateMetadata(id, updates) {
        const db = await dbPromise;
        const item = await db.get(STORE_METADATA, id);
        if (!item) return;
        const updated = { ...item, ...updates };
        await db.put(STORE_METADATA, updated);
        return updated;
    }
};
