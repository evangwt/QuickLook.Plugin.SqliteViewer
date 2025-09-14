$parentDir = Split-Path $PSScriptRoot -Parent
Remove-Item (Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.qlplugin") -ErrorAction SilentlyContinue

$files = Get-ChildItem -Path (Join-Path $parentDir "bin\Release\") -Exclude *.pdb,*.xml
Compress-Archive $files (Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.zip")
Move-Item (Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.zip") (Join-Path $parentDir "QuickLook.Plugin.SqliteViewer.qlplugin")