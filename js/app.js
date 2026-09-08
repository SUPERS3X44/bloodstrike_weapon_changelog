/* ===================================================================
   Blood Strike — Armería
   Sitio 100% estático: no hay build ni dependencias. Todo sale de
   los archivos JSON en data/weapons/, listados en data/manifest.json.
   =================================================================== */

const MAX_ESCALA = 100; // cadencia / retroceso / movilidad / alcance / precisión van de 0 a 100
const MAX_DANO = 100;   // referencia visual para las barras de daño (puntos por impacto)

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ETIQUETAS_TIPO = { buff: "BUFF", nerf: "NERF", ajuste: "AJUSTE" };
const CLASES_TIPO = { buff: "tag-buff", nerf: "tag-nerf", ajuste: "tag-ajuste" };

const state = {
  armas: [],
  categoria: "Todas",
  query: "",
  orden: "nombre",
};

const $grid = document.getElementById("grid");
const $filters = document.getElementById("filters");
const $search = document.getElementById("search");
const $sort = document.getElementById("sort");
const $overlay = document.getElementById("overlay");
const $detailPanel = document.getElementById("detail-panel");

init();

async function init() {
  $search.addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGrid();
  });
  $sort.addEventListener("change", (e) => {
    state.orden = e.target.value;
    renderGrid();
  });
  $overlay.addEventListener("click", (e) => {
    if (e.target === $overlay) cerrarDetalle();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarDetalle();
  });

  try {
    const manifest = await cargarJSON("data/manifest.json");
    const resultados = await Promise.allSettled(
      manifest.map((archivo) => cargarJSON(`data/weapons/${archivo}`))
    );

    state.armas = resultados
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const fallidos = resultados.filter((r) => r.status === "rejected");
    if (fallidos.length) {
      console.warn(`${fallidos.length} archivo(s) de arma no se pudieron cargar.`, fallidos);
    }

    renderFiltros();
    renderGrid();
  } catch (err) {
    $grid.innerHTML = `
      <div class="error-state">
        No se pudieron cargar los datos de armas.
        <br>Si abriste este archivo directamente con doble clic, el navegador
        bloquea la lectura de JSON local. Probá con un servidor local
        (por ejemplo <code>python -m http.server</code>) o publicá el sitio
        con GitHub Pages.
        <code>${escapeHTML(String(err))}</code>
      </div>`;
  }
}

async function cargarJSON(ruta) {
  const res = await fetch(ruta, { cache: "no-store" });
  if (!res.ok) throw new Error(`${ruta}: HTTP ${res.status}`);
  return res.json();
}

function renderFiltros() {
  const categorias = ["Todas", ...new Set(state.armas.map((a) => a.categoria).filter(Boolean))];
  $filters.innerHTML = categorias
    .map(
      (cat) =>
        `<button type="button" class="chip${cat === state.categoria ? " active" : ""}" data-cat="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`
    )
    .join("");

  $filters.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.categoria = btn.dataset.cat;
      renderFiltros();
      renderGrid();
    });
  });
}

function renderGrid() {
  let lista = state.armas.filter((a) => {
    const pasaCategoria = state.categoria === "Todas" || a.categoria === state.categoria;
    const pasaBusqueda = normalizar(a.nombre).includes(normalizar(state.query));
    return pasaCategoria && pasaBusqueda;
  });

  lista = ordenar(lista, state.orden);

  if (!lista.length) {
    $grid.innerHTML = `<div class="empty-state">Ningún arma coincide con ese filtro o búsqueda.</div>`;
    return;
  }

  $grid.innerHTML = lista.map(tarjetaArma).join("");

  $grid.querySelectorAll(".weapon-card").forEach((card) => {
    card.addEventListener("click", () => abrirDetalle(card.dataset.id));
  });
}

function ordenar(lista, clave) {
  const copia = [...lista];
  switch (clave) {
    case "dano":
      return copia.sort((a, b) => (b.dano?.torso ?? 0) - (a.dano?.torso ?? 0));
    case "cadencia":
      return copia.sort((a, b) => (b.cadencia ?? 0) - (a.cadencia ?? 0));
    case "movilidad":
      return copia.sort((a, b) => (b.movilidad ?? 0) - (a.movilidad ?? 0));
    case "alcance":
      return copia.sort((a, b) => (b.alcance ?? 0) - (a.alcance ?? 0));
    case "retroceso":
      return copia.sort((a, b) => (a.retroceso ?? 0) - (b.retroceso ?? 0)); // menor retroceso primero
    default:
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }
}

