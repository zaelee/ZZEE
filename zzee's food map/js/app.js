const state = {
  area: "전체",
  category: "전체",
  rating: 0,
  sort: "recommended",
  query: "",
  favorites: new Set(JSON.parse(localStorage.getItem("jae-food-favorites") || "[]")),
  recent: JSON.parse(localStorage.getItem("jae-food-recent") || "[]"),
  addedRestaurants: JSON.parse(localStorage.getItem("jae-food-added-restaurants") || "[]"),
  editedRestaurants: JSON.parse(localStorage.getItem("jae-food-edited-restaurants") || "{}"),
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const ADD_PASSWORD = "0417";
const authorizedEditIds = new Set();
let authorizedAddSession = false;

const applyRestaurantEdits = (restaurant) => ({ ...restaurant, ...(state.editedRestaurants[restaurant.id] || {}) });
const allRestaurants = () => [...RESTAURANTS.map(applyRestaurantEdits), ...state.addedRestaurants];
const hasJaeRating = (rating) => typeof rating === "number" && rating > 0;
const categoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META["한식"];
const isLocalRestaurant = (restaurant) => restaurant?.id?.startsWith("local-");

const starText = (rating) => {
  if (!hasJaeRating(rating)) return "?";
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? "½" : "";
  return `${"★".repeat(full)}${half}${"☆".repeat(5 - full - (half ? 1 : 0))}`;
};

const starHtml = (rating) => {
  if (!hasJaeRating(rating)) {
    return `<span class="star-rating is-unknown" aria-label="재리 별점 검증전">?</span>`;
  }

  const stars = Array.from({ length: 5 }, (_, index) => {
    const value = rating - index;
    const className = value >= 1 ? "is-full" : value >= 0.5 ? "is-half" : "is-empty";
    return `<span class="${className}" aria-hidden="true">★</span>`;
  }).join("");

  return `<span class="star-rating" aria-label="재리 별점 ${rating}점">${stars}</span>`;
};

const saveFavorites = () => localStorage.setItem("jae-food-favorites", JSON.stringify([...state.favorites]));
const saveRecent = () => localStorage.setItem("jae-food-recent", JSON.stringify(state.recent));
const saveAddedRestaurants = () =>
  localStorage.setItem("jae-food-added-restaurants", JSON.stringify(state.addedRestaurants));
const saveEditedRestaurants = () =>
  localStorage.setItem("jae-food-edited-restaurants", JSON.stringify(state.editedRestaurants));

const pendingUpdates = () => {
  const added = state.addedRestaurants.map((restaurant) => ({ type: "ADD", restaurant }));
  const edited = Object.entries(state.editedRestaurants).map(([id, restaurant]) => ({
    type: "EDIT",
    id,
    restaurant,
  }));
  return [...added, ...edited];
};

const renderUpdateIndicator = () => {
  const button = $("#updateIndicator");
  if (!button) return;
  const updates = pendingUpdates();
  button.hidden = updates.length === 0;
  button.textContent = `Update ${updates.length}`;
  button.setAttribute("aria-label", `동기화 대기 ${updates.length}건`);
};

const showPendingUpdates = async () => {
  const updates = pendingUpdates();
  if (!updates.length) {
    window.alert("동기화할 업데이트가 없습니다.");
    return;
  }

  const payload = {
    added: state.addedRestaurants,
    edited: state.editedRestaurants,
  };
  const summary = updates.map((item, index) => `${index + 1}. ${item.type} ${item.restaurant.name}`).join("\n");

  try {
    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    window.alert(`동기화 대기 목록\n\n${summary}\n\n업데이트 JSON을 클립보드에 복사했습니다.`);
  } catch {
    window.alert(`동기화 대기 목록\n\n${summary}`);
  }
};

const filteredRestaurants = () => {
  const normalizedQuery = state.query.trim().toLowerCase();
  return allRestaurants().filter((restaurant) => {
    const areaMatch = state.area === "전체" || restaurant.area === state.area;
    const categoryMatch = state.category === "전체" || restaurant.category === state.category;
    const ratingMatch = state.rating === 0 || (hasJaeRating(restaurant.rating) && restaurant.rating >= state.rating);
    const queryTarget = [
      restaurant.name,
      restaurant.area,
      restaurant.category,
      restaurant.comment,
      restaurant.signatureMenu,
      restaurant.jaeComment,
      restaurant.address,
    ]
      .join(" ")
      .toLowerCase();
    return areaMatch && categoryMatch && ratingMatch && queryTarget.includes(normalizedQuery);
  }).sort((a, b) => {
    if (state.sort === "rating") {
      return (b.rating || 0) - (a.rating || 0) || a.recommendedOrder - b.recommendedOrder;
    }
    if (state.sort === "name") return a.name.localeCompare(b.name, "ko");
    return a.recommendedOrder - b.recommendedOrder;
  });
};

