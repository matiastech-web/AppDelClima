let favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");
const favList = document.getElementById("fav-list");

// Modo oscuro
const themeBtn = document.getElementById("theme-btn");
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️ Modo claro";
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    themeBtn.textContent = "☀️ Modo claro";
    localStorage.setItem("theme", "dark");
  } else {
    themeBtn.textContent = "🌙 Modo oscuro";
    localStorage.setItem("theme", "light");
  }
});

const result = document.getElementById("result");
const input = document.getElementById("city-input");

async function buscarCiudad(nombre) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${nombre}`
  );
  const data = await res.json();
  if (data.length === 0) {
    result.innerHTML = "❌ Ciudad no encontrada";
    return;
  }
  const { lat, lon } = data[0];
  buscarClima(lat, lon, nombre);
}

async function buscarClima(lat, lon, nombre) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
  );

  const data = await res.json();
  const clima = data.current_weather;
  const humedad = data.hourly.relativehumidity_2m[0];
  const daily = data.daily;

  mostrarClima(nombre, clima, humedad);
  mostrarPronostico(daily);
  cambiarFondo(clima.weathercode);
}

function mostrarClima(nombre, clima, humedad) {
  result.innerHTML = `
    <div class="fade-in">
      <h2>${nombre}</h2>
      <p>${interpretarClima(clima.weathercode)}</p>
      <p>🌡️ Temp: ${clima.temperature}°C</p>
      <p>💧 Humedad: ${humedad}%</p>
      <p>🌬️ Viento: ${clima.windspeed} km/h</p>
      <p>🕒 Hora: ${clima.time}</p>
    </div>
  `;
}

function interpretarClima(code) {
  const estados = {
    0: "☀️ Despejado",
    1: "🌤️ Mayormente despejado",
    2: "⛅ Parcialmente nublado",
    3: "☁️ Nublado",
    45: "🌫️ Neblina",
    48: "🌫️ Neblina con escarcha",
    51: "🌦️ Llovizna ligera",
    61: "🌧️ Lluvia ligera",
    63: "🌧️ Lluvia moderada",
    65: "🌧️ Lluvia intensa",
    71: "❄️ Nieve ligera",
    80: "🌧️ Chaparrones",
    95: "⚡ Tormenta",
    96: "⚡ Tormenta",
    99: "⚡ Tormenta",
  };
  return estados[code] || "Condición desconocida";
}

function cambiarFondo(code) {
  document.body.classList.remove(
    "sunny",
    "cloudy",
    "overcast",
    "rainy",
    "night",
    "thunderstorm"
  );

  if (code === 0) document.body.classList.add("sunny");
  else if (code === 1 || code === 2) document.body.classList.add("cloudy");
  else if (code === 3) document.body.classList.add("overcast");
  else if (code >= 51 && code <= 67) document.body.classList.add("rainy");
  else if (code >= 80 && code <= 82) document.body.classList.add("rainy");
  else if (code >= 95 && code <= 99)
    document.body.classList.add("thunderstorm");
  else document.body.classList.add("night");
}

document.getElementById("search-btn").addEventListener("click", () => {
  if (!input.value) return alert("Escribe una ciudad");
  buscarCiudad(input.value);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarCiudad(input.value);
});

document.getElementById("geo-btn").addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    buscarClima(latitude, longitude, "Mi ubicación");
  });
});

// --- FAVORITOS ---
function agregarFavorito(nombre) {
  if (!favoritos.includes(nombre)) {
    favoritos.push(nombre);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    renderFavoritos();
  }
}

function eliminarFavorito(nombre) {
  favoritos = favoritos.filter((f) => f !== nombre);
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  renderFavoritos();
}

function renderFavoritos() {
  favList.innerHTML = "";
  favoritos.forEach((ciudad) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${ciudad}</span>
      <button onclick="eliminarFavorito('${ciudad}')">🗑</button>
    `;
    li.querySelector("span").addEventListener("click", () =>
      buscarCiudad(ciudad)
    );
    favList.appendChild(li);
  });
}

document.getElementById("fav-btn").addEventListener("click", () => {
  if (input.value) agregarFavorito(input.value);
});

document.getElementById("toggle-sidebar").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

function mostrarPronostico(daily) {
  const forecast = document.getElementById("forecast");
  forecast.innerHTML = "";

  for (let i = 0; i < 5; i++) {
    const fecha = new Date(daily.time[i]);
    const dia = fecha.toLocaleDateString("es-ES", { weekday: "short" });
    const icono = interpretarClima(daily.weathercode[i]);
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];

    forecast.innerHTML += `
      <div class="forecast-day">
        <p><b>${dia.toUpperCase()}</b></p>
        <p>${icono}</p>
        <p>${max}° / ${min}°</p>
      </div>
    `;
  }
}

// iniciar con Montevideo
renderFavoritos();
buscarCiudad("Montevideo");
