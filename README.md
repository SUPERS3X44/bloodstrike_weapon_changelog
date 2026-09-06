# Armería — Base de datos de armas de Blood Strike

Sitio estático (sin build, sin frameworks) para llevar entre varias personas
las estadísticas de las ~43 armas de Blood Strike: daño (cabeza, torso,
extremidades), cadencia, retroceso, movilidad, alcance y precisión
(apuntando / desde la cadera).

Pensado para publicarse gratis con **GitHub Pages** y para que actualizar
los datos sea tan simple como editar un archivo de texto.

## Cómo está armado

```
blood-strike-armeria/
├── index.html              → la página que ve todo el mundo
├── css/style.css            → estilos
├── js/app.js                 → carga los datos y arma la grilla/filtros
├── data/
│   ├── manifest.json         → lista de qué archivos de arma existen
│   └── weapons/
│       ├── ak-47.json        → un archivo por arma
│       ├── p90.json
│       └── ...
├── template/arma-plantilla.json   → copiar esto para dar de alta un arma nueva
├── tools/editor.html         → formulario local para generar/editar el JSON de un arma sin escribirlo a mano
├── scripts/validar_datos.py  → chequea que los JSON tengan el formato correcto
└── .github/workflows/validar-datos.yml → corre el chequeo anterior en cada Pull Request
```

No hay backend ni base de datos: los "datos" son los archivos JSON dentro
del repositorio, y el historial de Git ya funciona como historial de
cambios (quién cambió qué y cuándo).

## Cómo se ven las armas ya cargadas

`ak-47.json`, `p90.json` y `rpk.json` vienen con **valores de ejemplo**
(inventados, solo para mostrar cómo se ve el sitio funcionando). El resto
de las armas del listado inicial están en `data/weapons/` con los números
en 0, listas para completar. Reemplazá todo con los valores reales del
juego.

## Probarlo en tu computadora

Abrir `index.html` con doble clic **no funciona bien** en algunos
navegadores (bloquean la lectura de archivos JSON locales por seguridad).
Levantá un servidor simple en la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

y abrí `http://localhost:8000` en el navegador.

## Publicarlo con GitHub Pages

1. Creá un repositorio nuevo en GitHub y subí esta carpeta (ver más abajo).
2. En el repositorio: **Settings → Pages**.
3. En "Source" elegí la rama `main` y la carpeta `/ (root)`.
4. Guardá. En un par de minutos el sitio queda disponible en
   `https://tu-usuario.github.io/nombre-del-repo/`.

### Subir el proyecto por primera vez

```bash
cd blood-strike-armeria
git init
git add .
git commit -m "Primera versión de la armería"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

## El modelo de datos

Cada arma es un archivo `data/weapons/<id>.json` con esta forma:

| Campo | Tipo | Escala |
|---|---|---|
| `id` | texto | igual al nombre del archivo, sin `.json` |
| `nombre` | texto | nombre visible del arma |
| `categoria` | texto | ej. "Rifle de Asalto", "Subfusil" |
| `dano.cabeza` / `dano.torso` / `dano.extremidades` | número | puntos de daño reales por impacto |
| `cadencia` | número | 0–100, como en la pantalla de inspección del juego |
| `retroceso` | número | 0–100 |
| `movilidad` | número | 0–100 |
| `alcance` | número | 0–100 |
| `precision.apuntando` | número | 0–100 (ADS) |
| `precision.cadera` | número | 0–100 (hip-fire) |
| `notas` | texto | opcional, aclaraciones (mira usada, accesorios, etc.) |
| `actualizado.fecha` / `actualizado.por` | texto | quién cargó el dato y cuándo |

Si la escala real del juego no es 0–100 para algún stat, es cuestión de
ajustar los números — el sitio no asume nada más que "número más alto,
barra más llena" (mirá `MAX_ESCALA` y `MAX_DANO` al principio de
`js/app.js`).

## Sumar colaboradores

**Settings → Collaborators and teams → Add people** en GitHub, para dar
acceso de escritura directa a gente de confianza. Si preferís revisar los
cambios antes de que entren, pedile a la gente que mande los suyos como
**Pull Request** en vez de escribir directo en `main`; el workflow de
validación va a marcar en rojo cualquier archivo con datos mal formados.

Para el paso a paso de cómo agregar o actualizar un arma, ver
[`CONTRIBUTING.md`](CONTRIBUTING.md).
