Remove-Item ..\QuickLook.Plugin.SqliteViewer.qlplugin -ErrorAction SilentlyContinue

$files = Get-ChildItem -Path ..\bin\Release\ -Exclude *.pdb,*.xml
Compress-Archive $files ..\QuickLook.Plugin.SqliteViewer.zip
Move-Item ..\QuickLook.Plugin.SqliteViewer.zip ..\QuickLook.Plugin.SqliteViewer.qlplugin