const verificationBadge = (restaurant) =>
  restaurant.verificationStatus === "검증후" || restaurant.verifiedAt
    ? `<span class="verify-badge is-verified">VERIFIED</span>`
    : `<span class="verify-badge">PENDING</span>`;

const platformMini = (restaurant) =>
  Object.entries(restaurant.platformRatings || {})
    .map(([key, platform]) => {
      const shortLabel = { kakao: "카", naver: "네", google: "구" }[key] || platform.label;
      const value =
        typeof platform.rating === "number" && platform.rating > 0
          ? platform.rating.toFixed(1)
          : platform.reviewCount
            ? `후기 ${platform.reviewCount.toLocaleString("ko-KR")}`
            : "-";
      const highClass = platform.rating > 4.5 ? "is-high-rating" : "";
      return `<span class="${highClass}">${shortLabel} ${value}</span>`;
    })
    .join("");

const refreshMap = () => FoodMap.update?.(filteredRestaurants(), selectRestaurant);

const renderCards = () => {
  const restaurants = filteredRestaurants();
  const list = $("#restaurantList");
  $("#resultSummary").textContent = `${restaurants.length}곳의 맛집`;

  list.innerHTML = restaurants
    .map((restaurant) => {
      const meta = categoryMeta(restaurant.category);
      const favorite = state.favorites.has(restaurant.id);
      const thumbnail = restaurant.images?.[0] || meta.image;
      const ratingClass = hasJaeRating(restaurant.rating) ? `rating-${Math.floor(restaurant.rating)}` : "rating-unknown";
      const highRatingClass = restaurant.rating > 4.5 ? "is-top-rated" : "";
      return `
        <article class="restaurant-card ${ratingClass}" data-id="${restaurant.id}" style="--category-color: ${meta.color}">
          <div class="card-thumb-wrap">
            <img class="card-thumb ${highRatingClass}" src="${thumbnail}" alt="${restaurant.name} 대표 이미지" loading="lazy" onerror="this.src='${meta.image}'" />
            ${verificationBadge(restaurant)}
          </div>
          <button class="favorite-button ${favorite ? "is-active" : ""}" type="button" data-favorite="${restaurant.id}" aria-label="즐겨찾기">
            ${favorite ? "♥" : "♡"}
          </button>
          <div class="card-topline">
            <span class="stars ${restaurant.rating > 4.5 ? "is-high-rating" : ""}">${starHtml(restaurant.rating)}</span>
            <span class="category-pill">${restaurant.area} · ${restaurant.category}</span>
          </div>
          <div class="card-title-row">
            <h2>${restaurant.name}</h2>
          </div>
          <p>${restaurant.comment}</p>
          <div class="platform-mini">${platformMini(restaurant)}</div>
          <div class="card-meta">
            <span>${restaurant.signatureMenu}</span>
            <span>${restaurant.address}</span>
          </div>
        </article>
      `;
    })
    .join("");

  if (restaurants.length === 0) {
    list.innerHTML = `<p class="empty-state">조건에 맞는 맛집이 없습니다.</p>`;
  }
};

const renderRecent = () => {
  const recentList = $("#recentList");
  const recentRestaurants = state.recent
    .map((id) => allRestaurants().find((restaurant) => restaurant.id === id))
    .filter(Boolean);

  recentList.innerHTML = recentRestaurants.length
    ? recentRestaurants
        .map((restaurant) => `<button type="button" data-recent="${restaurant.id}">${restaurant.name}</button>`)
        .join("")
    : `<span>아직 최근 본 맛집이 없습니다.</span>`;
};

const rememberRecent = (id) => {
  state.recent = [id, ...state.recent.filter((recentId) => recentId !== id)].slice(0, 6);
  saveRecent();
  renderRecent();
};

const platformRatingText = (platform) => {
  if (typeof platform.rating === "number" && platform.rating > 0) return `평점 ${platform.rating}`;
  if (platform.reviewCount) return `평점 미표시 · 후기 ${platform.reviewCount.toLocaleString("ko-KR")}개`;
  return platform.note || "평점 미표시";
};

