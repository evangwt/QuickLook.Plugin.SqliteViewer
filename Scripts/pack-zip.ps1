$parentDir = Split-Path $PSScriptRoot -Parent
$qlpluginPath = Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.qlplugin"
$binReleasePath = Join-Path $parentDir "bin\Release\"

# Clean up any existing plugin file
Remove-Item $qlpluginPath -ErrorAction SilentlyContinue

# Check if bin\Release directory exists
if (-not (Test-Path $binReleasePath)) {
    Write-Error "❌ Build output directory not found: $binReleasePath"
    Write-Host "Make sure to run this script after a successful Release build."
    exit 1
}

# Get files from bin\Release excluding debug files
$files = Get-ChildItem -Path $binReleasePath -Exclude *.pdb,*.xml
if ($files.Count -eq 0) {
    Write-Error "❌ No files found in build output directory: $binReleasePath"
    exit 1
}

Write-Host "✅ Found $($files.Count) files to package:"
$files | ForEach-Object { Write-Host "  - $($_.Name)" }

# Create the zip package
$zipPath = Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.zip"
Compress-Archive $files $zipPath -Force

# Rename to .qlplugin
Move-Item $zipPath $qlpluginPath

Write-Host "✅ Successfully created plugin package: QuickLook.Plugin.SqliteViewer.qlplugin"
Write-Host "   File size: $([math]::Round((Get-Item $qlpluginPath).Length / 1KB, 1)) KB"