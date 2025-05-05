#!/bin/bash

echo -e "\033[1;34m"
echo "======================================"
echo "  PortTrack - Quick Install Script    "
echo "======================================"
echo -e "\033[0m"

echo -e "\033[1;33mForcing clean installation...\033[0m"

# Clean everything
rm -rf node_modules
npm cache clean --force

# Force install
echo -e "\033[1;33mInstalling dependencies...\033[0m"
npm install --force

if [ $? -eq 0 ]; then
  echo -e "\033[1;32mInstallation successful!\033[0m"
  echo -e "Start the app with: \033[1;36mnpx expo start\033[0m"
else
  echo -e "\033[1;31mInstallation failed\033[0m"
  echo -e "Try running: \033[1;36mnpm install --force\033[0m manually"
fi 