
# Google Apps Script Setup (Drive Upload + Sheet Logging)

To enable **File Uploads to Google Drive** and **Data Logging to Sheets**, replace your existing script with this one.

**INSTRUCTIONS:**

1.  Open your **Google Sheet**.
2.  Go to **Extensions** > **Apps Script**.
3.  **DELETE ALL EXISTING CODE** in `Code.gs`.
4.  **PASTE** the code below.
5.  **Run** the `setup()` function once (select `setup` in the toolbar and click Run) to permit scopes.
6.  **Deploy** as a Web App (New Version, Execute as Me, Access: Anyone).

```javascript
/* 
  SKYSTUPA ARCHITECT - BACKEND API 
  Handles:
  1. Uploading files to Google Drive (returns public link)
  2. Logging data to Google Sheets
  3. Sending Emails
*/

// --- CONFIGURATION ---
// Replace with the ID of the folder where you want images/videos saved
// You can find this in the URL of the folder: drive.google.com/drive/folders/YOUR_FOLDER_ID
const DRIVE_FOLDER_ID = 'root'; // Change 'root' to a specific folder ID if desired

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = {};

    if (action === 'upload_file') {
      result = handleFileUpload(data);
    } else if (action === 'log_data') {
      result = handleLogData(data);
    } else {
      // Fallback for legacy email-only calls
      result = handleLegacyEmail(data);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handles File Uploads to Google Drive
 */
function handleFileUpload(data) {
  try {
    var folder = (DRIVE_FOLDER_ID === 'root') ? DriveApp.getRootFolder() : DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    var contentType = data.mimeType || 'application/octet-stream';
    var decoded = Utilities.base64Decode(data.base64);
    var blob = Utilities.newBlob(decoded, contentType, data.fileName);
    
    var file = folder.createFile(blob);
    
    // Set permission to anyone with link so it displays on website
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Construct a direct viewable URL (Thumbnail hack or Export view)
    // webContentLink often forces download. We use the lh3.googleusercontent method or standard ID method
    // Standard: https://drive.google.com/uc?export=view&id=FILE_ID
    var fileId = file.getId();
    var viewUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

    return {
      result: 'success',
      url: viewUrl,
      id: fileId
    };
  } catch (err) {
    return { result: 'error', error: err.toString() };
  }
}

/**
 * Handles Logging to Sheets (Appointments & Contacts)
 */
function handleLogData(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var timestamp = new Date();
  
  if (data.sheetType === 'appointment') {
    sheet.appendRow([
      timestamp,
      "APPOINTMENT",
      data.fullName || data.name,
      data.email,
      data.phoneNumber || data.phone,
      data.serviceType,
      data.appointmentType,
      data.preferredDate,
      data.preferredTime,
      data.projectDetails || data.message
    ]);
  } else {
    // Contact Form
    sheet.appendRow([
      timestamp,
      "CONTACT",
      data.name,
      data.email,
      data.phone,
      data.subject || "N/A",
      data.message
    ]);
  }
  
  return { result: 'success' };
}

/**
 * Legacy Email Handler (Backup for existing code)
 */
function handleLegacyEmail(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // Simple Log
  sheet.appendRow([new Date(), "EMAIL_LOG", data.email, JSON.stringify(data)]);
  
  if (data.email && data.emailBody) {
    MailApp.sendEmail({
      to: data.email,
      subject: data.emailSubject || "Notification",
      htmlBody: data.emailBody
    });
  }
  return { result: 'success' };
}

function setup() {
  // Run this once to trigger permission dialogs
  DriveApp.getFiles();
  MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getActiveSpreadsheet();
}
```