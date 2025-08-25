let API_DATA = null;

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const btnClear = document.getElementById('btn-clear');
const grid = document.createElement('div');
grid.className = 'grid';
document.querySelector('#results')?.appendChild(grid);

function normalize(str) {
  return str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
}

function resolveAlias(data) {
  const resolved = { ...data };

  if (resolved.playas) resolved.playas = resolved.beaches;
  if (resolved.templos) resolved.templos = resolved.temples;
  if (resolved['países'] || resolved.paises) {
    resolved.paises = resolved.countries;
    resolved['países'] = resolved.countries;
  }

  return resolved;
}

async function loadData() {
  try {
    const res = await fetch('travel_recommendation_api.json');
    const raw = await res.json();
    API_DATA = resolveAlias(raw);
    renderEmpty("Escribe una palabra clave (playa/beach, templo/temple, país/country).");
  } catch (err) {
    console.error("Error cargando JSON:", err);
    renderEmpty("No se pudo cargar la base de datos.");
  }
}

function renderEmpty(msg) {
  grid.innerHTML = `<div class="empty">${msg}</div>`;
}

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

function guessTimeZone(countryName) {
  const map = {
    spain: 'Europe/Madrid',
    espana: 'Europe/Madrid',
    japan: 'Asia/Tokyo',
    brazil: 'America/Sao_Paulo',
    australia: 'Australia/Sydney',
    india: 'Asia/Kolkata',
    usa: 'America/New_York',
    mexico: 'America/Mexico_City'
  };
  const key = normalize(countryName).replace(/\s+/g, '');
  return map[key];
}

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

function searchByKeyword(keyword) {
  if (!API_DATA) return renderEmpty('Datos no cargados todavía.');

  const { beaches = [], temples = [], countries = [], playas = [], templos = [], paises = [] } = API_DATA;
  let results = [];

  if (['playa', 'beach', 'playas', 'beaches'].includes(keyword)) {
    results = (beaches || playas).map(b => ({
      title: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
      badge: 'Playa / Beach'
    }));
  } else if (['templo', 'temple', 'templos', 'temples'].includes(keyword)) {
    results = (temples || templos).map(t => ({
      title: t.name,
      description: t.description,
      imageUrl: t.imageUrl,
      badge: 'Templo / Temple'
    }));
  } else if (['pais', 'país', 'paises', 'países', 'country', 'countries'].includes(keyword)) {
    results = (countries || paises).flatMap(c => {
      const cities = c.cities || [];
      const tz = c.timezone || guessTimeZone(c.name || '');
      return cities.slice(0, 2).map(city => ({
        title: `${city.name} – ${c.name}`,
        description: city.description,
        imageUrl: city.imageUrl,
        badge: 'País / Country',
        extra: tz ? timeBadge(tz) : ''
      }));
    });
  } else {
    const q = normalize(keyword);
    const country = (countries || []).find(c => normalize(c.name) === q);
    if (country) {
      const tz = country.timezone || guessTimeZone(country.name);
      const cities = country.cities || [];
      results = cities.map(city => ({
        title: `${city.name} – ${country.name}`,
        description: city.description,
        imageUrl: city.imageUrl,
        badge: 'País / Country',
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
  const keyword = normalize(q);
  searchByKeyword(keyword);
});

btnClear?.addEventListener('click', () => {
  input.value = '';
  renderEmpty('Resultados borrados.');
});

// Iniciar
window.addEventListener('DOMContentLoaded', loadData);