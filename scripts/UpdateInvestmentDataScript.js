// Google Apps Script for updating Mutual Fund NAVs and Equity prices
// This script should be deployed as a standalone Google Apps Script project

// Your Firebase service account details (from the downloaded JSON file)
const FIREBASE_PROJECT_ID = "porttrack-19b41"; // Update with your project ID
const FIREBASE_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@porttrack-19b41.iam.gserviceaccount.com"; // Update with your client email
const FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n...YOUR PRIVATE KEY HERE...-----END PRIVATE KEY-----\n"; // Update with your private key

// Firestore collection path
const INVESTMENTS_COLLECTION = "investments";

// AMFI NAV file URL
const AMFI_NAV_ALL_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

// Fetch mutual fund NAV data from AMFI
function fetchMutualFundNAVs() {
  try {
    console.log("Fetching Mutual Fund NAVs from AMFI...");
    const response = UrlFetchApp.fetch(AMFI_NAV_ALL_URL);
    const content = response.getContentText();
    
    // Parse the NAV data
    const navData = parseMutualFundData(content);
    console.log(`Parsed ${Object.keys(navData).length} mutual fund schemes`);
    
    return navData;
  } catch (error) {
    console.error("Error fetching Mutual Fund NAVs:", error);
    return {};
  }
}

// Parse the mutual fund data from the AMFI file
function parseMutualFundData(navFileContent) {
  const lines = navFileContent.split("\n");
  const navMap = {};
  
  let currentFundHouse = "";
  let currentScheme = "";
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Fund house line
    if (line.includes(';')) {
      currentFundHouse = line.split(";")[0].trim();
      continue;
    }
    
    // Scheme data line with NAV
    const parts = line.split(/\s{2,}/);
    if (parts.length >= 4) {
      const schemeCode = parts[0].trim();
      const schemeName = parts[1].trim();
      const navStr = parts[parts.length - 1].trim();
      const nav = parseFloat(navStr);
      
      if (!isNaN(nav)) {
        const key = `${currentFundHouse}-${schemeName}`;
        navMap[key] = nav * 100; // Convert to paise
      }
    }
  }
  
  return navMap;
}

// Fetch equity stock prices from Yahoo Finance
function fetchEquityPrices(tickers) {
  const prices = {};
  
  for (const ticker of tickers) {
    try {
      // Add .NS suffix for NSE stocks
      const fullTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullTicker}?interval=1d`;
      
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());
      
      if (data && data.chart && data.chart.result && data.chart.result[0]) {
        const quote = data.chart.result[0].meta;
        const currentPrice = quote.regularMarketPrice;
        
        if (currentPrice) {
          prices[ticker] = Math.round(currentPrice * 100); // Convert to paise
          console.log(`Fetched price for ${ticker}: ${currentPrice}`);
        }
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
    }
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  return prices;
}

// Update Firestore documents with new NAV/price data
function updateFirestoreData(navData, priceData) {
  try {
    // Get all investments from Firestore
    const investments = getInvestmentsFromFirestore();
    if (!investments.length) {
      console.log("No investments found in Firestore");
      return;
    }
    
    console.log(`Found ${investments.length} investments to update`);
    
    // Count of updated documents
    let updatedCount = 0;
    
    // Loop through investments and update NAV/price
    for (const investment of investments) {
      const id = investment.id;
      const type = investment.type;
      
      let updates = null;
      
      if ((type === "Mutual Fund" || type === "SIP") && investment.status === "Active") {
        const key = `${investment.fundHouse}-${investment.schemeName}`;
        if (navData[key]) {
          updates = { currentNAV: navData[key] };
          console.log(`Updating NAV for ${key} to ${navData[key]}`);
        }
      } else if (type === "Equity" && investment.status === "Active") {
        if (priceData[investment.ticker]) {
          updates = { currentPrice: priceData[investment.ticker] };
          console.log(`Updating price for ${investment.ticker} to ${priceData[investment.ticker]}`);
        }
      }
      
      if (updates) {
        // Update the Firestore document
        updateFirestoreDocument(id, updates);
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} investments`);
    
  } catch (error) {
    console.error("Error updating Firestore data:", error);
  }
}

