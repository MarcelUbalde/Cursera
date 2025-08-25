let API_DATA = null;

// Referencias a elementos del DOM
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const btnClear = document.getElementById('btn-clear');
const grid = document.getElementById('results');

// Normaliza texto (quita mayúsculas y acentos)
function normalize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Map de zonas horarias básicas
function guessTimeZone(countryName) {
  const map = {
    spain: 'Europe/Madrid',
    india: 'Asia/Kolkata',
    japan: 'Asia/Tokyo',
    usa: 'America/New_York',
    unitedstates: 'America/New_York',
    mexico: 'America/Mexico_City',
    brazil: 'America/Sao_Paulo',
    argentina: 'America/Argentina/Buenos_Aires',
    australia: 'Australia/Sydney'
  };
  const key = normalize(countryName).replace(/\s+/g, '');
  return map[key];
}

// Muestra la hora local si hay zona horaria
function timeBadge(tz) {
  try {
    const now = new Date().toLocaleTimeString('es-ES', { 
      timeZone: tz, 
      hour12: true, 
      hour: 'numeric', 
      minute: 'numeric' 
    });
    return `<div style="margin-top:8px;opacity:.9">🕒 Hora local: <strong>${now}</strong></div>`;
  } catch {
    return '';
  }
}

// Pinta un mensaje vacío
function renderEmpty(msg) {
  grid.innerHTML = `<div class="empty">${msg}</div>`;
}

// HTML de una tarjeta
function cardHTML(item) {
  return `
    <div class="card">
      <img src="${item.imageUrl}" alt="${item.title}">
      <div class="content">
        <span class="badge">${item.badge}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        ${item.extra || ""}
      </div>
    </div>
  `;
}

// Determina keyword (por ahora lo dejamos directo)
function deriveKeyword(q) {
  return normalize(q);
}

// Función de búsqueda
function searchByKeyword(keyword) {
  if (!API_DATA) return renderEmpty('Datos no cargados todavía.');

  const { beaches = [], temples = [], countries = [] } = API_DATA;
  let results = [];

  if (keyword === 'playa') {
    results = beaches.map(b => ({
      title: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
      badge: 'Playa'
    }));
  } else if (keyword === 'templo') {
    results = temples.map(t => ({
      title: t.name,
      description: t.description,
      imageUrl: t.imageUrl,
      badge: 'Templo'
    }));
  } else if (keyword === 'pais') {
    results = countries.flatMap(c => {
      const cities = c.cities || [];
      const tz = c.timezone || guessTimeZone(c.name);
      return cities.slice(0, 2).map(city => ({
        title: `${city.name} – ${c.name}`,
        description: city.description,
        imageUrl: city.imageUrl,
        badge: 'País',
        extra: tz ? timeBadge(tz) : ''
      }));
    });
  } else {
    // búsqueda por nombre de país
    const q = normalize(keyword);
    const country = countries.find(c => normalize(c.name) === q);
    if (country) {
      const tz = country.timezone || guessTimeZone(country.name);
      const cities = country.cities || [];
      results = cities.map(city => ({
        title: `${city.name} – ${country.name}`,
        description: city.description,
        imageUrl: city.imageUrl,
        badge: 'País',
        extra: tz ? timeBadge(tz) : ''
      }));
    }
  }

  if (!results.length) return renderEmpty('Sin resultados para esa búsqueda.');
  grid.innerHTML = results.map(cardHTML).join('');
}

// Listeners
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value;
  if (!q) return renderEmpty('Escribe una palabra clave.');
  const keyword = deriveKeyword(q);
  searchByKeyword(keyword);
});

btnClear?.addEventListener('click', () => {
  input.value = '';
  renderEmpty('Resultados borrados.');
});

// Carga inicial de datos
function loadData() {
  fetch('travel_recommendation_api.json')
    .then(res => res.json())
    .then(data => {
      API_DATA = data;
      console.log("Datos cargados:", data);
    })
    .catch(err => {
      console.error("Error cargando JSON:", err);
      renderEmpty("No se pudo cargar la base de datos.");
    });
}

window.addEventListener('DOMContentLoaded', loadData);