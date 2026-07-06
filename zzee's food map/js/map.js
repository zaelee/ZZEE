const FoodMap = (() => {
  let map;
  let markersLayer;
  let leafletRetryCount = 0;
  const markers = new Map();
  const fallbackPins = new Map();

  const mapElement = () => document.getElementById("map");
  const statusElement = () => document.getElementById("mapStatus");

  const setStatus = (message) => {
    const status = statusElement();
    if (status) status.textContent = message;
  };

  const validCoordinate = (restaurant) => {
    const latitude = Number(restaurant.latitude);
    const longitude = Number(restaurant.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude, longitude }
      : null;
  };

  const validRestaurants = (restaurants) =>
    restaurants.filter((restaurant) => validCoordinate(restaurant));

  const retryLeafletInit = (restaurants, onSelect, onPlacesResolved) => {
    window.setTimeout(() => {
      if (map) return;
      if (window.L) {
        init(restaurants, onSelect, onPlacesResolved);
        return;
      }

      leafletRetryCount += 1;
      if (leafletRetryCount < 30) retryLeafletInit(restaurants, onSelect, onPlacesResolved);
    }, 300);
  };

  const init = (restaurants, onSelect, onPlacesResolved) => {
    const mapNode = mapElement();
    if (!mapNode) return;

    if (!window.L) {
      setStatus("지도 라이브러리 로드 실패, 대체 지도 표시 중");
      renderFallbackMap(restaurants, onSelect);
      retryLeafletInit(restaurants, onSelect, onPlacesResolved);
      onPlacesResolved?.();
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
    mapNode.addEventListener("click", (event) => {
      const detailButton = event.target.closest("[data-map-detail]");
      if (!detailButton) return;

      event.preventDefault();
      event.stopPropagation();
      onSelect?.(detailButton.dataset.mapDetail, { openModal: true });
    });

    renderMarkers(restaurants, onSelect);
    setStatus("CARTO Voyager 지도 표시 중");
    onPlacesResolved?.();
  };

  const categoryFallback = () => Object.values(CATEGORY_META || {})[0] || { color: "#FF6B35" };
  const categoryMeta = (restaurant) => CATEGORY_META?.[restaurant.category] || categoryFallback();

  const markerIcon = (restaurant) =>
    L.divIcon({
      className: "leaflet-food-marker",
      html: `<span style="--pin-color: ${categoryMeta(restaurant).color}"></span>`,
      iconSize: [28, 36],
      iconAnchor: [14, 32],
      popupAnchor: [0, -28],
    });

  const ratingText = (restaurant) =>
    typeof restaurant.rating === "number" && restaurant.rating > 0
      ? `평점 ${restaurant.rating.toFixed(1)}`
      : "평점 확인 중";

  const popupContent = (restaurant) => `
    <div class="map-info">
      <strong>${restaurant.name}</strong>
      <span>${restaurant.area || "지역 확인"} · ${restaurant.category || "카테고리"} · ${ratingText(restaurant)}</span>
      <p>${restaurant.comment || ""}</p>
      <small>${restaurant.address || "주소 확인 중"}</small>
      <small>대표메뉴 ${restaurant.signatureMenu || "확인 중"}</small>
      <button class="map-detail-button" type="button" data-map-detail="${restaurant.id}">자세히보기</button>
      <div class="map-links">
        <a href="${restaurant.kakaoMapLink || "#"}" target="_blank" rel="noreferrer">카카오</a>
        <a href="${restaurant.naverMapLink || "#"}" target="_blank" rel="noreferrer">네이버</a>
        <a href="${restaurant.googleMapLink || "#"}" target="_blank" rel="noreferrer">구글</a>
      </div>
    </div>
  `;

  const renderMarkers = (restaurants, onSelect) => {
    if (!map || !markersLayer) {
      renderFallbackMap(restaurants, onSelect);
      return;
    }

    markers.clear();
    markersLayer.clearLayers();

    validRestaurants(restaurants).forEach((restaurant) => {
      const coordinate = validCoordinate(restaurant);
      const marker = L.marker([coordinate.latitude, coordinate.longitude], {
        icon: markerIcon(restaurant),
        title: restaurant.name,
      })
        .bindPopup(popupContent(restaurant), { maxWidth: 280 })
        .on("click", () => onSelect?.(restaurant.id, { openModal: false }));

      marker.addTo(markersLayer);
      markers.set(restaurant.id, marker);
    });

    fitToRestaurants(restaurants);
  };

  const focus = (restaurant) => {
    const coordinate = validCoordinate(restaurant);
    if (map && coordinate && markers.has(restaurant.id)) {
      const marker = markers.get(restaurant.id);
      map.setView([coordinate.latitude, coordinate.longitude], Math.max(map.getZoom(), 16), {
        animate: true,
      });
      marker.openPopup();
      return;
    }

    fallbackPins.forEach((pin) => pin.classList.remove("is-active"));
    fallbackPins.get(restaurant.id)?.classList.add("is-active");
  };

  const fitToRestaurants = (restaurants) => {
    if (!map) return;
    const coordinates = validRestaurants(restaurants).map((restaurant) => {
      const coordinate = validCoordinate(restaurant);
      return [coordinate.latitude, coordinate.longitude];
    });
    if (!coordinates.length) return;

    map.fitBounds(L.latLngBounds(coordinates), { padding: [36, 36], maxZoom: 16 });
  };

  const renderFallbackMap = (restaurants, onSelect) => {
    const mapNode = mapElement();
    if (!mapNode) return;

    mapNode.innerHTML = `
      <div class="fallback-map">
        <div class="fallback-grid"></div>
        <p>지도 라이브러리를 불러오지 못했습니다. 연결이 복구되면 OpenStreetMap 지도가 표시됩니다.</p>
      </div>
    `;
    fallbackPins.clear();

    restaurants.slice(0, 120).forEach((restaurant, index) => {
      const pin = document.createElement("button");
      pin.className = "fallback-pin";
      pin.type = "button";
      pin.title = restaurant.name;
      pin.style.setProperty("--x", `${16 + ((index * 23) % 72)}%`);
      pin.style.setProperty("--y", `${18 + ((index * 31) % 66)}%`);
      pin.style.setProperty("--pin-color", categoryMeta(restaurant).color);
      pin.textContent = index + 1;
      pin.addEventListener("click", () => {
        onSelect?.(restaurant.id, { openModal: true });
        focus(restaurant);
      });
      mapNode.appendChild(pin);
      fallbackPins.set(restaurant.id, pin);
    });
  };

  const update = (restaurants, onSelect) => {
    if (map && markersLayer) {
      renderMarkers(restaurants, onSelect);
      return;
    }

    renderFallbackMap(restaurants, onSelect);
  };

  return { init, focus, fitToRestaurants, update };
})();
