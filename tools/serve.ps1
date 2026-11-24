# Card Studio — mini serveur local (PowerShell intégré à Windows, rien à installer)
# Lancé par « lancer-local.bat ». Ferme la fenêtre pour arrêter.
param([int]$Port = 8080)
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="text/javascript; charset=utf-8";
  ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
  ".webp"="image/webp"; ".gif"="image/gif"; ".ico"="image/x-icon"; ".woff2"="font/woff2"; ".woff"="font/woff"; ".md"="text/plain; charset=utf-8"
}
$listener = $null
for ($p = $Port; $p -lt $Port + 20; $p++) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l; $Port = $p; break
  } catch { }
}
if (-not $listener) { Write-Host "Impossible d'ouvrir un port local (8080-8099)." -ForegroundColor Red; Read-Host "Entrée pour fermer"; exit 1 }
$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "  Card Studio tourne en local :  $url" -ForegroundColor Cyan
Write-Host "  Card maker : $url    |    Carte holo : ${url}holo.html"
Write-Host "  (ferme cette fenêtre pour arrêter)"
Write-Host ""
Start-Process $url
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ($rel -eq "" -or $rel.EndsWith("/")) { $rel += "index.html" }
    $path = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    if (-not $path.StartsWith($Root) -or -not (Test-Path $path -PathType Leaf)) {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404")
    } else {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = $(if ($Mime.ContainsKey($ext)) { $Mime[$ext] } else { "application/octet-stream" })
      $res.Headers.Add("Cache-Control", "no-store")
      $b = [System.IO.File]::ReadAllBytes($path)
    }
    $res.ContentLength64 = $b.Length
    $res.OutputStream.Write($b, 0, $b.Length)
  } catch { } finally { $res.OutputStream.Close() }
}
