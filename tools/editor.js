/* Editor local — no envía nada a ningún servidor, todo pasa en el navegador. */

const campos = [
  "nombre", "id", "categoria",
  "dano_cabeza", "dano_torso", "dano_extremidades",
  "cadencia", "retroceso", "movilidad", "alcance",
  "precision_apuntando", "precision_cadera",
  "notas", "por", "fecha",
];

const el = Object.fromEntries(campos.map((c) => [c, document.getElementById(c)]));
const $preview = document.getElementById("preview");
const $nombreArchivo = document.getElementById("nombre-archivo");
const $status = document.getElementById("status");

let idTocadoManualmente = false;

el.fecha.value = new Date().toISOString().slice(0, 10);

el.nombre.addEventListener("input", () => {
  if (!idTocadoManualmente) el.id.value = slugify(el.nombre.value);
  actualizarPreview();
});

el.id.addEventListener("input", () => {
  idTocadoManualmente = el.id.value.trim().length > 0;
  actualizarPreview();
});

campos.forEach((c) => {
  if (c === "nombre" || c === "id") return;
  el[c].addEventListener("input", actualizarPreview);
});

document.getElementById("btn-rellenar").addEventListener("click", () => {
  const texto = document.getElementById("pegar").value.trim();
  if (!texto) return;
  try {
    const arma = JSON.parse(texto);
    rellenarDesdeArma(arma);
    idTocadoManualmente = true;
    actualizarPreview();
    mostrarEstado("Formulario actualizado con el JSON pegado.");
  } catch (e) {
    mostrarEstado("Ese texto no es un JSON válido: " + e.message, true);
  }
});

document.getElementById("btn-descargar").addEventListener("click", () => {
  const arma = construirArma();
  const nombreArchivo = (arma.id || "arma") + ".json";
  const blob = new Blob([JSON.stringify(arma, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  mostrarEstado(`Descargado como ${nombreArchivo}`);
});

document.getElementById("btn-copiar").addEventListener("click", async () => {
  const texto = $preview.textContent;
  try {
    await navigator.clipboard.writeText(texto);
    mostrarEstado("JSON copiado al portapapeles.");
  } catch {
    mostrarEstado("No se pudo copiar automáticamente; seleccioná el texto y copiá manualmente.", true);
  }
});

function construirArma() {
  return {
    id: el.id.value.trim() || slugify(el.nombre.value) || "arma-sin-nombre",
    nombre: el.nombre.value.trim(),
    categoria: el.categoria.value.trim(),
    dano: {
      cabeza: num(el.dano_cabeza.value),
      torso: num(el.dano_torso.value),
      extremidades: num(el.dano_extremidades.value),
    },
    cadencia: num(el.cadencia.value),
    retroceso: num(el.retroceso.value),
    movilidad: num(el.movilidad.value),
    alcance: num(el.alcance.value),
    precision: {
      apuntando: num(el.precision_apuntando.value),
      cadera: num(el.precision_cadera.value),
    },
    notas: el.notas.value.trim(),
    actualizado: {
      fecha: el.fecha.value || "",
      por: el.por.value.trim(),
    },
  };
}

function rellenarDesdeArma(arma) {
  el.nombre.value = arma.nombre || "";
  el.id.value = arma.id || "";
  el.categoria.value = arma.categoria || "";
  el.dano_cabeza.value = arma.dano?.cabeza ?? "";
  el.dano_torso.value = arma.dano?.torso ?? "";
  el.dano_extremidades.value = arma.dano?.extremidades ?? "";
  el.cadencia.value = arma.cadencia ?? "";
  el.retroceso.value = arma.retroceso ?? "";
  el.movilidad.value = arma.movilidad ?? "";
  el.alcance.value = arma.alcance ?? "";
  el.precision_apuntando.value = arma.precision?.apuntando ?? "";
  el.precision_cadera.value = arma.precision?.cadera ?? "";
  el.notas.value = arma.notas || "";
  el.por.value = arma.actualizado?.por || "";
  el.fecha.value = arma.actualizado?.fecha || new Date().toISOString().slice(0, 10);
}

function actualizarPreview() {
  const arma = construirArma();
  $preview.textContent = JSON.stringify(arma, null, 2);
  $nombreArchivo.textContent = (arma.id || "arma") + ".json";
}

function mostrarEstado(msg, esError) {
  $status.textContent = msg;
  $status.style.color = esError ? "var(--danger)" : "var(--cyan)";
}

function slugify(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

actualizarPreview();
