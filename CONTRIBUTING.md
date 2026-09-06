# Cómo agregar o actualizar un arma

Hay dos formas. Ninguna requiere instalar nada.

## Opción A — Actualizar un arma que ya existe (la más común)

1. En GitHub, entrá a `data/weapons/` y abrí el archivo del arma
   (ej. `ak-47.json`).
2. Tocá el ícono de lápiz ("Edit this file").
3. Cambiá los números que necesites. Actualizá también
   `actualizado.fecha` y `actualizado.por` para que quede registro de
   quién cargó el dato.
4. Abajo, en "Commit changes": si tenés permiso de escritura, elegí
   "Commit directly to the main branch". Si no, GitHub te va a proponer
   crear una rama y abrir un Pull Request — hacelo así, y quien
   mantiene el repo lo revisa y lo aprueba.

No hace falta clonar nada ni tocar la terminal para esto.

## Opción B — Agregar un arma nueva

1. Copiá `template/arma-plantilla.json`.
2. Completá los campos (ver la tabla de `README.md` para saber qué va en
   cada uno). El `id` tiene que ser el nombre del arma en minúsculas y
   con guiones en vez de espacios, por ejemplo `desert-eagle`.
3. Subí ese archivo a `data/weapons/` con el nombre `<id>.json`
   (ej. `desert-eagle.json`) — en GitHub: "Add file → Upload files"
   dentro de esa carpeta.
4. Abrí `data/manifest.json` y agregá el nombre de archivo a la lista
   (ej. `"desert-eagle.json"`), respetando las comas.
5. Commit / Pull Request, igual que en la Opción A.

Si te resulta más cómodo llenar un formulario en vez de escribir el JSON
a mano, abrí `tools/editor.html` en tu navegador (doble clic alcanza,
esta página no necesita servidor) y usalo para generar o editar el
archivo: completás los campos, te arma el JSON, y lo descargás o copiás
ya listo para subir.

## Reglas rápidas

- Un archivo por arma, siempre dentro de `data/weapons/`.
- El campo `id` del archivo tiene que coincidir con el nombre del
  archivo (sin el `.json`).
- Todos los números van sin comillas (`"cadencia": 62`, no
  `"cadencia": "62"`).
- Si un arma nueva no aparece en el sitio, lo más probable es que falte
  agregarla a `data/manifest.json`.
- Cada Pull Request corre automáticamente
  `scripts/validar_datos.py`, que avisa si algo quedó mal formado antes
  de aprobar el cambio.
