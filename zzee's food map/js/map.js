const FoodMap = (() => {
  let map;
  let markersLayer;
  const markers = new Map();
  const fallbackPins = new Map();

  const mapElement = () => document.getElementById("map");
  const statusElement = () => document.getElementById("mapStatus");

  const setStatus = (message) => {
    const status = statusElement();
    if (status) status.textContent = message;
  };

  const init = async (restaurants, onSelect, onPlacesResolved) => {
    if (!window.L) {
      setStatus("지도 라이브러리 로드 실패");
      renderFallbackMap(restaurants, onSelect);
      return;
    }

    map = L.map("map", {
      center: [37.5404, 127.0692],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    renderMarkers(restaurants, onSelect);
    setStatus("CARTO Voyager 지도 표시 중");
    onPlacesResolved?.();
  };

  const markerIcon = (restaurant) => {
    const color = (CATEGORY_META[restaurant.category] || CATEGORY_META["한식"]).color;
    return L.divIcon({
      className: "leaflet-food-marker",
      html: `<span style="--pin-color: ${color}"></span>`,
      iconSize: [28, 36],
      iconAnchor: [14, 32],
      popupAnchor: [0, -28],
    });
  };

  const jaeRatingText = (restaurant) =>
    typeof restaurant.rating === "number" && restaurant.rating > 0
      ? `${"★".repeat(Math.floor(restaurant.rating))} ${restaurant.rating}`
      : "? 검증전";

  const popupContent = (restaurant) => `
    <div class="map-info">
      <strong>${restaurant.name}</strong>
      <span>${restaurant.area} · ${restaurant.category} · ${jaeRatingText(restaurant)}</span>
      <p>${restaurant.comment}</p>
      <small>${restaurant.address}</small>
      <small>대표메뉴: ${restaurant.signatureMenu}</small>
      <div class="map-links">
        <a href="${restaurant.kakaoMapLink}" target="_blank" rel="noreferrer">카카오</a>
        <a href="${restaurant.naverMapLink}" target="_blank" rel="noreferrer">네이버</a>
        <a href="${restaurant.googleMapLink}" target="_blank" rel="noreferrer">구글</a>
      </div>
    </div>
  `;

  const renderMarkers = (restaurants, onSelect) => {
    if (!map || !markersLayer) return;
    markers.clear();
    markersLayer.clearLayers();

    restaurants.forEach((restaurant) => {
      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        icon: markerIcon(restaurant),
        title: restaurant.name,
      })
        .bindPopup(popupContent(restaurant), { maxWidth: 260 })
        .on("click", () => onSelect?.(restaurant.id, { openModal: false }));

      marker.addTo(markersLayer);
      markers.set(restaurant.id, marker);
    });

    fitToRestaurants(restaurants);
  };

  const focus = (restaurant) => {
    if (map && markers.has(restaurant.id)) {
      const marker = markers.get(restaurant.id);
      map.setView([restaurant.latitude, restaurant.longitude], Math.max(map.getZoom(), 16), {
        animate: true,
      });
      marker.openPopup();
      return;
    }

    fallbackPins.forEach((pin) => pin.classList.remove("is-active"));
    fallbackPins.get(restaurant.id)?.classList.add("is-active");
  };

  const fitToRestaurants = (restaurants) => {
    if (!map || restaurants.length === 0) return;
    const bounds = L.latLngBounds(restaurants.map((restaurant) => [restaurant.latitude, restaurant.longitude]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  };

  const renderFallbackMap = (restaurants, onSelect) => {
    const mapNode = mapElement();
    mapNode.innerHTML = `
      <div class="fallback-map">
        <div class="fallback-grid"></div>
        <p>인터넷 연결 또는 Leaflet CDN 로드를 확인해주세요. 지도 라이브러리가 로드되면 OpenStreetMap이 표시됩니다.</p>
      </div>
    `;
    fallbackPins.clear();

    restaurants.forEach((restaurant, index) => {
      const pin = document.createElement("button");
      pin.className = "fallback-pin";
      pin.type = "button";
      pin.title = restaurant.name;
      pin.style.setProperty("--x", `${16 + ((index * 23) % 72)}%`);
      pin.style.setProperty("--y", `${18 + ((index * 31) % 66)}%`);
      pin.style.setProperty("--pin-color", (CATEGORY_META[restaurant.category] || CATEGORY_META["한식"]).color);
      pin.textContent = index + 1;
      pin.addEventListener("click", () => {
        onSelect?.(restaurant.id, { openModal: false });
        focus(restaurant);
      });
      mapNode.appendChild(pin);
      fallbackPins.set(restaurant.id, pin);
    });
  };

  const update = (restaurants, onSelect) => {
    renderMarkers(restaurants, onSelect);
  };

  return { init, focus, fitToRestaurants, update };
})();
