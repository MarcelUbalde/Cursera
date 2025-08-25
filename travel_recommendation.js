// TravelBloom – lógica de búsqueda y renderizado
argentina: 'America/Argentina/Buenos_Aires',
australia: 'Australia/Sydney'
};
const key = normalize(countryName).replace(/\s+/g, '');
return map[key];
}


function timeBadge(tz) {
try {
const now = new Date().toLocaleTimeString('es-ES', { timeZone: tz, hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' });
return `<div style="margin-top:8px;opacity:.9">🕒 Hora local: <strong>${now}</strong></div>`;
} catch {
return '';
}
}


function searchByKeyword(keyword) {
if (!API_DATA) return renderEmpty('Datos no cargados todavía.');


const { beaches = [], temples = [], countries = [] } = API_DATA;
let results = [];


if (keyword === 'playa') {
results = beaches.map(b => ({
title: b.name || b.title || 'Playa',
description: b.description || b.about || '',
imageUrl: b.imageUrl,
badge: 'Playa'
}));
} else if (keyword === 'templo') {
results = temples.map(t => ({
title: t.name || t.title || 'Templo',
description: t.description || t.about || '',
imageUrl: t.imageUrl,
badge: 'Templo'
}));
} else if (keyword === 'pais') {
results = countries.flatMap(c => {
const cities = c.cities || [];
const tz = c.timezone || guessTimeZone(c.name || '');
return cities.slice(0, 2).map(city => ({
title: `${city.name || 'Ciudad'} – ${c.name}`,
subtitle: c.name,
description: city.description || city.about || '',
imageUrl: city.imageUrl,
badge: 'País',
extra: tz ? timeBadge(tz) : ''
}));
});
} else {
// Búsqueda por nombre de país (p.ej. "España")
const q = normalize(keyword);
const country = (countries || []).find(c => normalize(c.name) === q);
if (country) {
const tz = country.timezone || guessTimeZone(country.name || '');
const cities = country.cities || [];
results = cities.map(city => ({
title: `${city.name || 'Ciudad'} – ${country.name}`,
subtitle: country.name,
description: city.description || city.about || '',
imageUrl: city.imageUrl,
badge: 'País',
extra: tz ? timeBadge(tz) : ''
}));
}
}


if (!results.length) return renderEmpty('Sin resultados para esa búsqueda.');
grid.innerHTML = results.map(cardHTML).join('');
}


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


// Carga de datos al inicio
window.addEventListener('DOMContentLoaded', loadData);