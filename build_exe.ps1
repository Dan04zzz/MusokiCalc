# PowerShell script to compile the calculator GUI launcher into a standalone Windows .exe

# Print status
Write-Host "Starting compilation of MusokiCalcLauncher.exe using PyInstaller..." -ForegroundColor Cyan

# Run PyInstaller with all required parameters
# --onefile packages everything in a single .exe
# --noconsole prevents showing the command line window behind the Tkinter GUI
# --add-data specifies folders and files to bundle inside the executable (source;destination)
pyinstaller --onefile --noconsole --name "MusokiCalcLauncher" `
    --add-data "index.html;." `
    --add-data "mastersheet.html;." `
    --add-data "frags.html;." `
    --add-data "js;js" `
    --add-data "css;css" `
    --add-data "calc;calc" `
    --add-data "backups;backups" `
    --add-data "img;img" `
    --add-data "tools;tools" `
    calculator_launcher.py

# Check if build succeeded
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully compiled MusokiCalcLauncher.exe!" -ForegroundColor Green
    Write-Host "You can find the standalone executable inside the 'dist' folder:" -ForegroundColor Green
    Write-Host "Path: $(Get-Location)\dist\MusokiCalcLauncher.exe`n" -ForegroundColor Yellow
} else {
    Write-Error "PyInstaller compilation failed. Please review the output above."
}
