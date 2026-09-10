$ErrorActionPreference = "SilentlyContinue"
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $baseDir "index.html"
$html = Get-Content $htmlPath -Raw -Encoding UTF8

# Extract all agence-webaxis URLs
$pattern = 'https://www\.agence-webaxis\.com[^''"\s<>)]+'
$matches = [regex]::Matches($html, $pattern)
$urls = $matches | ForEach-Object { 
    $_.Value -replace '&amp;','&' -replace '&#038;','&' 
} | Sort-Object -Unique

# Filter to downloadable assets only
$assetExtensions = @('.css','.js','.jpg','.jpeg','.png','.gif','.svg','.webp','.woff','.woff2','.ttf','.eot')
$assetUrls = $urls | Where-Object {
    $path = ($_ -split '\?')[0]
    $ext = [System.IO.Path]::GetExtension($path).ToLower()
    $assetExtensions -contains $ext
}

Write-Host "Downloading $($assetUrls.Count) assets..."

$downloaded = 0
$failed = @()

foreach ($url in $assetUrls) {
    try {
        $uri = [Uri]$url
        $localPath = Join-Path $baseDir ($uri.AbsolutePath.TrimStart('/'))
        $localDir = Split-Path $localPath -Parent
        
        if (-not (Test-Path $localDir)) {
            New-Item -ItemType Directory -Path $localDir -Force | Out-Null
        }
        
        if (-not (Test-Path $localPath)) {
            Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing -TimeoutSec 30
            $downloaded++
            Write-Host "  OK: $($uri.AbsolutePath)"
        }
    } catch {
        $failed += $url
        Write-Host "  FAIL: $url"
    }
}

# Also download fonts referenced in CSS files
$cssFiles = Get-ChildItem -Path $baseDir -Filter "*.css" -Recurse
$fontUrls = @()
foreach ($css in $cssFiles) {
    $cssContent = Get-Content $css.FullName -Raw -Encoding UTF8
    $fontMatches = [regex]::Matches($cssContent, 'url\([''"]?([^''")]+)[''"]?\)')
    foreach ($m in $fontMatches) {
        $fontPath = $m.Groups[1].Value
        if ($fontPath -match '^https?://') {
            $fontUrls += $fontPath
        } elseif ($fontPath -notmatch '^data:') {
            # Relative path from CSS file location
            $cssDir = $css.DirectoryName
            $relativeUrl = $fontPath -replace '\?.*$',''
            $fullLocal = [System.IO.Path]::GetFullPath((Join-Path $cssDir $relativeUrl))
            if (-not (Test-Path $fullLocal)) {
                # Build remote URL
                $cssRelativePath = $css.FullName.Substring($baseDir.Length).Replace('\','/').TrimStart('/')
                $cssUrlPath = $cssRelativePath -replace '\\','/'
                $cssRemoteDir = Split-Path "https://www.agence-webaxis.com/$cssUrlPath" -Parent
                $remoteFontUrl = "$cssRemoteDir/$relativeUrl"
                $fontUrls += $remoteFontUrl
            }
        }
    }
}

$fontUrls = $fontUrls | Sort-Object -Unique
Write-Host "Downloading $($fontUrls.Count) font files from CSS..."

foreach ($url in $fontUrls) {
    try {
        $uri = [Uri]$url
        $localPath = Join-Path $baseDir ($uri.AbsolutePath.TrimStart('/'))
        $localDir = Split-Path $localPath -Parent
        
        if (-not (Test-Path $localDir)) {
            New-Item -ItemType Directory -Path $localDir -Force | Out-Null
        }
        
        if (-not (Test-Path $localPath)) {
            Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing -TimeoutSec 30
            $downloaded++
            Write-Host "  Font OK: $($uri.AbsolutePath)"
        }
    } catch {
        $failed += $url
    }
}

# Replace remote URLs with local paths in HTML
$newHtml = $html -replace 'https://www\.agence-webaxis\.com/', '/'
Set-Content -Path $htmlPath -Value $newHtml -Encoding UTF8 -NoNewline

Write-Host "`nDone! Downloaded $downloaded new files."
if ($failed.Count -gt 0) {
    Write-Host "Failed: $($failed.Count) files"
}
