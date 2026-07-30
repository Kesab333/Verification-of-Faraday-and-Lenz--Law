$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()
Write-Host "Serving $root at http://localhost:8000/"

function Get-ContentType([string]$filePath) {
  switch ([System.IO.Path]::GetExtension($filePath).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.js' { 'text/javascript; charset=utf-8' }
    '.ico' { 'image/x-icon' }
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.svg' { 'image/svg+xml' }
    default { 'application/octet-stream' }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = 'index.html' }

    if ($requestPath -eq 'favicon.ico') {
      $requestPath = 'images/nitk.ico'
    }

    $filePath = Join-Path $root ($requestPath -replace '/', '\\')
    if (Test-Path $filePath -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $context.Response.ContentType = Get-ContentType $filePath
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $context.Response.StatusCode = 404
      $message = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
      $context.Response.OutputStream.Write($message, 0, $message.Length)
    }

    $context.Response.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}