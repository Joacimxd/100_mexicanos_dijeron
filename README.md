# 100 Mexicanos Dijeron

Proyecto web hecho con React. Esta guía explica cómo descargarlo y abrirlo en tu computadora, aunque nunca hayas programado.

> No necesitas instalar React, Vite ni ningún programa de diseño. Sólo necesitas **Node.js** y, si vas a clonar el proyecto, Git o GitHub Desktop.

## Antes de comenzar

Necesitas una computadora con Windows, macOS o Linux y conexión a internet para la instalación inicial.

1. Instala **Node.js 22 LTS** desde [nodejs.org](https://nodejs.org/). Elige la versión marcada como **LTS**, no la versión “Current”.
2. Cierra y vuelve a abrir la terminal después de instalarlo.
3. Abre una terminal:
   - **Windows:** busca y abre `PowerShell` desde el menú Inicio.
   - **macOS:** abre `Terminal` con Spotlight (`⌘ + espacio`).
   - **Linux:** abre la aplicación `Terminal` de tu distribución.

Para comprobar que Node.js quedó instalado, escribe esto y presiona Enter:

```bash
node --version
```

Debe aparecer una versión `v22...` (o una versión compatible: Node 20.19 o posterior).

## Descargar el proyecto

Elige **una** de estas dos opciones.

### Opción A: sin usar comandos (más sencilla)

1. Entra a [la página del proyecto en GitHub](https://github.com/Joacimxd/100_mexicanos_dijeron).
2. Presiona el botón verde **Code** y después **Download ZIP**.
3. Busca el archivo descargado, normalmente dentro de `Descargas`.
4. Haz clic derecho sobre el ZIP y elige **Extraer todo** (Windows) o ábrelo con doble clic (macOS/Linux).
5. Abre la carpeta extraída.

### Opción B: clonar con GitHub Desktop

Esta opción permite recibir cambios futuros fácilmente.

1. Instala [GitHub Desktop](https://desktop.github.com/).
2. Inicia sesión con tu cuenta de GitHub.
3. En GitHub Desktop, selecciona **File → Clone repository**.
4. Abre la pestaña **URL** y pega:

   ```text
   https://github.com/Joacimxd/100_mexicanos_dijeron.git
   ```

5. Elige una carpeta fácil de encontrar, por ejemplo `Documentos`, y presiona **Clone**.

También puedes hacerlo desde la terminal si ya tienes Git instalado:

```bash
git clone https://github.com/Joacimxd/100_mexicanos_dijeron.git
cd 100_mexicanos_dijeron
```

## Abrir el proyecto

Primero debes situarte dentro de la carpeta del proyecto en la terminal. Puedes escribir `cd`, dejar un espacio y arrastrar la carpeta a la ventana de la terminal; se escribirá su ruta automáticamente. Luego presiona Enter.

Ejemplo en Windows:

```powershell
cd "C:\Users\TuNombre\Downloads\100_mexicanos_dijeron"
```

Ejemplo en macOS o Linux:

```bash
cd ~/Downloads/100_mexicanos_dijeron
```

Ahora ejecuta estos dos comandos, uno a la vez:

```bash
npm install
npm run dev
```

La primera instalación puede tardar unos minutos. Cuando aparezca una dirección parecida a esta:

```text
Local:   http://localhost:5173/
```

mantén la terminal abierta y abre esa dirección en **Google Chrome**. El proyecto se actualizará automáticamente cada vez que se guarden cambios en sus archivos.

Para detenerlo, vuelve a la terminal y presiona `Ctrl + C`.

## Abrirlo desde un teléfono o una TV en la misma Wi-Fi

El comando `npm run dev` inicia el proyecto de forma accesible dentro de tu red local. En la terminal aparecerá una línea similar a:

```text
Network: http://192.168.1.25:5173/
```

Abre esa dirección desde Chrome en un teléfono, TV o computadora conectada a **la misma red Wi-Fi**. Si no aparece la línea `Network`, verifica que estás usando `npm run dev` y acepta el permiso del firewall si Windows, macOS o Linux lo solicita.

No compartas esa dirección fuera de tu red: esta modalidad es sólo para pruebas locales.

## Actualizar una copia clonada

Si usaste GitHub Desktop, abre el repositorio y presiona **Fetch origin**; si hay cambios, después presiona **Pull origin**.

Con la terminal, dentro de la carpeta del proyecto ejecuta:

```bash
git pull
npm install
```

Después vuelve a iniciarlo con `npm run dev`.

## Problemas comunes

### `node` o `npm` “no se reconoce” / “command not found”

Node.js no está instalado o la terminal se abrió antes de instalarlo. Instala Node.js LTS, cierra todas las ventanas de terminal y abre una nueva. Si continúa el problema, reinicia la computadora.

### `npm install` muestra un error de permisos

No uses `sudo` ni ejecutes PowerShell como administrador. Mueve el proyecto a una carpeta de tu usuario, por ejemplo `Documentos`, y vuelve a ejecutar `npm install`.

### El navegador dice que no puede abrir `localhost:5173`

Revisa que la terminal siga abierta y que `npm run dev` no haya mostrado un error. Si el puerto 5173 ya está ocupado, Vite mostrará otra dirección; abre exactamente la que aparezca en la terminal.

### El teléfono no abre la dirección `Network`

Comprueba que ambos dispositivos están en la misma Wi-Fi, no en una red de invitados. Revisa también el aviso del firewall de la computadora y permite el acceso para Node.js en redes privadas.

### Quiero una versión pública sin instalar nada

Este README explica cómo ejecutarlo localmente. Para una versión pública se necesitará configurar un despliegue, por ejemplo en GitHub Pages, y si habrá controles remotos entre dispositivos, un servicio de comunicación en tiempo real.

## Comandos útiles

```bash
# Iniciar para desarrollar
npm run dev

# Comprobar que el proyecto puede prepararse para publicar
npm run build

# Revisar avisos del código
npm run lint
```