const checkedText = (checkedAt) => (checkedAt ? `확인일 ${checkedAt}` : "확인일 미입력");
const priceText = (price) => (typeof price === "number" ? `${price.toLocaleString("ko-KR")}원` : "가격 확인 중");

const platformRows = (restaurant) => {
  const links = {
    kakao: restaurant.kakaoMapLink,
    naver: restaurant.naverMapLink,
    google: restaurant.googleMapLink,
  };

  return Object.entries(restaurant.platformRatings)
    .map(([key, platform]) => `
      <a class="platform-link ${platform.rating > 4.5 ? "is-high-rating" : ""}" href="${links[key]}" target="_blank" rel="noreferrer">
        <strong>${platform.label}</strong>
        <span>${platformRatingText(platform)}</span>
        <small>${checkedText(platform.checkedAt)}</small>
      </a>
    `)
    .join("");
};

const menuItemsHtml = (restaurant) =>
  restaurant.menuItems
    .map((menu) => `
      <li>
        <span>${menu.name}</span>
        <strong>${priceText(menu.price)}</strong>
      </li>
    `)
    .join("");

const openModal = (restaurant) => {
  rememberRecent(restaurant.id);
  $("#modalContent").innerHTML = `
    <img class="modal-image" src="${restaurant.images[0]}" alt="${restaurant.category} 대표 이미지" onerror="this.src='${categoryMeta(restaurant.category).image}'" />
    <div class="modal-body">
      <div class="modal-title-row">
        <div>
          <p class="eyebrow">${restaurant.area} · ${restaurant.category} · ${(restaurant.verificationStatus === "검증후" || restaurant.verifiedAt) ? "VERIFIED" : "PENDING"}</p>
          <h2 id="modalTitle">${restaurant.name}</h2>
        </div>
        <div class="modal-actions">
          <button class="text-button modal-edit" type="button" data-edit="${restaurant.id}">Edit</button>
          <span class="modal-rating ${restaurant.rating > 4.5 ? "is-high-rating" : ""}">재리 ${starHtml(restaurant.rating)} ${hasJaeRating(restaurant.rating) ? restaurant.rating.toFixed(1) : "검증전"}</span>
        </div>
      </div>
      <p class="modal-comment">${restaurant.jaeComment}</p>
      <dl class="detail-list">
        <div><dt>가격대</dt><dd>${restaurant.priceRange}<small>${restaurant.priceSource}</small></dd></div>
        <div><dt>데이터 확인</dt><dd>${checkedText(restaurant.verifiedAt)}<small>${restaurant.verificationNote}</small></dd></div>
        <div><dt>분위기</dt><dd>${restaurant.mood}</dd></div>
        <div><dt>주소</dt><dd>${restaurant.address}</dd></div>
      </dl>
      <section class="menu-section" aria-label="대표 메뉴와 가격">
        <h3>대표 메뉴</h3>
        <ul>${menuItemsHtml(restaurant)}</ul>
      </section>
      <section class="platform-section" aria-label="지도 플랫폼 링크와 평점">
        <h3>지도별 정보</h3>
        <div class="platform-grid">${platformRows(restaurant)}</div>
      </section>
    </div>
  `;
  $("#detailModal").classList.add("is-open");
  $("#detailModal").setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  $("#detailModal").classList.remove("is-open");
  $("#detailModal").setAttribute("aria-hidden", "true");
};

const menuItemsValue = (items = []) =>
  items.map((item) => `${item.name || ""}${item.price ? ` | ${item.price}` : ""}`).join("\n");

