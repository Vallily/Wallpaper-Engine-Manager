@echo off
echo Starting Wallpaper Manager...
if not exist node_modules (
    echo node_modules not found, running npm install...
    npm install
)
npm start
