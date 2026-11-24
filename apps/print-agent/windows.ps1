param([ValidateSet('list','print')][string]$Action = 'list')
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$printers = @(Get-CimInstance Win32_Printer -OperationTimeoutSec 10 | Where-Object { $_.PortName -notmatch '^(PORTPROMPT:|SHRFAX:|Microsoft\.Office)' })
if ($Action -eq 'list') {
    ConvertTo-Json -InputObject @($printers | ForEach-Object { @{ name = $_.Name; port = $_.PortName; offline = [bool]$_.WorkOffline } }) -Compress
    exit 0
}
$job = [Console]::In.ReadToEnd() | ConvertFrom-Json
$printer = $printers | Where-Object { $_.Name -ceq $job.printer } | Select-Object -First 1
if (-not $printer) { throw 'La impresora ya no esta instalada.' }
if ($printer.WorkOffline) { throw 'La impresora esta sin conexion en Windows.' }
$bytes = [Convert]::FromBase64String($job.data)
if ($bytes.Length -lt 2 -or $bytes.Length -gt 4194304 -or $bytes[0] -ne 27 -or $bytes[1] -ne 64) { throw 'Datos ESC/POS no validos.' }
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class NexoPosSpool {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct DOCINFO { [MarshalAs(UnmanagedType.LPWStr)] public string name; [MarshalAs(UnmanagedType.LPWStr)] public string output; [MarshalAs(UnmanagedType.LPWStr)] public string datatype; }
  [DllImport("winspool.drv", EntryPoint="OpenPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] static extern bool OpenPrinter(string name, out IntPtr handle, IntPtr defaults);
  [DllImport("winspool.drv", EntryPoint="StartDocPrinterW", SetLastError=true, CharSet=CharSet.Unicode)] static extern int StartDocPrinter(IntPtr handle, int level, ref DOCINFO doc);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool StartPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool WritePrinter(IntPtr handle, IntPtr data, int length, out int written);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool EndPagePrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool EndDocPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool AbortPrinter(IntPtr handle);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool ClosePrinter(IntPtr handle);
  static void Check(bool ok) { if (!ok) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error()); }
  public static int Print(string name, byte[] data) {
    IntPtr handle; Check(OpenPrinter(name, out handle, IntPtr.Zero)); bool started = false; IntPtr buffer = IntPtr.Zero;
    try {
      var doc = new DOCINFO { name="NexoPOS - comprobante", datatype="RAW", output=null };
      int id = StartDocPrinter(handle, 1, ref doc); Check(id > 0); started = true; Check(StartPagePrinter(handle));
      buffer = Marshal.AllocHGlobal(data.Length); Marshal.Copy(data, 0, buffer, data.Length);
      for (int offset=0; offset<data.Length;) { int written; Check(WritePrinter(handle, IntPtr.Add(buffer, offset), Math.Min(65536, data.Length-offset), out written)); Check(written>0); offset += written; }
      Check(EndPagePrinter(handle)); Check(EndDocPrinter(handle)); started=false; return id;
    } finally { if (started) AbortPrinter(handle); if (buffer!=IntPtr.Zero) Marshal.FreeHGlobal(buffer); ClosePrinter(handle); }
  }
}
'@
$id = [NexoPosSpool]::Print($printer.Name, $bytes)
@{ ok = $true; spoolId = $id } | ConvertTo-Json -Compress