const setAddPanelMode = (restaurant = null, options = {}) => {
  const form = $("#addRestaurantForm");
  const passwordField = $("#addPassword");
  const passwordLabel = passwordField.closest("label");
  const editFields = $("[data-edit-fields]");
  form.reset();
  $("#addFormMessage").textContent = "";
  $("#editRestaurantId").value = restaurant?.id || "";
  $("#addTitle").textContent = restaurant ? "맛집 수정" : "맛집 추가";
  $(".add-submit").textContent = restaurant ? "Save pending edit" : "Add as pending";
  passwordLabel.hidden = Boolean(options.authorized);
  passwordField.required = !options.authorized;
  editFields.hidden = !restaurant;

  if (!restaurant) return;
  form.elements.name.value = restaurant.name || "";
  form.elements.comment.value = restaurant.comment || "";
  form.elements.address.value = restaurant.address || "";
  form.elements.verificationStatus.value = restaurant.verificationStatus || "검증전";
  form.elements.area.value = restaurant.area || "건대";
  form.elements.category.value = restaurant.category || "한식";
  form.elements.rating.value = restaurant.rating ?? "";
  form.elements.signatureMenu.value = restaurant.signatureMenu || "";
  form.elements.priceRange.value = restaurant.priceRange || "";
  form.elements.mood.value = restaurant.mood || "";
  form.elements.jaeComment.value = restaurant.jaeComment || "";
  form.elements.menuItems.value = menuItemsValue(restaurant.menuItems);
  form.elements.image.value = restaurant.images?.[0] || "";
  form.elements.kakaoRating.value = restaurant.platformRatings?.kakao?.rating ?? "";
  form.elements.naverRating.value = restaurant.platformRatings?.naver?.rating ?? "";
  form.elements.googleRating.value = restaurant.platformRatings?.google?.rating ?? "";
  form.elements.kakaoMapLink.value = restaurant.kakaoMapLink || "";
  form.elements.naverMapLink.value = restaurant.naverMapLink || "";
  form.elements.googleMapLink.value = restaurant.googleMapLink || "";
};

const openAddPanel = (restaurant = null, options = {}) => {
  setAddPanelMode(restaurant, options);
  $("#addPanel").classList.add("is-open");
  $("#addPanel").setAttribute("aria-hidden", "false");
  (options.authorized ? $("#addRestaurantForm").elements.name : $("#addPassword")).focus();
};

const closeAddPanel = () => {
  const editId = $("#editRestaurantId").value;
  if (editId) authorizedEditIds.delete(editId);
  authorizedAddSession = false;
  $("#addPanel").classList.remove("is-open");
  $("#addPanel").setAttribute("aria-hidden", "true");
};

const selectRestaurant = (id, options = { openModal: true }) => {
  const restaurant = allRestaurants().find((item) => item.id === id);
  if (!restaurant) return;
  FoodMap.focus(restaurant);
  rememberRecent(id);
  if (options.openModal) openModal(restaurant);
};

const bindEvents = () => {
  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
    refreshMap();
  });

  $("[aria-label='지역 필터']").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter='area']");
    if (!button) return;
    state.area = button.dataset.value;
    $$(".area-tab").forEach((tab) => tab.classList.toggle("is-active", tab === button));
    renderCards();
    refreshMap();
  });

  $("[aria-label='카테고리 필터']").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter='category']");
    if (!button) return;
    state.category = button.dataset.value;
    $$(".chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderCards();
    refreshMap();
  });

  $("#ratingFilter").addEventListener("change", (event) => {
    state.rating = Number(event.target.value);
    renderCards();
    refreshMap();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCards();
    refreshMap();
  });

  $("#restaurantList").addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      saveFavorites();
      renderCards();
      refreshMap();
      return;
    }

    const card = event.target.closest("[data-id]");
    if (card) selectRestaurant(card.dataset.id);
  });

  $("#modalContent").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit]");
    if (!editButton) return;
    const restaurant = allRestaurants().find((item) => item.id === editButton.dataset.edit);
    if (!restaurant) return;
    const password = window.prompt("수정 비밀번호를 입력하세요.");
    if (password !== ADD_PASSWORD) {
      window.alert("비밀번호가 틀려서 수정할 수 없습니다.");
      return;
    }
    authorizedEditIds.add(restaurant.id);
    closeModal();
    openAddPanel(restaurant, { authorized: true });
  });

  $("#recentList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-recent]");
    if (button) selectRestaurant(button.dataset.recent);
  });

  $("#clearRecent").addEventListener("click", () => {
    state.recent = [];
    saveRecent();
    renderRecent();
  });

  $("#fitMap").addEventListener("click", () => FoodMap.fitToRestaurants(filteredRestaurants()));
  $("#updateIndicator").addEventListener("click", showPendingUpdates);
  $("#addToggle").addEventListener("click", () => {
    const password = window.prompt("추가 비밀번호를 입력하세요.");
    if (password !== ADD_PASSWORD) {
      window.alert("비밀번호가 틀려서 추가할 수 없습니다.");
      return;
    }
    authorizedAddSession = true;
    openAddPanel(null, { authorized: true });
  });
  $$("[data-close-add]").forEach((button) => button.addEventListener("click", closeAddPanel));
  $("#addRestaurantForm").addEventListener("submit", addRestaurant);
  $("#themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("jae-food-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  $$("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeAddPanel();
    }
  });
};

