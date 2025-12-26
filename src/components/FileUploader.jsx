import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storage';

export function FileUploader({ onUploadComplete }) {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of files) {
                if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                    await StorageService.saveFile(file);
                }
            }
            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to save files. Check storage quota.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-4">
            <input
                type="file"
                multiple
                accept="audio/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center justify-center w-full px-6 py-4 space-x-2 text-lg font-bold text-black transition-transform bg-white rounded-full active:scale-95 disabled:opacity-50 shadow-lg hover:bg-gray-100"
            >
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <Upload className="w-6 h-6" />
                )}
                <span>{isUploading ? 'Saving...' : 'Add Media'}</span>
            </button>
            <p className="mt-2 text-xs text-center text-neutral-500">
                Files are stored locally on your device.
            </p>
        </div>
    );
}