// Get all investments from Firestore
function getInvestmentsFromFirestore() {
  const firestore = getFirestoreInstance();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${INVESTMENTS_COLLECTION}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + getAccessToken()
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (data && data.documents) {
      return data.documents.map(doc => {
        const id = doc.name.split('/').pop();
        const fields = doc.fields;
        
        // Convert Firestore fields to JavaScript object
        const investment = { id };
        
        for (const key in fields) {
          // Handle different Firestore field types
          if (fields[key].stringValue !== undefined) {
            investment[key] = fields[key].stringValue;
          } else if (fields[key].integerValue !== undefined) {
            investment[key] = parseInt(fields[key].integerValue);
          } else if (fields[key].doubleValue !== undefined) {
            investment[key] = parseFloat(fields[key].doubleValue);
          } else if (fields[key].booleanValue !== undefined) {
            investment[key] = fields[key].booleanValue;
          }
        }
        
        return investment;
      });
    }
    
    return [];
  } catch (error) {
    console.error("Error getting investments from Firestore:", error);
    return [];
  }
}

// Update a Firestore document
function updateFirestoreDocument(docId, updates) {
  const firestore = getFirestoreInstance();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${INVESTMENTS_COLLECTION}/${docId}?updateMask.fieldPaths=currentNAV&updateMask.fieldPaths=currentPrice`;
  
  // Convert updates to Firestore fields format
  const fields = {};
  for (const key in updates) {
    // Determine the field type
    if (typeof updates[key] === 'string') {
      fields[key] = { stringValue: updates[key] };
    } else if (Number.isInteger(updates[key])) {
      fields[key] = { integerValue: updates[key].toString() };
    } else if (typeof updates[key] === 'number') {
      fields[key] = { doubleValue: updates[key] };
    } else if (typeof updates[key] === 'boolean') {
      fields[key] = { booleanValue: updates[key] };
    }
  }
  
  const options = {
    method: 'patch',
    headers: {
      'Authorization': 'Bearer ' + getAccessToken(),
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      fields: fields
    })
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return response.getResponseCode() === 200;
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error);
    return false;
  }
}

// Get a Firestore instance
function getFirestoreInstance() {
  return FirestoreApp.getFirestore(
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  );
}

// Get an access token for the Firebase service account
function getAccessToken() {
  const serviceAccount = {
    private_key: FIREBASE_PRIVATE_KEY,
    client_email: FIREBASE_CLIENT_EMAIL
  };
  
  return FirebaseApp.getAccessToken(serviceAccount, ['https://www.googleapis.com/auth/datastore']);
}

// Main function to update all NAVs and prices
function updateAllInvestmentData() {
  console.log("Starting investment data update...");
  
  // Fetch mutual fund NAVs
  const navData = fetchMutualFundNAVs();
  
  // Get list of unique ticker symbols from Firestore
  const tickers = getUniqueTickers();
  
  // Fetch equity prices
  const priceData = fetchEquityPrices(tickers);
  
  // Update Firestore documents
  updateFirestoreData(navData, priceData);
  
  console.log("Investment data update completed");
}

// Get list of unique tickers from equity investments
function getUniqueTickers() {
  try {
    const investments = getInvestmentsFromFirestore();
    const tickers = new Set();
    
    for (const investment of investments) {
      if (investment.type === "Equity" && investment.ticker) {
        tickers.add(investment.ticker);
      }
    }
    
    return Array.from(tickers);
  } catch (error) {
    console.error("Error getting unique tickers:", error);
    return [];
  }
}

// Set up time-based triggers (run daily at 9 PM IST)
function setupTriggers() {
  // Clear existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
  
  // Create a trigger to run at 9 PM IST (3:30 PM UTC)
  ScriptApp.newTrigger('updateAllInvestmentData')
    .timeBased()
    .atHour(15)
    .nearMinute(30)
    .everyDays(1)
    .create();
  
  // Create a backup trigger to run at 10 PM IST (4:30 PM UTC) in case the first one fails
  ScriptApp.newTrigger('updateAllInvestmentData')
    .timeBased()
    .atHour(16)
    .nearMinute(30)
    .everyDays(1)
    .create();
  
  console.log("Triggers set up successfully");
}

// Run manually to test
function manualRun() {
  updateAllInvestmentData();
} 