function tarjetaArma(arma)//Tarjetas chicas que aparecen en la grilla de armas
{
  const sinDatos = !(arma.cadencia || arma.movilidad || arma.alcance || arma.retroceso || arma.dano?.torso);

  return `
    <article class="weapon-card" data-id="${escapeHTML(arma.id)}" tabindex="0">
      <div class="weapon-card__top">
        <div class="weapon-card__name">${escapeHTML(arma.nombre)}</div>
        <img src="images/${escapeHTML(arma.id)}.png" alt="${escapeHTML(arma.id)}" class="arma-icon">
        <div class="weapon-card__cat">${escapeHTML(arma.categoria || "")}</div>
      </div>
      ${
        sinDatos
          ? `<div class="weapon-card__empty">Sin estadísticas cargadas todavía.</div>`
          : `
        ${barraStat("DMG", arma.dano?.torso ?? 0, MAX_DANO, "danger")}
        ${barraStat("CAD", arma.cadencia ?? 0, MAX_ESCALA)}
        ${barraStat("MOV", arma.movilidad ?? 0, MAX_ESCALA, "cyan")}
        ${barraStat("ALC", arma.alcance ?? 0, MAX_ESCALA)}
      `
      }
    </article>`;
}

function barraStat(label, valor, max, colorClass) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100));
  return `
    <div class="stat-row">
      <span class="stat-row__label">${label}</span>
      <span class="bar"><span class="bar__fill${colorClass ? " " + colorClass : ""}" style="width:${pct}%"></span></span>
      <span class="stat-row__value">${valor}</span>
    </div>`;
}

/* ---------- Bloques de estadísticas reutilizables (actuales e historial) ---------- */

function danoGridHTML(dano) {
  dano = dano || {};
  return `
    <div class="dano-grid">
      <div class="dano-cell"><div class="dano-cell__num">${dano.cabeza ?? 0}</div><div class="dano-cell__label">Cabeza</div></div>
      <div class="dano-cell"><div class="dano-cell__num">${dano.torso ?? 0}</div><div class="dano-cell__label">Torso</div></div>
      <div class="dano-cell"><div class="dano-cell__num">${dano.extremidades ?? 0}</div><div class="dano-cell__label">Extremidades</div></div>
    </div>`;
}

function manejoHTML(s) {
  s = s || {};
  return `
    ${barraStat("Cadencia", s.cadencia ?? 0, MAX_ESCALA)}
    ${barraStat("Retroceso", s.retroceso ?? 0, MAX_ESCALA, "danger")}
    ${barraStat("Movilidad", s.movilidad ?? 0, MAX_ESCALA, "cyan")}
    ${barraStat("Alcance", s.alcance ?? 0, MAX_ESCALA)}`;
}

function precisionHTML(s) {
  const p = (s && s.precision) || {};
  return `
    ${barraStat("Apuntando (ADS)", p.apuntando ?? 0, MAX_ESCALA, "cyan")}
    ${barraStat("Desde la cadera", p.cadera ?? 0, MAX_ESCALA)}`;
}

function bloqueEstadisticasCompacto(s) {
  s = s || {};
  return danoGridHTML(s.dano) + manejoHTML(s) + precisionHTML(s);
}

/* ---------- Historial de cambios ---------- */

function agruparHistorialPorAnio(historial) {
  const ordenado = [...historial].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const grupos = [];
  for (const entrada of ordenado) {
    const anio = (entrada.fecha || "").slice(0, 4) || "Sin fecha";
    let grupo = grupos.find((g) => g.anio === anio);
    if (!grupo) {
      grupo = { anio, entradas: [] };
      grupos.push(grupo);
    }
    grupo.entradas.push(entrada);
  }
  return grupos;
}

function nombreMes(fecha) {
  const mm = parseInt((fecha || "").slice(5, 7), 10);
  return MESES[mm - 1] || "";
}

function labelHistorialToggle(abierto, cantidad) {
  return `${abierto ? "▾ Ocultar" : "▸ Ver"} historial de cambios (${cantidad})`;
}

