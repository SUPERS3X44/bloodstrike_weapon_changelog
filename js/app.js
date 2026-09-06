/* ===================================================================
   Blood Strike — Armería
   Sitio 100% estático: no hay build ni dependencias. Todo sale de
   los archivos JSON en data/weapons/, listados en data/manifest.json.
   =================================================================== */

const MAX_ESCALA = 100; // cadencia / retroceso / movilidad / alcance / precisión van de 0 a 100
const MAX_DANO = 100;   // referencia visual para las barras de daño (puntos por impacto)

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
        `<button class="chip${cat === state.categoria ? " active" : ""}" data-cat="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`
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

function tarjetaArma(arma) {
  const sinDatos = !(arma.cadencia || arma.movilidad || arma.alcance || arma.retroceso || arma.dano?.torso);

  return `
    <article class="weapon-card" data-id="${escapeHTML(arma.id)}" tabindex="0">
      <div class="weapon-card__top">
        <div class="weapon-card__name">${escapeHTML(arma.nombre)}</div>
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
        <div class="detail-panel__cat">${escapeHTML(arma.categoria || "")}</div>
      </div>
      <button class="detail-close" id="detail-close" aria-label="Cerrar">✕</button>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">DAÑO POR IMPACTO</div>
      <div class="dano-grid">
        <div class="dano-cell"><div class="dano-cell__num">${arma.dano?.cabeza ?? 0}</div><div class="dano-cell__label">Cabeza</div></div>
        <div class="dano-cell"><div class="dano-cell__num">${arma.dano?.torso ?? 0}</div><div class="dano-cell__label">Torso</div></div>
        <div class="dano-cell"><div class="dano-cell__num">${arma.dano?.extremidades ?? 0}</div><div class="dano-cell__label">Extremidades</div></div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">MANEJO</div>
      ${barraStat("Cadencia", arma.cadencia ?? 0, MAX_ESCALA)}
      ${barraStat("Retroceso", arma.retroceso ?? 0, MAX_ESCALA, "danger")}
      ${barraStat("Movilidad", arma.movilidad ?? 0, MAX_ESCALA, "cyan")}
      ${barraStat("Alcance", arma.alcance ?? 0, MAX_ESCALA)}
    </div>

    <div class="detail-section">
      <div class="detail-section__title">PRECISIÓN</div>
      ${barraStat("Apuntando (ADS)", arma.precision?.apuntando ?? 0, MAX_ESCALA, "cyan")}
      ${barraStat("Desde la cadera", arma.precision?.cadera ?? 0, MAX_ESCALA)}
    </div>

    ${arma.notas ? `<div class="detail-section detail-notas">${escapeHTML(arma.notas)}</div>` : ""}

    <div class="detail-meta">${meta}</div>
  `;

  document.getElementById("detail-close").addEventListener("click", cerrarDetalle);
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
