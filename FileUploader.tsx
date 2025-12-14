import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { api } from "../lib/api";

interface FileUploaderProps {
  label?: string;
  onUpload: (url: string) => void; // returns Google Drive URL
  defaultUrl?: string;
}

export default function FileUploader({ label = "Upload File", onUpload, defaultUrl }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultUrl || null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Upload to Google Drive via api.uploadFile()
      const url = await api.uploadFile(file);

      // Preview File Locally
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null); // Only image preview
      }

      onUpload(url);
    } catch (err) {
      alert("Upload failed. Try again.");
      console.error(err);
    }

    setUploading(false);
  };

  const clearFile = () => {
    setPreview(null);
    onUpload(""); // Clear url in parent
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>}

      <label
        className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer
        border-slate-300 dark:border-slate-600 hover:border-blue-500 transition"
      >
        <input type="file" className="hidden" onChange={handleFile} />

        <div className="flex flex-col items-center gap-2">
          <Upload className="w-6 h-6 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {uploading ? "Uploading..." : "Click to upload"}
          </span>
        </div>
      </label>

      {/* Preview image if available */}
      {preview && (
        <div className="relative w-fit mt-2">
          <img
            src={preview}
            className="max-h-40 rounded-lg shadow-md border border-slate-300 dark:border-slate-700"
          />
          <button
            onClick={clearFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
