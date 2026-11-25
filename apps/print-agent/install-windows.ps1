param([switch]$CheckOnly, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$destination = Join-Path $env:LOCALAPPDATA 'NexoPOS\Print'
if ($CheckOnly) {
    @{ node = $nodePath; destination = $destination; endpoint = 'https://localhost:18443'; certificate = 'Certificado local de localhost, solo para el usuario actual'; startup = 'NexoPOSPrint en HKCU Run' } | ConvertTo-Json
    & powershell.exe -NoProfile -NonInteractive -File (Join-Path $PSScriptRoot 'windows.ps1') -Action list
    exit $LASTEXITCODE
}
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$acl = New-Object System.Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true, $false)
$sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$acl.SetOwner($sid)
foreach ($identity in @($sid, (New-Object System.Security.Principal.SecurityIdentifier('S-1-5-18')))) {
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $destination -AclObject $acl
$configPath = Join-Path $destination 'config.json'
if (Test-Path -LiteralPath $configPath) {
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    $cert = Get-Item -LiteralPath ('Cert:\CurrentUser\My\' + $config.thumbprint) -ErrorAction SilentlyContinue
    if (-not $cert -or $cert.NotAfter -lt (Get-Date).AddDays(7)) { throw 'El certificado local necesita renovacion. Desinstala el conector anterior antes de instalarlo nuevamente.' }
} else {
    $random = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($random); $token = -join ($random | ForEach-Object { $_.ToString('x2') })
    $rng.GetBytes($random); $password = [Convert]::ToBase64String($random); $rng.Dispose()
    $cert = New-SelfSignedCertificate -Subject 'CN=localhost' -FriendlyName 'NexoPOS impresion local' -Type SSLServerAuthentication -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(1) -KeyAlgorithm RSA -KeyLength 2048 -KeyExportPolicy Exportable -TextExtension @('2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1')
    $secure = ConvertTo-SecureString $password -AsPlainText -Force
    Export-PfxCertificate -Cert $cert -FilePath (Join-Path $destination 'localhost.pfx') -Password $secure | Out-Null
    $publicCert = Join-Path $destination 'localhost.cer'
    Export-Certificate -Cert $cert -FilePath $publicCert | Out-Null
    Import-Certificate -FilePath $publicCert -CertStoreLocation 'Cert:\CurrentUser\Root' | Out-Null
    @{ token = $token; passphrase = $password; thumbprint = $cert.Thumbprint } | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'server.cjs') -Destination $destination -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'worker.cjs') -Destination $destination -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'windows.ps1') -Destination $destination -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'uninstall-windows.ps1') -Destination $destination -Force
$server = Join-Path $destination 'server.cjs'
$running = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($server) })
foreach ($process in $running) { Stop-Process -Id $process.ProcessId -ErrorAction Stop }
$command = '"' + $nodePath + '" "' + $server + '"'
New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'NexoPOSPrint' -Value $command -PropertyType String -Force | Out-Null
$process = Start-Process -FilePath $nodePath -ArgumentList @('"' + $server + '"') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $destination 'agent.log') -RedirectStandardError (Join-Path $destination 'agent-error.log')
Start-Sleep -Seconds 2
if ($process.HasExited) { throw 'El conector no pudo iniciarse. Revisa agent-error.log en la carpeta de instalacion.' }
$sha = [System.Security.Cryptography.SHA256]::Create()
$fingerprint = ($sha.ComputeHash($cert.RawData) | ForEach-Object { $_.ToString('x2') }) -join ':'
$sha.Dispose()
Write-Output ('Certificado local SHA-256: ' + $fingerprint)
Write-Output 'Conector NexoPOS instalado. Abre https://localhost:18443/ en el mismo navegador que usas para el POS y selecciona tu impresora.'
if (-not $NoBrowser) { Start-Process 'https://localhost:18443/' -WindowStyle Hidden }