const inferArea = (name, address, comment) => {
  const text = `${name} ${address} ${comment}`;
  return /성수|성동|뚝섬|서울숲/.test(text) ? "성수" : "건대";
};

const inferCategory = (name, comment) => {
  const text = `${name} ${comment}`;
  if (/카페|커피|디저트|빵|베이글|젤라또|소금빵|차|티|휘낭시에|콘파냐/.test(text)) return "디저트";
  if (/라멘|소바|우동|텐동|초밥|스시|오코노미|야키토리|돈카츠|사케동|일식/.test(text)) return "일식";
  if (/중식|마라|양꼬치|도삭|딤섬|탕수육|탄탄|짜장|짬뽕/.test(text)) return "중식";
  if (/쌀국수|태국|베트남|아시아|짜이/.test(text)) return "아시아";
  if (/버거|햄버거|치킨버거|슬라이더/.test(text)) return "햄부기";
  if (/타코|멕시칸/.test(text)) return "멕시칸";
  if (/피자|파스타|와인|스테이크|양식|샤퀴테리/.test(text)) return "양식";
  return "한식";
};

const numberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const parseMenuItems = (value, fallbackName) => {
  const items = value
    .split(/\n+/)
    .map((line) => {
      const [name, price] = line.split("|").map((part) => part.trim());
      if (!name) return null;
      return { name, price: price ? Number(price.replace(/[^\d]/g, "")) || null : null };
    })
    .filter(Boolean);

  return items.length ? items : buildMenuItems(fallbackName);
};

const editOverridesFromForm = (formData, previous) => {
  const signatureMenu = formData.get("signatureMenu")?.trim() || previous.signatureMenu || "대표 메뉴 확인 필요";
  const image = formData.get("image")?.trim();

  return {
    area: formData.get("area") || previous.area,
    category: formData.get("category") || previous.category,
    verificationStatus: formData.get("verificationStatus") || previous.verificationStatus || "검증전",
    rating: numberOrNull(formData.get("rating")),
    signatureMenu,
    menuItems: parseMenuItems(formData.get("menuItems") || "", signatureMenu),
    priceRange: formData.get("priceRange")?.trim() || previous.priceRange,
    mood: formData.get("mood")?.trim() || previous.mood,
    jaeComment: formData.get("jaeComment")?.trim() || previous.jaeComment,
    images: image ? [image, ...(previous.images || []).filter((url) => url !== image)] : previous.images,
    kakaoMapLink: formData.get("kakaoMapLink")?.trim() || previous.kakaoMapLink,
    naverMapLink: formData.get("naverMapLink")?.trim() || previous.naverMapLink,
    googleMapLink: formData.get("googleMapLink")?.trim() || previous.googleMapLink,
    platformRatings: {
      kakao: { ...(previous.platformRatings?.kakao || { label: "카카오" }), rating: numberOrNull(formData.get("kakaoRating")) },
      naver: { ...(previous.platformRatings?.naver || { label: "네이버" }), rating: numberOrNull(formData.get("naverRating")) },
      google: { ...(previous.platformRatings?.google || { label: "구글" }), rating: numberOrNull(formData.get("googleRating")) },
    },
  };
};

