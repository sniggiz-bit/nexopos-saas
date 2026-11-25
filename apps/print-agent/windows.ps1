param([ValidateSet('list','print','probe','serve')][string]$Action = 'list')
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
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
  [StructLayout(LayoutKind.Sequential)] struct INFO2 {
    public IntPtr server, name, share, port, driver, comment, location, devmode, separator, processor, datatype, parameters, security;
    public uint attributes, priority, defaultPriority, start, until, status, jobs, ppm;
  }
  [DllImport("winspool.drv", EntryPoint="GetPrinterW", SetLastError=true)] static extern bool GetPrinter(IntPtr handle, int level, IntPtr buffer, int size, out int needed);
  static void Validate(IntPtr handle) {
    int needed; GetPrinter(handle, 2, IntPtr.Zero, 0, out needed); Check(needed>0 && needed<=1048576);
    IntPtr buffer = Marshal.AllocHGlobal(needed);
    try {
      Check(GetPrinter(handle, 2, buffer, needed, out needed));
      var info = (INFO2)Marshal.PtrToStructure(buffer, typeof(INFO2));
      string port = Marshal.PtrToStringUni(info.port) ?? "";
      if (port.StartsWith("PORTPROMPT:", StringComparison.OrdinalIgnoreCase) || port.StartsWith("SHRFAX:", StringComparison.OrdinalIgnoreCase) || port.StartsWith("Microsoft.Office", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Unsupported print queue");
      if ((info.attributes & 0x400)!=0 || (info.status & 0x80)!=0) throw new InvalidOperationException("Printer is offline");
    } finally { Marshal.FreeHGlobal(buffer); }
  }
  public static bool Probe(string name) { IntPtr handle; Check(OpenPrinter(name, out handle, IntPtr.Zero)); try { Validate(handle); return true; } finally { ClosePrinter(handle); } }
  static void Check(bool ok) { if (!ok) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error()); }
  public static int Print(string name, byte[] data) {
    IntPtr handle; Check(OpenPrinter(name, out handle, IntPtr.Zero)); bool started = false; IntPtr buffer = IntPtr.Zero;
    try {
      Validate(handle);
      var doc = new DOCINFO { name="NexoPOS - comprobante", datatype="RAW", output=null };
      int id = StartDocPrinter(handle, 1, ref doc); Check(id > 0); started = true; Check(StartPagePrinter(handle));
      buffer = Marshal.AllocHGlobal(data.Length); Marshal.Copy(data, 0, buffer, data.Length);
      for (int offset=0; offset<data.Length;) { int written; Check(WritePrinter(handle, IntPtr.Add(buffer, offset), Math.Min(65536, data.Length-offset), out written)); Check(written>0); offset += written; }
      Check(EndPagePrinter(handle)); Check(EndDocPrinter(handle)); started=false; return id;
    } finally { if (started) AbortPrinter(handle); if (buffer!=IntPtr.Zero) Marshal.FreeHGlobal(buffer); ClosePrinter(handle); }
  }
}
'@
function Invoke-NexoPrint($kind, $job) {
    if ($kind -eq 'list') {
        $printers = @(Get-CimInstance Win32_Printer -OperationTimeoutSec 10 | Where-Object { $_.PortName -notmatch '^(PORTPROMPT:|SHRFAX:|Microsoft\.Office)' })
        return ,@($printers | ForEach-Object { @{ name = $_.Name; port = $_.PortName; offline = [bool]$_.WorkOffline } })
    }
    if (-not $job -or $job.printer -isnot [string] -or $job.printer.Length -lt 1 -or $job.printer.Length -gt 256) { throw 'Impresora no valida.' }
    if ($kind -eq 'probe') { return @{ ok = [NexoPosSpool]::Probe($job.printer) } }
    if ($kind -ne 'print') { throw 'Accion no valida.' }
    $bytes = [Convert]::FromBase64String($job.data)
    if ($bytes.Length -lt 2 -or $bytes.Length -gt 4194304 -or $bytes[0] -ne 27 -or $bytes[1] -ne 64) { throw 'Datos ESC/POS no validos.' }
    $id = [NexoPosSpool]::Print($job.printer, $bytes)
    return @{ ok = $true; spoolId = $id }
}
if ($Action -eq 'serve') {
    [Console]::Out.WriteLine('{"ready":true}')
    while ($null -ne ($line = [Console]::In.ReadLine())) {
        $request = $null
        try {
            if ($line.Length -gt 6000000) { throw 'Solicitud demasiado extensa.' }
            $request = $line | ConvertFrom-Json
            $result = Invoke-NexoPrint $request.action $request.input
            [Console]::Out.WriteLine((@{ id = $request.id; ok = $true; result = $result } | ConvertTo-Json -Depth 5 -Compress))
        } catch {
            [Console]::Out.WriteLine((@{ id = $request.id; ok = $false } | ConvertTo-Json -Compress))
        } finally { $line = $null; $request = $null; $result = $null }
    }
} else {
    $job = if ($Action -eq 'list') { $null } else { [Console]::In.ReadToEnd() | ConvertFrom-Json }
    ConvertTo-Json -InputObject (Invoke-NexoPrint $Action $job) -Depth 5 -Compress
}
