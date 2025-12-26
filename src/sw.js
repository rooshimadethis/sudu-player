import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Clean up old caches and precache resources
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

const DB_NAME = 'sudu-share-handoff';
const DB_VERSION = 1;
const STORE_NAME = 'shared-files';

async function openShareDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
    });
}

async function saveSharedFile(file) {
    const db = await openShareDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(file);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname === '/share-target') {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    const mediaFiles = formData.getAll('media');

                    await Promise.all(mediaFiles.map(file => saveSharedFile(file)));

                    // Redirect to the app root after handling the share
                    return Response.redirect('/', 303);
                } catch (error) {
                    console.error('Share target failed:', error);
                    // Fallback redirect
                    return Response.redirect('/', 303);
                }
            })()
        );
    }
});