const buildPendingRestaurant = ({
  id,
  name,
  comment,
  address,
  recommendedOrder,
  previous = {},
  forcePending = false,
  overrides = {},
}) => {
  const area = overrides.area || inferArea(name, address, comment);
  const category = overrides.category || inferCategory(name, comment);
  const meta = categoryMeta(category);
  const fallback = area === "성수" ? { lat: 37.5446, lng: 127.0557 } : { lat: 37.5404, lng: 127.0692 };
  const searchText = `${address} ${name}`.trim();
  const searchQuery = encodeURIComponent(searchText);
  const signatureMenu = overrides.signatureMenu || previous.signatureMenu || "대표 메뉴 확인 필요";
  const verificationStatus = overrides.verificationStatus || (forcePending ? "검증전" : previous.verificationStatus || "검증전");
  const isVerified = verificationStatus === "검증후";

  return {
    ...previous,
    id,
    name,
    area,
    category,
    rating: isVerified ? overrides.rating ?? previous.rating ?? null : null,
    comment: comment || "검증 전 맛집 메모",
    signatureMenu,
    menuItems: overrides.menuItems || (previous.menuItems?.length ? previous.menuItems : buildMenuItems(signatureMenu)),
    priceRange: overrides.priceRange || previous.priceRange || priceByCategory[category],
    priceSource: forcePending ? "검증 대기" : previous.priceSource || "검증 대기",
    verifiedAt: isVerified ? previous.verifiedAt || new Date().toISOString().slice(0, 10) : null,
    verificationStatus,
    verificationNote: !isVerified
      ? "이름, 한줄평, 주소만 입력된 검증 전 맛집입니다. 플랫폼 평점, 메뉴, 가격, 좌표는 추후 확인 필요."
      : previous.verificationNote || "수정된 로컬 덮어쓰기 데이터입니다.",
    mood: overrides.mood || moodByCategory[category],
    jaeComment: overrides.jaeComment || previous.jaeComment || "검증 후 코멘트를 입력할 예정입니다.",
    searchKeyword: searchText,
    naverMapLink: overrides.naverMapLink || `https://map.naver.com/p/search/${searchQuery}`,
    kakaoMapLink: overrides.kakaoMapLink || `https://map.kakao.com/link/search/${searchQuery}`,
    googleMapLink: overrides.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
    platformRatings: overrides.platformRatings || previous.platformRatings || {
      kakao: { label: "카카오", rating: null, checkedAt: null, note: "카카오 평점 확인 예정" },
      naver: { label: "네이버", rating: null, checkedAt: null, note: "네이버 평점 확인 예정" },
      google: { label: "구글", rating: null, checkedAt: null, note: "구글 평점 확인 예정" },
    },
    address,
    latitude: previous.latitude || fallback.lat + (Math.random() - 0.5) * 0.004,
    longitude: previous.longitude || fallback.lng + (Math.random() - 0.5) * 0.004,
    images: overrides.images?.length ? overrides.images : previous.images?.length ? previous.images : [meta.image],
    recommendedOrder,
  };
};

const addRestaurant = (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const message = $("#addFormMessage");
  const editId = formData.get("editId");
  const isAuthorizedEdit = editId && authorizedEditIds.has(editId);
  const isAuthorizedAdd = !editId && authorizedAddSession;

  if (!isAuthorizedEdit && !isAuthorizedAdd && formData.get("password") !== ADD_PASSWORD) {
    message.textContent = "비밀번호가 달라서 추가하지 않았습니다.";
    return;
  }

  const name = formData.get("name").trim();
  const comment = formData.get("comment").trim();
  const address = formData.get("address").trim();
  const localEditIndex = state.addedRestaurants.findIndex((item) => item.id === editId);
  const existingRestaurant = editId ? allRestaurants().find((item) => item.id === editId) : null;
  const previous = existingRestaurant || {};
  const selectedStatus = formData.get("verificationStatus") || "검증전";
  const overrides = editId
    ? editOverridesFromForm(formData, previous)
    : { verificationStatus: selectedStatus };
  const id = editId || `local-${Date.now()}-${name.replace(/\s+/g, "-").toLowerCase()}`;
  const recommendedOrder = previous.recommendedOrder || 10000 + state.addedRestaurants.length;
  const restaurant = buildPendingRestaurant({
    id,
    name,
    comment,
    address,
    recommendedOrder,
    previous,
    forcePending: !editId,
    overrides,
  });

  if (localEditIndex >= 0) {
    state.addedRestaurants.splice(localEditIndex, 1, restaurant);
  } else if (editId) {
    state.editedRestaurants[editId] = restaurant;
  } else {
    state.addedRestaurants = [restaurant, ...state.addedRestaurants];
  }

  saveAddedRestaurants();
  saveEditedRestaurants();
  authorizedEditIds.delete(editId);
  authorizedAddSession = false;
  form.reset();
  $("#editRestaurantId").value = "";
  message.textContent = editId ? `${name} pending edit saved.` : `${name} added as pending.`;
  renderUpdateIndicator();
  renderCards();
  renderRecent();
  refreshMap();
};

const initTheme = () => {
  if (localStorage.getItem("jae-food-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindEvents();
  renderUpdateIndicator();
  renderCards();
  renderRecent();
  FoodMap.init(filteredRestaurants(), selectRestaurant, renderCards);
});
