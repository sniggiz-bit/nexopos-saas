$ErrorActionPreference = 'Stop'
$destination = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'NexoPOS\Print'))
$configPath = Join-Path $destination 'config.json'
$server = Join-Path $destination 'server.cjs'
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($server) } | ForEach-Object { Stop-Process -Id $_.ProcessId }
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'NexoPOSPrint' -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $configPath) {
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($config.thumbprint -match '^[A-Fa-f0-9]{40}$') {
        foreach ($store in @('Root','My')) {
            $certPath = 'Cert:\CurrentUser\' + $store + '\' + $config.thumbprint
            $cert = Get-Item -LiteralPath $certPath -ErrorAction SilentlyContinue
            if ($cert -and $cert.FriendlyName -eq 'NexoPOS impresion local' -and $cert.Subject -eq 'CN=localhost') { Remove-Item -LiteralPath $certPath }
        }
    }
}
# Delete only the verified, fixed installation directory.
$expected = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'NexoPOS\Print'))
if ($destination -cne $expected -or -not $destination.StartsWith([IO.Path]::GetFullPath($env:LOCALAPPDATA), [StringComparison]::OrdinalIgnoreCase)) { throw 'Directorio de instalacion no valido.' }
if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
Write-Output 'Conector, inicio automatico y certificado local de NexoPOS eliminados.'
