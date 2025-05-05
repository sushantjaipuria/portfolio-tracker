# PortTrack - User Guide

## Introduction

PortTrack is a React Native mobile app that allows you to track your investment portfolio including Mutual Funds, SIPs, and Equity investments. The app is designed to work on iOS and can be deployed directly via Xcode without submission to the App Store.

This guide provides detailed, step-by-step instructions to set up and run the PortTrack application on your iOS device.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Firebase Setup](#firebase-setup)
4. [Running the App](#running-the-app)
5. [Deploying to iOS Devices](#deploying-to-ios-devices)
6. [Using the App](#using-the-app)
7. [Troubleshooting](#troubleshooting)

## Technology Stack

PortTrack uses the following technologies:

- **React Native**: A framework for building native mobile apps using JavaScript
- **Expo**: A platform for helping develop, build and deploy React Native apps
- **Firebase**: Backend-as-a-Service for authentication and data storage

### Version Information

This app uses:
- React 18.2.0
- React Native 0.72.6
- Expo ~49.0.15
- Firebase ^10.7.1

These versions were selected to provide a balance of:
- Modern features and performance
- Stability and compatibility
- Good community support and documentation

## Prerequisites

Before you begin, ensure you have the following:

- A Mac computer with macOS (required for iOS development)
- Xcode installed (latest version recommended)
- Node.js (LTS version, 16.x or newer)
- npm or yarn package manager
- A Firebase account
- An iOS device for testing (optional, but recommended)

### Checking and Installing Node.js

1. **Check if Node.js is installed and its version**

   Open Terminal and run:

   ```bash
   node -v
   ```

   This will display the installed Node.js version (e.g., v16.15.0).

2. **If Node.js is not installed or needs to be updated**:

   The recommended way to install Node.js on macOS is using NVM (Node Version Manager):

   a. Install NVM:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   ```

   b. Restart Terminal or run:
   ```bash
   source ~/.nvm/nvm.sh
   ```

   c. Install the latest LTS version of Node.js:
   ```bash
   nvm install --lts
   ```

   d. Verify the installation:
   ```bash
   node -v
   npm -v
   ```

   Alternatively, you can download and install Node.js directly from the [official website](https://nodejs.org/).

## Project Setup

1. **Clone or download the project**

   Download the PortTrack project files to your computer and extract the zip file if necessary.

2. **Install Node.js dependencies**

   There are two ways to install the dependencies:

   **Option A: Using the setup script (Recommended)**
   
   We've included a setup script that automatically handles dependency conflicts and installation issues:
   
   ```bash
   cd PortTrack
   ./setup.sh
   ```
   
   This script will:
   - Check your Node.js version
   - Clean any previous installations
   - Install dependencies with the right flags
   - Guide you through any issues

   **Option B: Manual installation**
   
   If you prefer to install manually:
   
   ```bash
   cd PortTrack
   npm install --legacy-peer-deps
   ```
   
   If you encounter dependency conflicts, try:
   
   ```bash
   npm install --force
   ```

3. **Install Expo CLI (if not already installed)**

   ```bash
   npm install -g expo-cli
   ```

## Firebase Setup

1. **Create a Firebase project**

   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the prompts to create a new project
   - Name the project "PortTrack" or any name of your choice

2. **Enable Firestore database**

   - In your Firebase project, navigate to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development purposes)
   - Select a location closest to you
   - Click "Enable"

3. **Enable Authentication**

   - In your Firebase project, navigate to "Authentication" in the left sidebar
   - Click "Get started"
   - Find "Anonymous" in the sign-in method list and enable it
   - Save the changes

4. **Register Firebase configuration**

   - In your Firebase project, click on the gear icon next to "Project Overview" and select "Project settings"
   - Scroll down to "Your apps" section and click the web icon (</>) to add a configuration
   - Register the app with a nickname like "PortTrack-Config"
   - This step is only to obtain the Firebase configuration keys for your React Native app, not to create a web app
   - Don't set up Firebase Hosting (not needed for this project)
   - Click "Register app"

5. **Copy Firebase configuration**

   - After registering your app, you'll see a Firebase configuration object
   - Update the Firebase configuration in `app/utils/firebase.js` with your own values:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. **Set up Google App Script for price updates (optional)**

   For automatic updates of mutual fund NAVs and equity prices, you can use Google App Script:

   - Go to [Google Apps Script](https://script.google.com/home)
   - Create a new project
   - Set up scheduled triggers to fetch data from the AMFI NAVAll file and update Firebase Firestore
   - Use the Firebase Admin SDK service account JSON file (downloaded from Firebase Project Settings > Service Accounts) to authenticate

## Running the App

1. **Start the development server**

   ```bash
   npx expo start
   ```

   This will start the Expo development server and display a QR code.

2. **Run on iOS Simulator**

   Press 'i' in the terminal to open the app in an iOS simulator, or:

   ```bash
   npx expo run:ios
   ```

   This will build the iOS app and open it in the simulator.

## Deploying to iOS Devices

To run the app on physical iOS devices, you have two options:

### Option 1: Using Expo Go (For Development/Testing)

1. Download the "Expo Go" app from the App Store on your iOS device
2. Make sure your phone and computer are on the same Wi-Fi network
3. With the Expo development server running, scan the QR code with your iOS device's camera app
4. The app will open in Expo Go

### Option 2: Building a Standalone App with Xcode (Recommended for Final Deployment)

This is the recommended approach for deploying the final app to your iPhone:

1. **Generate native iOS project**

   ```bash
   npx expo prebuild -p ios
   ```

2. **Open the iOS project in Xcode**

   ```bash
   open ios/PortTrack.xcworkspace
   ```

3. **Configure signing in Xcode**

   - Select the project in the Project Navigator (the blue Xcode project icon)
   - Select the "PortTrack" target from the TARGETS list
   - Go to the "Signing & Capabilities" tab
   - Sign in with your Apple ID (click "Add account" if needed)
   - In the Team dropdown, select your Personal Team or Developer account
   - Xcode will automatically manage provisioning profiles for development

4. **Connect your iOS device via USB**

5. **Select your device from the device dropdown in Xcode**
   - Make sure your iPhone is unlocked and trusts your computer
   - If this is the first time deploying to this device, you'll need to go to Settings > General > Device Management on your iPhone to trust the developer certificate

6. **Click the Play button to build and run**
   - Xcode will install the app on your iOS device
   - The app will remain on your device for 7 days (with a free Apple account) or up to a year (with a paid Apple Developer account)

## Using the App

### Portfolio Screen

This is the main screen showing your overall portfolio summary and investment list.

- **Summary Section**: Shows total invested amount, current value, and gain/loss percentage
- **Investment Types**: Displays a summary for each investment type
- **Active Investments**: Lists all your active investments
- **Sold Investments**: Shows investments that have been sold
- **Add Button (+ icon)**: Add a new investment

### Portfolio Detail Screen

This screen allows you to view investments filtered by type.

- **Type Selection**: Choose between Mutual Funds, SIPs, and Equity
- **Type Summary**: Shows totals for the selected investment type
- **Investment List**: Lists all investments of the selected type

### Add Investment Screen

Add a new investment to your portfolio.

1. Select the investment type (Mutual Fund, SIP, or Equity)
2. Fill in the required fields:
   - For Mutual Funds: Fund house, scheme name, units, NAVs, etc.
   - For SIPs: Fund house, scheme name, frequency, amount per period, etc.
   - For Equity: Ticker, shares, purchase price, current price, etc.
3. Click "Add Investment" to save

### Investment Detail Screen

View detailed information about a specific investment.

- **Summary**: Shows investment overview including gain/loss
- **Details**: Detailed information specific to the investment type
- **Sell Button**: For active investments, allows you to sell

### Sell Investment Screen

Record the sale of an investment.

1. Enter sale date
2. Enter units/shares sold and selling price/NAV
3. Confirm the sale

### Sold Investments Screen

View a list of all your sold investments.

- **Filter by Type**: Filter the list by investment type
- **Sale Summary**: Shows totals of invested and sold amounts, with profit/loss

### Settings Screen

Configure app settings.

- **Theme**: Choose between Light, Dark, or System theme

## Troubleshooting

### App Crashing at Startup

1. Make sure Firebase configuration is correctly set up in `app/utils/firebase.js`
2. Check if the Firestore database is enabled in your Firebase project
3. Try reinstalling node modules: `rm -rf node_modules && npm install --legacy-peer-deps`

### Firebase Authentication Issues

1. Ensure Anonymous Authentication is enabled in Firebase
2. Check your internet connection
3. Verify that your Firebase project is properly configured

### Data Not Loading

1. Check your internet connection
2. Verify Firestore rules allow read/write operations
3. Pull down to refresh the screens to reload data

### iOS Build Errors

1. Make sure you have the latest version of Xcode
2. Update CocoaPods: `sudo gem install cocoapods`
3. Rebuild the pods: `cd ios && pod install && cd ..`

### Dependency Issues

If you encounter package dependency conflicts (like `ERESOLVE` errors):

1. **Clean your installation**:
   ```bash
   rm -rf node_modules
   npm cache clean --force
   ```

2. **Use legacy peer deps flag**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Force install as a last resort**:
   ```bash
   npm install --force
   ```

4. **Check for conflicting global packages**:
   Sometimes global packages can conflict with local ones. Check your global packages:
   ```bash
   npm list -g --depth=0
   ```

5. **Use the setup script**:
   The included setup script automates many of these steps:
   ```bash
   ./setup.sh
   ```

## Support

If you encounter any issues not covered in this guide, please contact support for further assistance. 