:: Get the current directory of the folder
@echo off
cd /d  %CD%

:: Install NPM 
echo. 
echo -------------------------------------
echo Installing NPM
call npm install
echo NPM Install Complete.
echo -------------------------------------
echo.
echo -------------------------------------
echo Installing NPM Fetch
call npm install node-fetch --save
echo NPM Fetch Install Complete
echo -------------------------------------
echo.
:: Run Script
npm start

pause