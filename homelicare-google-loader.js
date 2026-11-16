/* Carga asíncrona de Maps JS. La función callback está declarada en homelicare-direcciones.js. */
(() => {
  const key = String(window.HOMELICARE_CONFIG?.GOOGLE_MAPS_API_KEY || "").trim();
  if (!key || key === "PEGA_AQUI_TU_API_KEY_RESTRINGIDA") {
    console.warn("HomeliCare: configura GOOGLE_MAPS_API_KEY en homelicare-config.js.");
    return;
  }
  const script = document.createElement("script");
  script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&v=weekly&loading=async&callback=initHomeliCareGoogle";
  script.async = true;
  script.onerror = () => console.error("HomeliCare: no se pudo cargar Google Maps JavaScript API.");
  document.head.appendChild(script);
})();
