// Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your spreadsheet ID
const FOLDER_ID = 'YOUR_FOLDER_ID'; // Replace with your Google Drive folder ID
const SHEET_NAME = 'FileUploads';

// Handle file upload
function doPost(e) {
  try {
    const data = e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
    
    // If it's a file upload request
    if (e.postData.type === "application/x-www-form-urlencoded") {
      const fileBlob = e.postData.contents;
      const fileName = data.fileName;
      const fileType = data.fileType;
      
      // Create a new folder for this submission
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `Submission_${timestamp}`;
      const folder = DriveApp.getFolderById(FOLDER_ID).createFolder(folderName);
      
      // Upload the file to the folder
      const file = folder.createFile(fileBlob);
      file.setName(fileName);
      
      // Return the file URL
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        fileUrl: file.getUrl(),
        folderUrl: folder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // If it's a form submission
    if (data.fileUrls) {
      const fileUrls = JSON.parse(data.fileUrls);
      const ticketNumber = generateTicketNumber();
      
      // Add entry to spreadsheet
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      const rowData = [
        ticketNumber,
        new Date(),
        data.brand || '',
        data.errorSystem || '',
        data.region || '',
        data.cabang || '',
        data.NCust || '',
        data.IdCust || '',
        data.pic || '',
        data.NoKwn || '',
        data.IdPolo || '',
        data.NoApp || '',
        data.NoOdrn || '',
        data.issue || '',
        fileUrls.join(', ')
      ];
      sheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        ticketNumber: ticketNumber,
        folderUrl: fileUrls[0] ? DriveApp.getFileById(DriveApp.getFileByUrl(fileUrls[0]).getId()).getParents().next().getUrl() : ''
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Invalid request'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Generate a unique ticket number
function generateTicketNumber() {
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `WOM-${timestamp.slice(-8)}-${random}`;
}

// Create the spreadsheet if it doesn't exist
function createSpreadsheet() {
  const ss = SpreadsheetApp.create('FAQ File Uploads');
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  
  // Add headers
  const headers = [
    'Ticket Number',
    'Timestamp',
    'Brand',
    'Error System',
    'Region',
    'Cabang',
    'Customer Name',
    'Customer ID',
    'PIC',
    'No Kawan',
    'Task ID Polo',
    'No APP',
    'No Odrn',
    'Issue',
    'File URLs'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285f4')
    .setFontColor('white')
    .setFontWeight('bold');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  return ss.getId();
} 