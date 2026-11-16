/* Autocompletado moderno de Google Places (Autocomplete Data API / Places API New). */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const config = window.HOMELICARE_CONFIG || {};
  let placesLib, sessionToken, debounceId, requestSeq = 0, selected = false;
  const input = () => $("addressInput");
  const list = () => $("addressSuggestions");
  const status = (message, error = false) => {
    const el = $("addressStatus");
    if (el) { el.textContent = message; el.classList.toggle("error", error); }
  };
  const setHidden = (id, value) => { const el = $(id); if (el) el.value = value == null ? "" : String(value); };
  const component = (components, type, short = false) => {
    const c = (components || []).find(x => (x.types || []).includes(type));
    return c ? (short ? c.shortText : c.longText) || "" : "";
  };
  const hideList = () => { const el = list(); if (el) { el.hidden = true; el.replaceChildren(); } };
  const clearCoordinates = () => {
    ["addressStreet","addressNumber","addressNeighborhood","addressCity","addressState","addressPostalCode","addressCountry","addressLat","addressLng"].forEach(id => setHidden(id, ""));
    const badge = $("addressSelected"); if (badge) { badge.textContent = ""; badge.classList.remove("show"); }
    selected = false;
  };
  const freshToken = () => { sessionToken = placesLib ? new placesLib.AutocompleteSessionToken() : null; };

  async function getPlaces() {
    if (placesLib) return placesLib;
    if (!window.google?.maps?.importLibrary) throw new Error("Google Maps no terminó de cargar.");
    placesLib = await google.maps.importLibrary("places");
    freshToken();
    return placesLib;
  }

  function renderSuggestions(suggestions) {
    const box = list();
    box.replaceChildren();
    suggestions.forEach(suggestion => {
      const prediction = suggestion.placePrediction;
      if (!prediction) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "address-suggestion";
      button.setAttribute("role", "option");
      button.textContent = prediction.text?.toString?.() || "Dirección sugerida";
      button.addEventListener("click", () => choosePrediction(prediction));
      box.append(button);
    });
    box.hidden = box.childElementCount === 0;
  }

  async function search() {
    const text = input()?.value.trim() || "";
    const seq = ++requestSeq;
    if (text.length < 3) { hideList(); status("Escribe al menos 3 caracteres para buscar tu dirección."); return; }
    try {
      await getPlaces();
      const request = { input: text, sessionToken, includedRegionCodes: [String(config.GOOGLE_MAPS_REGION || "MX").toLowerCase()] };
      const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      if (seq !== requestSeq || input()?.value.trim() !== text) return;
      const suggestions = response.suggestions || [];
      renderSuggestions(suggestions);
      status(suggestions.length ? "Selecciona tu domicilio en la lista." : "No encontramos sugerencias. Intenta agregar calle, número y ciudad.", !suggestions.length);
    } catch (error) {
      console.error("Google Places Autocomplete:", error);
      hideList();
      status("No se pudieron cargar las direcciones. Verifica que Places API (New) esté habilitada y que la API Key permita tu dominio.", true);
    }
  }

  async function choosePrediction(prediction) {
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location", "addressComponents"] });
      if (!place.location) throw new Error("Google no devolvió coordenadas para esta dirección.");
      const parts = place.addressComponents || [];
      const lat = typeof place.location.lat === "function" ? place.location.lat() : place.location.lat;
      const lng = typeof place.location.lng === "function" ? place.location.lng() : place.location.lng;
      input().value = place.formattedAddress || input().value;
      setHidden("addressStreet", component(parts, "route"));
      setHidden("addressNumber", component(parts, "street_number"));
      setHidden("addressNeighborhood", component(parts, "sublocality_level_1") || component(parts, "neighborhood") || component(parts, "sublocality"));
      setHidden("addressCity", component(parts, "locality") || component(parts, "administrative_area_level_2"));
      setHidden("addressState", component(parts, "administrative_area_level_1"));
      setHidden("addressPostalCode", component(parts, "postal_code"));
      setHidden("addressCountry", component(parts, "country"));
      setHidden("addressLat", lat);
      setHidden("addressLng", lng);
      selected = true;
      hideList();
      const badge = $("addressSelected");
      if (badge) { badge.textContent = "✓ Ubicación confirmada · Coordenadas guardadas"; badge.classList.add("show"); }
      status("Domicilio localizado correctamente.");
      freshToken();
    } catch (error) {
      console.error("No se pudo seleccionar el domicilio:", error);
      clearCoordinates();
      status("No pudimos obtener las coordenadas. Selecciona otra sugerencia.", true);
    }
  }

  function init() {
    const field = input();
    if (!field || field.dataset.placesReady === "1") return;
    field.dataset.placesReady = "1";
    field.addEventListener("input", () => {
      clearCoordinates();
      clearTimeout(debounceId);
      debounceId = setTimeout(search, 300);
    });
    field.addEventListener("keydown", e => {
      if (e.key === "Escape") hideList();
      if (e.key === "ArrowDown" && !list().hidden) { e.preventDefault(); list().querySelector("button")?.focus(); }
    });
    document.addEventListener("click", e => {
      if (!e.target.closest(".address-wrap")) hideList();
    });
    status("Escribe tu calle, número y colonia para ver sugerencias.");
  }

  window.HomeliAddress = { init, get selected() { return selected; } };
  window.initHomeliCareGoogle = () => { init(); };
})();
