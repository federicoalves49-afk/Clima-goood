(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = { unit: "celsius", currentLocation: null, lastCity: "Guichón" };

  const weather = {
    0: ["Despejado", "☀️"], 1: ["Mayormente despejado", "🌤️"],
    2: ["Parcialmente nublado", "⛅"], 3: ["Nublado", "☁️"],
    45: ["Niebla", "🌫️"], 48: ["Niebla", "🌫️"],
    51: ["Llovizna ligera", "🌦️"], 53: ["Llovizna", "🌦️"], 55: ["Llovizna intensa", "🌧️"],
    56: ["Llovizna helada", "🌧️"], 57: ["Llovizna helada intensa", "🌧️"],
    61: ["Lluvia ligera", "🌦️"], 63: ["Lluvia", "🌧️"], 65: ["Lluvia intensa", "🌧️"],
    66: ["Lluvia helada", "🌧️"], 67: ["Lluvia helada intensa", "🌧️"],
    71: ["Nieve ligera", "🌨️"], 73: ["Nieve", "🌨️"], 75: ["Nieve intensa", "❄️"], 77: ["Granos de nieve", "❄️"],
    80: ["Chubascos ligeros", "🌦️"], 81: ["Chubascos", "🌧️"], 82: ["Chubascos intensos", "⛈️"],
    85: ["Chubascos de nieve", "🌨️"], 86: ["Chubascos de nieve intensos", "❄️"],
    95: ["Tormenta", "⛈️"], 96: ["Tormenta con granizo", "⛈️"], 99: ["Tormenta intensa con granizo", "⛈️"]
  };

  function temp(value) {
    if (!Number.isFinite(Number(value))) return "—";
    const n = state.unit === "celsius" ? Number(value) : Number(value) * 9 / 5 + 32;
    return `${Math.round(n)}°`;
  }
  function weatherInfo(code, isDay = 1) {
    const item = weather[code] || ["Condiciones variables", "🌡️"];
    if (!isDay && [0, 1].includes(Number(code))) return [item[0], "🌙"];
    return item;
  }
  function setStatus(message, isError = false) {
    $("status").textContent = message;
    $("status").classList.toggle("error", isError);
  }
  function safeText(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
  function formatTime(iso) {
    const part = String(iso).split("T")[1];
    return part ? part.slice(0, 5) : "—";
  }
  function formatDay(date, index) {
    if (index === 0) return "Hoy";
    return new Date(`${date}T12:00:00`).toLocaleDateString("es-UY", { weekday: "short", timeZone: "America/Montevideo" }).replace(".", "");
  }
  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error del servicio (${response.status}).`);
    return response.json();
  }
  async function geocode(city) {
    const data = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=8&language=es&format=json`);
    const results = data.results || [];
    if (!results.length) throw new Error(`No encontramos “${city}”. Probá con otra ciudad.`);
    const place = results.find(p => /uruguay/i.test(p.country || "")) || results[0];
    return { latitude: place.latitude, longitude: place.longitude, label: [place.name, place.admin1, place.country].filter(Boolean).join(", ") };
  }
  async function loadWeather(city = state.lastCity, coords = null) {
    setStatus("Consultando datos meteorológicos…");
    $("temperature").textContent = "--°";
    try {
      const place = coords
        ? { latitude: coords.latitude, longitude: coords.longitude, label: "Tu ubicación" }
        : await geocode(city);
      const params = new URLSearchParams({
        latitude: place.latitude, longitude: place.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
        hourly: "temperature_2m,precipitation_probability,weather_code",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto", forecast_days: "7", wind_speed_unit: "kmh"
      });
      const data = await getJson(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!data.current || !data.hourly || !data.daily) throw new Error("La API no devolvió todos los datos necesarios.");
      state.lastCity = city;
      state.currentLocation = coords ? { ...coords } : { latitude: place.latitude, longitude: place.longitude };
      render(data, place.label);
      setStatus(`Actualizado: ${new Date().toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setStatus(`${error.message || "No se pudo cargar el clima."} Revisá tu conexión e intentá nuevamente.`, true);
      $("hourly").innerHTML = '<p class="skeleton">No se pudo cargar el pronóstico por hora.</p>';
      $("daily").innerHTML = '<p class="skeleton">No se pudo cargar el pronóstico semanal.</p>';
    }
  }
  function render(data, label) {
    const c = data.current, h = data.hourly, d = data.daily;
    const [description, symbol] = weatherInfo(c.weather_code, c.is_day);
    $("place").textContent = label;
    $("heroIcon").textContent = symbol;
    $("temperature").textContent = temp(c.temperature_2m);
    $("condition").textContent = description;
    $("feelsLike").textContent = `Sensación térmica: ${temp(c.apparent_temperature)}`;
    $("feelsMetric").textContent = temp(c.apparent_temperature);
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
    $("todayHigh").textContent = `↑ Máx. ${temp(d.temperature_2m_max[0])}`;
    $("todayLow").textContent = `↓ Mín. ${temp(d.temperature_2m_min[0])}`;
    const hourIndex = Math.max(0, h.time.findIndex(t => t >= c.time));
    const rainProb = h.precipitation_probability?.[hourIndex];
    $("rain").textContent = Number.isFinite(rainProb) ? `${rainProb}%` : "—";
    $("localDate").textContent = new Intl.DateTimeFormat("es-UY", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
      timeZone: data.timezone || "America/Montevideo"
    }).format(new Date());
    $("hourly").innerHTML = h.time.slice(hourIndex, hourIndex + 12).map((time, offset) => {
      const i = hourIndex + offset;
      const info = weatherInfo(h.weather_code[i], 1);
      const labelTime = offset === 0 ? "Ahora" : formatTime(time);
      const probability = h.precipitation_probability?.[i];
      return `<article class="hour-card"><time>${safeText(labelTime)}</time><span class="weather-symbol" aria-hidden="true">${info[1]}</span><strong>${temp(h.temperature_2m[i])}</strong><small>💧 ${Number.isFinite(probability) ? probability + "%" : "—"}</small></article>`;
    }).join("");
    $("daily").innerHTML = d.time.map((date, i) => {
      const info = weatherInfo(d.weather_code[i], 1);
      return `<div class="day-row"><span class="day-name">${safeText(formatDay(date, i))}</span><span class="weather-symbol" aria-hidden="true">${info[1]}</span><span class="day-condition">${safeText(info[0])}</span><strong class="day-high">${temp(d.temperature_2m_max[i])}</strong><span class="day-low">${temp(d.temperature_2m_min[i])}</span></div>`;
    }).join("");
  }
  $("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const city = $("cityInput").value.trim();
    if (city) loadWeather(city);
  });
  $("themeBtn").addEventListener("click", () => {
    const light = document.body.classList.toggle("light");
    $("themeBtn").textContent = light ? "☀" : "☾";
    $("themeBtn").setAttribute("aria-label", light ? "Cambiar a tema oscuro" : "Cambiar a tema claro");
  });
  $("unitBtn").addEventListener("click", () => {
    state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
    $("unitBtn").textContent = state.unit === "celsius" ? "°C" : "°F";
    if (state.currentLocation) {
      const coords = state.currentLocation;
      loadWeather(state.lastCity, coords.label === "Tu ubicación" ? coords : null);
    } else {
      loadWeather(state.lastCity);
    }
  });
  $("locationBtn").addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      setStatus("Tu navegador no permite obtener la ubicación. Buscá una ciudad manualmente.", true);
      return;
    }
    setStatus("Solicitando permiso de ubicación…");
    navigator.geolocation.getCurrentPosition(
      position => loadWeather("Mi ubicación", { latitude: position.coords.latitude, longitude: position.coords.longitude }),
      error => {
        const message = error.code === 1 ? "No se concedió permiso de ubicación." : "No se pudo obtener tu ubicación.";
        setStatus(`${message} Podés buscar una ciudad manualmente.`, true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
  loadWeather();
})();
