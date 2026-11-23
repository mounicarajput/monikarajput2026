@echo off
rem Starts the portfolio on http://localhost:3000 and opens it in your browser.
rem Keep this window open while you work. Close it to stop the site.
cd /d "%~dp0"
start "" http://localhost:3000/index.html
python serve.py
