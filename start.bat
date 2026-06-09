@echo off
echo Starting Fantasy Football Suite...
start "Trade Machine" cmd /c "cd Trade-Machine && npm start"

echo Opening Trade Machine in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo Done! The Trade Machine and API are now running locally.