function historialSectionHTML(arma) {
  const historial = Array.isArray(arma.historial) ? arma.historial : [];

  if (!historial.length) {
    return `
      <div class="detail-section">
        <div class="detail-section__title">HISTORIAL DE CAMBIOS</div>
        <p class="detail-notas">Sin historial de cambios registrado todavía.</p>
      </div>`;
  }

  const grupos = agruparHistorialPorAnio(historial);
  let indiceGlobal = 0;

  const cuerpo = grupos
    .map((grupo) => {
      const entradasHTML = grupo.entradas
        .map((entrada) => {
          const idx = indiceGlobal++;
          const claseTag = CLASES_TIPO[entrada.tipo] || "tag-ajuste";
          const etiquetaTag = ETIQUETAS_TIPO[entrada.tipo] || "AJUSTE";
          return `
            <div class="historial-entry">
              <div class="historial-entry__row">
                <span class="tag ${claseTag}">${etiquetaTag}</span>
                <span class="historial-entry__mes">${escapeHTML(nombreMes(entrada.fecha))}</span>
                <span class="historial-entry__titulo">${escapeHTML(entrada.titulo || "")}</span>
                <button type="button" class="historial-entry__toggle" data-hist-idx="${idx}">ver estadísticas</button>
              </div>
              <div class="historial-entry__snapshot" data-hist-snapshot="${idx}">
                ${bloqueEstadisticasCompacto(entrada.estadisticas)}
              </div>
            </div>`;
        })
        .join("");
      return `<div class="historial-year"><div class="historial-year__title">${escapeHTML(grupo.anio)}</div>${entradasHTML}</div>`;
    })
    .join("");

  return `
    <div class="detail-section">
      <button type="button" class="historial-toggle" id="historial-toggle">${labelHistorialToggle(false, historial.length)}</button>
      <div class="historial-body hidden" id="historial-body">${cuerpo}</div>
    </div>`;
}

function conectarHistorial(arma) {
  const historial = Array.isArray(arma.historial) ? arma.historial : [];
  if (!historial.length) return;

  const $toggle = document.getElementById("historial-toggle");
  const $body = document.getElementById("historial-body");
  if ($toggle && $body) {
    $toggle.addEventListener("click", () => {
      const ocultoAhora = $body.classList.toggle("hidden");
      $toggle.textContent = labelHistorialToggle(!ocultoAhora, historial.length);
    });
  }

  $detailPanel.querySelectorAll(".historial-entry__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const snap = $detailPanel.querySelector(`[data-hist-snapshot="${btn.dataset.histIdx}"]`);
      if (!snap) return;
      const abierto = snap.classList.toggle("open");
      btn.textContent = abierto ? "ocultar estadísticas" : "ver estadísticas";
    });
  });
}

/* ---------- Panel de detalle ---------- */

function abrirDetalle(id) {
  const arma = state.armas.find((a) => a.id === id);
  if (!arma) return;

  const actualizado = arma.actualizado || {};
  const meta =
    actualizado.fecha || actualizado.por
      ? `Actualizado ${actualizado.fecha ? "el " + escapeHTML(actualizado.fecha) : ""}${actualizado.por ? " por " + escapeHTML(actualizado.por) : ""}`
      : "Todavía sin actualizar.";

  $detailPanel.innerHTML = `
    <div class="detail-panel__head">
      <div>
        <div class="detail-panel__name">${escapeHTML(arma.nombre)}</div>
        <img src="images/${escapeHTML(arma.id)}.png" alt="${escapeHTML(arma.id)}" class="arma-detail-icon">
        <div class="detail-panel__cat">${escapeHTML(arma.categoria || "")}</div>
      </div>
      <button type="button" class="detail-close" id="detail-close" aria-label="Cerrar">✕</button>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">DAÑO POR IMPACTO</div>
      ${danoGridHTML(arma.dano)}
    </div>

    <div class="detail-section">
      <div class="detail-section__title">MANEJO</div>
      ${manejoHTML(arma)}
    </div>

    <div class="detail-section">
      <div class="detail-section__title">PRECISIÓN</div>
      ${precisionHTML(arma)}
    </div>

    ${arma.notas ? `<div class="detail-section detail-notas">${escapeHTML(arma.notas)}</div>` : ""}

    ${historialSectionHTML(arma)}

    <div class="detail-meta">${meta}</div>
  `;

  document.getElementById("detail-close").addEventListener("click", cerrarDetalle);
  conectarHistorial(arma);
  $overlay.classList.remove("hidden");
}

function cerrarDetalle() {
  $overlay.classList.add("hidden");
}

function normalizar(texto) {
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHTML(str) {
  return (str ?? "").toString().replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
