/**
 * GOOGLE BACKEND SERVICE
 * Handles communication with the Google Apps Script Web App.
 * 
 * Capabilities:
 * 1. Upload Files -> Saves to Google Drive, returns public view link.
 * 2. Log Data -> Appends rows to Google Sheets.
 */

// Your existing Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx4t9M4Igf2c8R_xwFCeuSoBRKmn2p_5wLWlWhmc8bv02ABT1cFZ9rV24t7Sulq_8OAzA/exec";

interface UploadResponse {
  result: "success" | "error";
  url?: string; // Google Drive view link
  id?: string; // File ID
  error?: string;
}

export const googleBackend = {
  /**
   * UPLOAD FILE DIRECTLY TO GOOGLE DRIVE
   * Uses Base64 + Google Apps Script
   */
  uploadFile: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const payload = {
          action: "upload_file",
          fileName: file.name,
          mimeType: file.type,
          base64
        };

        try {
          const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          // FIXED: GAS returns JSON normally in CORS mode.
          const data: UploadResponse = await res.json();

          if (data.result === "success" && data.url) {
            resolve(data.url);
          } else {
            reject(data.error || "Upload failed");
          }
        } catch (err) {
          console.error("Google Drive Upload Error:", err);
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
    });
  },

  /**
   * 🔹 LOG DATA TO GOOGLE SHEETS
   * For contact form, appointments, analytics, etc.
   */
  logData: async (
    sheetType: "appointment" | "contact",
    data: Record<string, any>
  ) => {
    const payload = {
      action: "log_data",
      sheetType,
      ...data,
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // We don't need a response
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload),
      });

      console.log("✅ Logged to Google Sheet");
    } catch (err) {
      console.error("Google Sheet Log Error:", err);
    }
  },
};
