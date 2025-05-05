#!/bin/bash

# Display colorful header
echo -e "\033[1;34m"
echo "==============================================="
echo "       PortTrack - Installation Script        "
echo "==============================================="
echo -e "\033[0m"

# Check Node.js version
echo -e "\033[1;32m[1/4] Checking Node.js version...\033[0m"
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31mNode.js is not installed. Please install Node.js LTS (16.x or newer).\033[0m"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Compare Node.js version (simplified check)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt "16" ]; then
    echo -e "\033[1;33mWarning: Using Node.js version older than 16.x. This might cause issues.\033[0m"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation aborted."
        exit 1
    fi
fi

# Clean previous installation
echo -e "\033[1;32m[2/4] Cleaning previous installation...\033[0m"
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
npm cache clean --force
echo "Cleaned previous installation."

# Install dependencies
echo -e "\033[1;32m[3/4] Installing dependencies...\033[0m"
echo "This may take a few minutes..."
npm install

# If install fails, try with legacy peer deps
if [ $? -ne 0 ]; then
    echo -e "\033[1;33mStandard installation failed, trying with --legacy-peer-deps...\033[0m"
    npm install --legacy-peer-deps
fi

# If that also fails, try with force
if [ $? -ne 0 ]; then
    echo -e "\033[1;33mTrying with --force as last resort...\033[0m"
    npm install --force
fi

# Check if successful
if [ $? -ne 0 ]; then
    echo -e "\033[1;31mFailed to install dependencies. Please check the error messages above.\033[0m"
    exit 1
fi

# Show version info
echo -e "\033[1;32m[4/4] Checking installed versions...\033[0m"
echo -e "React: $(node -e "console.log(require('./node_modules/react/package.json').version)")"
echo -e "React Native: $(node -e "console.log(require('./node_modules/react-native/package.json').version)")"
echo -e "Expo: $(node -e "console.log(require('./node_modules/expo/package.json').version)")"
echo -e "Firebase: $(node -e "console.log(require('./node_modules/firebase/package.json').version)")"

# Installation complete
echo -e "\033[1;32mInstallation completed successfully!\033[0m"
echo
echo -e "\033[1;34m===============================================\033[0m"
echo -e "\033[1;34m       PortTrack - Ready to Use               \033[0m"
echo -e "\033[1;34m===============================================\033[0m"
echo
echo -e "To start the app, run: \033[1;36mnpx expo start\033[0m"
echo -e "To run on iOS simulator: \033[1;36mnpx expo run:ios\033[0m"
echo
echo -e "\033[0;33mIMPORTANT: Don't forget to update your Firebase configuration in app/utils/firebase.js\033[0m"
echo
echo -e "\033[0;36mNote: You don't need to install the global Expo CLI.\033[0m"
echo -e "\033[0;36mThe 'npx' command will use the local copy of Expo in your project.\033[0m" 