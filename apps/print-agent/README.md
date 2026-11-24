# Conector de impresión NexoPOS para Windows

Usa las impresoras térmicas ESC/POS instaladas en Windows, incluidas las genéricas USB, de red y Bluetooth que tengan un controlador y una cola de impresión. No filtra por marca y no depende de Web Serial. El equipo conectado a la impresora debe ejecutar este conector; instalarlo en otro equipo no permite imprimir por USB.

Requiere Windows y Node.js 20 o posterior. No instala controladores, no cambia el puerto de la impresora y no emite documentos tributarios. Los bytes del comprobante o de la boleta con su TED original se entregan a la cola de Windows como RAW. El controlador debe corresponder a una impresora que acepte ESC/POS; no se presupone que todas las impresoras interpreten ese lenguaje.

## Instalación

Antes de instalar se puede inspeccionar el destino y consultar las impresoras sin cambios:

```powershell
powershell.exe -NoProfile -File .\install-windows.ps1 -CheckOnly
```

La instalación debe autorizarse en el equipo de caja. Ejecutar:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-windows.ps1
```

La instalación copia el conector a `%LOCALAPPDATA%\NexoPOS\Print`, configura su inicio para el usuario actual y crea un certificado HTTPS de `localhost` en los almacenes del usuario actual. Ese certificado solo se utiliza para el servicio local. Su clave y la credencial de vinculación se guardan con permisos limitados al usuario y a SYSTEM. No se instala una autoridad de certificación compartida ni se envían las claves al servidor de NexoPOS.

En el mismo navegador que se usa para el POS, abrir `https://localhost:18443/`, elegir la impresora y pulsar **Vincular con NexoPOS**. Esto abre el POS, guarda la vinculación en ese navegador y retira la credencial de la dirección. Seleccionar 58 u 80 mm y ejecutar **Imprimir prueba sin venta** antes de vender. Los permisos iniciales de acceso local del navegador pueden requerir confirmación; no hay un diálogo por cada venta.

## Límites y protección

El servicio escucha exclusivamente en `127.0.0.1:18443`. Los trabajos requieren una credencial local y un origen permitido; no se admite CORS abierto. Las solicitudes tienen límites de tamaño y tiempo, se procesan en cola y sus identificadores evitan reenviar el mismo trabajo ante una respuesta incierta. Una reimpresión manual es una nueva acción explícita. El acuse de Windows confirma la recepción en la cola, no la salida física del papel.

El conector usa HTTPS local y la cola de Windows, por lo que Firefox no necesita Web Serial. Se valida el flujo web con Firefox y Chromium usando una cola simulada. La salida física depende de la impresora y del controlador instalados. Este instalador es únicamente para Windows.

## Desinstalación

Ejecutar `uninstall-windows.ps1` desde la carpeta instalada. El script detiene únicamente el proceso de este conector y elimina su inicio automático, su certificado y su directorio verificado. No elimina impresoras ni ventas.
