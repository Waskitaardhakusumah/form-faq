// Configuration
const BRAND_CONFIGS = {
  'nb': {
    folderId: 'YOUR_NB_FOLDER_ID',
    spreadsheetId: 'YOUR_NB_SPREADSHEET_ID',
    name: 'Reguler'
  },
  'mas': {
    folderId: 'YOUR_MAS_FOLDER_ID',
    spreadsheetId: 'YOUR_MAS_SPREADSHEET_ID',
    name: 'MasKu'
  },
  'mtr': {
    folderId: 'YOUR_MTR_FOLDER_ID',
    spreadsheetId: 'YOUR_MTR_SPREADSHEET_ID',
    name: 'MotorKu'
  },
  'mbl': {
    folderId: 'YOUR_MBL_FOLDER_ID',
    spreadsheetId: 'YOUR_MBL_SPREADSHEET_ID',
    name: 'MobilKu'
  }
};

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
      const brand = data.brand;
      
      if (!brand || !BRAND_CONFIGS[brand]) {
        throw new Error('Invalid brand');
      }
      
      // Create a new folder for this submission
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `${BRAND_CONFIGS[brand].name}_${timestamp}`;
      const folder = DriveApp.getFolderById(BRAND_CONFIGS[brand].folderId).createFolder(folderName);
      
      // Upload the file to the folder
      const file = folder.createFile(fileBlob);
      file.setName(fileName);
      
      // Get the spreadsheet URL
      const spreadsheet = SpreadsheetApp.openById(BRAND_CONFIGS[brand].spreadsheetId);
      const spreadsheetUrl = spreadsheet.getUrl();
      
      // Return the file URL and spreadsheet URL
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        fileUrl: file.getUrl(),
        folderUrl: folder.getUrl(),
        spreadsheetUrl: spreadsheetUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // If it's a form submission
    if (data.fileData) {
      const fileData = JSON.parse(data.fileData);
      const ticketNumber = generateTicketNumber();
      const spreadsheetLinks = {};
      
      // Group files by brand
      const filesByBrand = {};
      fileData.forEach(file => {
        if (!filesByBrand[file.brand]) {
          filesByBrand[file.brand] = [];
        }
        filesByBrand[file.brand].push(file.url);
      });
      
      // Add entries to brand-specific spreadsheets
      Object.entries(filesByBrand).forEach(([brand, fileUrls]) => {
        if (BRAND_CONFIGS[brand]) {
          const sheet = SpreadsheetApp.openById(BRAND_CONFIGS[brand].spreadsheetId).getSheetByName(SHEET_NAME);
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
          
          // Store spreadsheet URL
          spreadsheetLinks[BRAND_CONFIGS[brand].name] = sheet.getParent().getUrl();
        }
      });
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        ticketNumber: ticketNumber,
        spreadsheetLinks: spreadsheetLinks
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

// Create the spreadsheet for a brand if it doesn't exist
function createBrandSpreadsheet(brand) {
  if (!BRAND_CONFIGS[brand]) {
    throw new Error('Invalid brand');
  }
  
  const ss = SpreadsheetApp.create(`${BRAND_CONFIGS[brand].name} File Uploads`);
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