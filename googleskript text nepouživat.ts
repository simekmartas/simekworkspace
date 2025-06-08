// Google Apps Script pro Mobil Maják - správné CORS řešení
function doGet(e) {
  return handleCORS(handleRequest, e);
}

function doPost(e) {
  return handleCORS(handleRequest, e);
}

function doOptions(e) {
  // Explicitní handling pro OPTIONS preflight
  return HtmlService.createHtmlOutput('')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('CORS Preflight');
}

function handleCORS(func, e) {
  try {
    // Spusť hlavní funkci
    const result = func(e);
    
    // Pokud je výsledek JSON string, wrap ho do JSONP pokud je callback
    const callback = e.parameter.callback;
    if (callback && callback.trim() !== '') {
      const jsonpResponse = callback + '(' + JSON.stringify(result) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Jinak vrať běžný JSON
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResponse = {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
    
    const callback = e.parameter.callback;
    if (callback && callback.trim() !== '') {
      const jsonpError = callback + '(' + JSON.stringify(errorResponse) + ');';
      return ContentService
        .createTextOutput(jsonpError)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRequest(e) {
  console.log('Incoming request:', e);
  console.log('Parameters:', JSON.stringify(e.parameter));
  
  const action = e.parameter.action || 'getData';
  const sheetName = e.parameter.sheet || 'statistiky aktual';
  
  console.log('Action:', action, 'Sheet:', sheetName);
  
  if (action === 'getData') {
    return getSheetData(sheetName);
  } else if (action === 'getSheetNames') {
    return getSheetNames();
  } else {
    return {
      success: false,
      error: 'Neznámá akce: ' + action
    };
  }
}

function getSheetData(sheetName) {
  try {
    const spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
    console.log('Opening spreadsheet:', spreadsheetId);
    
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    console.log('Spreadsheet opened successfully');
    
    // Získej všechny dostupné listy pro debug
    const allSheets = spreadsheet.getSheets();
    const allSheetNames = allSheets.map(s => s.getName());
    console.log('Available sheets:', allSheetNames);
    
    let sheet = null;
    
    // Zkus najít list podle názvu
    if (sheetName && sheetName.trim() !== '') {
      console.log('Looking for sheet:', sheetName);
      
      // Zkus přesný název
      try {
        sheet = spreadsheet.getSheetByName(sheetName);
        console.log('Sheet found by exact name:', sheet.getName());
      } catch (e) {
        console.log('Exact name not found, trying alternatives...');
        
        // Zkus hledat obsahuje
        const foundSheet = allSheets.find(s => {
          const name = s.getName().toLowerCase();
          const searchName = sheetName.toLowerCase();
          return name.includes(searchName) || searchName.includes(name);
        });
        
        if (foundSheet) {
          sheet = foundSheet;
          console.log('Sheet found by partial match:', sheet.getName());
        }
      }
    }
    
    // Pokud stále není nalezen, použij první list
    if (!sheet && allSheets.length > 0) {
      sheet = allSheets[0];
      console.log('Using first available sheet:', sheet.getName());
    }
    
    if (!sheet) {
      const error = `Nepodařilo se najít žádný list. Dostupné listy: ${allSheetNames.join(', ')}. Hledaný list: "${sheetName}"`;
      console.error(error);
      throw new Error(error);
    }
    
    console.log('Final sheet selected:', sheet.getName());
    
    // Získej všechna data
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    console.log('Raw data rows:', values.length);
    console.log('First few rows:', values.slice(0, 3));
    
    // Zpracuj data - převeď na stringy a odfiltruj prázdné řádky
    const processedData = values
      .map(row => {
        return row.map(cell => {
          if (cell === null || cell === undefined) {
            return '';
          }
          // Převeď datum na string pokud je to datum
          if (cell instanceof Date) {
            return cell.toLocaleDateString('cs-CZ');
          }
          return cell.toString();
        });
      })
      .filter(row => {
        // Odfiltruj kompletně prázdné řádky
        return row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '');
      });
    
    console.log('Processed data rows:', processedData.length);
    
    const response = {
      success: true,
      data: processedData,
      sheetName: sheet.getName(),
      rowCount: processedData.length,
      columnCount: processedData.length > 0 ? processedData[0].length : 0,
      lastUpdate: new Date().toLocaleString('cs-CZ'),
      timestamp: new Date().getTime(),
      availableSheets: allSheetNames,
      requestedSheet: sheetName
    };
    
    console.log('Final response structure:', {
      success: response.success,
      dataRows: response.data.length,
      sheetName: response.sheetName,
      availableSheets: response.availableSheets
    });
    
    return response;
    
  } catch (error) {
    console.error('Error in getSheetData:', error);
    return {
      success: false,
      error: error.toString(),
      details: error.stack || 'No stack trace available'
    };
  }
}

function getSheetNames() {
  try {
    const spreadsheetId = '1t3v7I_HwbPkMdmJjNEcDN1dFDoAvood7FVyoK_PBTNE';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheets = spreadsheet.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    
    console.log('Available sheets:', sheetNames);
    
    return {
      success: true,
      sheetNames: sheetNames,
      totalSheets: sheetNames.length,
      lastUpdate: new Date().toLocaleString('cs-CZ')
    };
    
  } catch (error) {
    console.error('Error in getSheetNames:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Test funkce
function testScript() {
  console.log('=== TEST ZAČÍNÁ ===');
  
  const sheetNamesResult = getSheetNames();
  console.log('Sheet names result:', sheetNamesResult);
  
  const actualData = getSheetData('statistiky aktual');
  console.log('Actual data result:', actualData);
  
  const monthlyData = getSheetData('od 1');
  console.log('Monthly data result:', monthlyData);
  
  console.log('=== TEST DOKONČEN ===');
}