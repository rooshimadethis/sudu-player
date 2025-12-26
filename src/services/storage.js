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
        const db = await dbPromise;
        const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
        const metadataStore = tx.objectStore(STORE_METADATA);
        const filesStore = tx.objectStore(STORE_FILES);

        // Check for existing orphaned metadata with the same name
        let id = uuidv4();
        let existingMetadata = null;

        let cursor = await metadataStore.openCursor();
        while (cursor) {
            const item = cursor.value;
            if (item.name === file.name) {
                // Check if file exists for this metadata
                const fileExists = await filesStore.count(item.id);
                if (fileExists === 0) {
                    // Found an orphan! match it.
                    id = item.id;
                    existingMetadata = item;
                    break;
                }
            }
            cursor = await cursor.continue();
        }

        const metadata = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            addedAt: existingMetadata ? existingMetadata.addedAt : Date.now(),
            order: existingMetadata ? existingMetadata.order : undefined, // Preserve order
            loopCount: existingMetadata ? existingMetadata.loopCount : 1, // Preserve loop settings
        };

        // We need a new transaction because the previous one might have committed/closed during the async cursor work?
        // Actually IDB transactions auto-commit if you await non-IDB things. 
        // But here we are just doing IDB stuff. openCursor is IDB. 
        // However, to be safe and simple with the logic (since we broke the loop), let's just use the current tx if possible or just use the values we found.
        // Re-using tx for write:

        await Promise.all([
            filesStore.put(file, id),
            metadataStore.put(metadata),
            tx.done,
        ]);
        return metadata;
    },

    async getAllMetadata() {
        return (await dbPromise).getAll(STORE_METADATA);
    },

    async verifyFilesExistence(tracks) {
        const db = await dbPromise;
        const tx = db.transaction(STORE_FILES, 'readonly');
        const store = tx.objectStore(STORE_FILES);

        const results = await Promise.all(tracks.map(async (track) => {
            const count = await store.count(track.id);
            return {
                ...track,
                missingFile: count === 0
            };
        }));
        await tx.done;
        return results;
    },

    async exportMetadata() {
        const metadata = await this.getAllMetadata();
        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        return blob;
    },

    async importMetadata(jsonString) {
        try {
            const metadata = JSON.parse(jsonString);
            if (!Array.isArray(metadata)) throw new Error('Invalid backup format');

            const db = await dbPromise;
            const tx = db.transaction(STORE_METADATA, 'readwrite');
            const store = tx.objectStore(STORE_METADATA);

            // Import all metadata. If it exists, it will be overwritten (good for updating settings).
            // We do NOT clear existing data, we merge.
            await Promise.all(metadata.map(item => store.put(item)));
            await tx.done;
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
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
    },

    async relinkFile(id, file) {
        const db = await dbPromise;
        const tx = db.transaction([STORE_FILES, STORE_METADATA], 'readwrite');
        const metaStore = tx.objectStore(STORE_METADATA);

        // Update file content
        await tx.objectStore(STORE_FILES).put(file, id);

        // Update metadata details to match new file, but preserve settings
        const currentMeta = await metaStore.get(id);
        if (currentMeta) {
            const newMeta = {
                ...currentMeta,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
            };
            await metaStore.put(newMeta);
        }

        await tx.done;
    },

    async requestPersistence() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`Persisted storage granted: ${isPersisted}`);
            return isPersisted;
        }
        return false;
    }
};
