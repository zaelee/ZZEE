$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$assetRoot=Split-Path -Parent $PSScriptRoot
$zipTarget=Join-Path (Split-Path -Parent $assetRoot) 'pupsters-separated-assets-v1.zip'
$manifest=Get-Content -LiteralPath "$assetRoot/manifest.json" -Raw | ConvertFrom-Json
$validation=Get-Content -LiteralPath "$assetRoot/docs/validation.json" -Raw | ConvertFrom-Json
if(-not $validation.passed){throw 'Asset validation has not passed'}
$files=[System.Collections.Generic.List[string]]::new()
foreach($asset in $manifest.assets){$files.Add($asset.file); if($asset.svg){$files.Add($asset.svg)}}
foreach($doc in @('README.md','index.html','manifest.json','ui/manifest.json','ui/labels.ko.json','docs/image-prompts.json','docs/enemy-generation.json','docs/boss-square-generation.json','docs/validation.json','docs/gallery-validation.json')){$files.Add($doc)}
$stream=[System.IO.File]::Open($zipTarget,[System.IO.FileMode]::CreateNew)
$archive=[System.IO.Compression.ZipArchive]::new($stream,[System.IO.Compression.ZipArchiveMode]::Create)
try {
 foreach($relative in $files){
  $source=Join-Path $assetRoot $relative
  if(-not(Test-Path -LiteralPath $source)){throw "Missing $relative"}
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$source,$relative,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
 }
} finally {$archive.Dispose();$stream.Dispose()}
$readZip=[System.IO.Compression.ZipFile]::OpenRead($zipTarget)
try {
 $entryNames=@($readZip.Entries | ForEach-Object {$_.FullName})
 $pngCount=@($entryNames | Where-Object {$_ -like '*.png'}).Count
 $svgCount=@($entryNames | Where-Object {$_ -like '*.svg'}).Count
 if($pngCount -ne 63 -or $svgCount -ne 34 -or $entryNames.Count -ne $files.Count){throw 'Zip count mismatch'}
 $hashErrors=@()
 foreach($record in $validation.records){
  $entry=$readZip.GetEntry($record.file)
  $entryStream=$entry.Open()
  $hash=[Security.Cryptography.SHA256]::Create()
  try {$actualHash=([BitConverter]::ToString($hash.ComputeHash($entryStream))).Replace('-','').ToLowerInvariant()}finally{$hash.Dispose();$entryStream.Dispose()}
  if($actualHash -ne $record.sha256){$hashErrors += $record.file}
 }
 if($hashErrors.Count){throw "Zip content mismatch $hashErrors"}
 $result=[pscustomobject]@{passed=$true;zip=$zipTarget;pngCount=$pngCount;svgCount=$svgCount;totalEntries=$entryNames.Count;pngHashesVerified=$validation.records.Count;sizeBytes=(Get-Item -LiteralPath $zipTarget).Length}
 $result | ConvertTo-Json | Set-Content -LiteralPath "$assetRoot/docs/package-validation.json" -Encoding utf8
 $result | ConvertTo-Json
} finally {$readZip.Dispose()}
