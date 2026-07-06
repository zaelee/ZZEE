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

const sharedRestaurants = () =>
  Array.isArray(window.NAVER_SHARED_RESTAURANTS)
    ? window.NAVER_SHARED_RESTAURANTS
    : typeof NAVER_SHARED_RESTAURANTS !== "undefined" && Array.isArray(NAVER_SHARED_RESTAURANTS)
      ? NAVER_SHARED_RESTAURANTS
      : [];
const platformRatingValues = (restaurant) =>
  ["kakao", "naver", "google"]
    .map((key) => restaurant.platformRatings?.[key]?.rating)
    .filter((rating) => Number.isFinite(rating) && rating > 0 && rating <= 5);
const platformRating = (platform) =>
  Number.isFinite(platform?.rating) && platform.rating > 0 && platform.rating <= 5 ? platform.rating : null;
const platformAverage = (restaurant) => {
  const ratings = platformRatingValues(restaurant);
  if (!ratings.length) return null;
  return Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10;
};
const shouldUsePlatformAverage = (restaurant) =>
  restaurant.ratingSource === "platformAverage" ||
  restaurant.ratingLabel === "평균별점" ||
  restaurant.importedFrom?.source === "naver-shared-list";
const normalizeRestaurantRating = (restaurant) => {
  if (!shouldUsePlatformAverage(restaurant)) return restaurant;
  const average = platformAverage(restaurant);
  return {
    ...restaurant,
    rating: average,
    ...(average
      ? { ratingSource: "platformAverage", ratingLabel: "평균별점" }
      : { ratingSource: undefined, ratingLabel: undefined }),
  };
};
const applyRestaurantEdits = (restaurant) => ({ ...restaurant, ...(state.editedRestaurants[restaurant.id] || {}) });
const allRestaurants = () => {
  const merged = [...RESTAURANTS, ...sharedRestaurants()];
  const seen = new Set();
  const unique = merged.filter((restaurant) => {
    const key = restaurant.id || `${restaurant.name}-${restaurant.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...unique.map(applyRestaurantEdits), ...state.addedRestaurants].map(normalizeRestaurantRating);
};
const hasJaeRating = (rating) => typeof rating === "number" && rating > 0;
const shouldEmphasizeRating = (restaurant) => {
  if (!hasJaeRating(restaurant.rating) || restaurant.rating <= 4.5) return false;
  return shouldUsePlatformAverage(restaurant) ? platformRatingValues(restaurant).length >= 2 : true;
};
const categoryMeta = (category) => CATEGORY_META[category] || CATEGORY_META["한식"] || Object.values(CATEGORY_META)[0];
const isLocalRestaurant = (restaurant) => restaurant?.id?.startsWith("local-");
const ratingLabel = (restaurant) =>
  restaurant.ratingLabel || (restaurant.ratingSource === "platformAverage" ? "평균별점" : "재리별점");

const starText = (rating) => {
  if (!hasJaeRating(rating)) return "?";
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? "1/2" : "";
  return `${"*".repeat(full)}${half}${"-".repeat(5 - full - (half ? 1 : 0))}`;
};

const starHtml = (rating) => {
  if (!hasJaeRating(rating)) {
    return `<span class="star-rating is-unknown" aria-label="rating pending">?</span>`;
  }

  const stars = Array.from({ length: 5 }, (_, index) => {
    const value = rating - index;
    const className = value >= 1 ? "is-full" : value >= 0.5 ? "is-half" : "is-empty";
    return `<span class="${className}" aria-hidden="true">&#9733;</span>`;
  }).join("");

  return `<span class="star-rating" aria-label="rating ${rating}">${stars}</span>`;
};

const saveFavorites = () => localStorage.setItem("jae-food-favorites", JSON.stringify([...state.favorites]));
const saveRecent = () => localStorage.setItem("jae-food-recent", JSON.stringify(state.recent));
const saveAddedRestaurants = () =>
  localStorage.setItem("jae-food-added-restaurants", JSON.stringify(state.addedRestaurants));
const saveEditedRestaurants = () =>
  localStorage.setItem("jae-food-edited-restaurants", JSON.stringify(state.editedRestaurants));

const comparableValue = (value) => JSON.stringify(value ?? null);
const editAppliedToSource = (source, edit) => {
  const fields = ["rating", "comment", "signatureMenu", "priceRange", "verificationStatus", "address"];
  return fields.every((field) => !(field in edit) || comparableValue(source[field]) === comparableValue(edit[field]));
};

const syncAppliedPendingUpdates = () => {
  const sourceById = new Map(RESTAURANTS.map((restaurant) => [restaurant.id, restaurant]));
  const sourceByName = new Map(RESTAURANTS.map((restaurant) => [restaurant.name, restaurant]));
  const previousAddedCount = state.addedRestaurants.length;
  const previousEditedCount = Object.keys(state.editedRestaurants).length;

  state.addedRestaurants = state.addedRestaurants.filter((restaurant) => {
    const source = sourceByName.get(restaurant.name);
    return !(source && source.address === restaurant.address && source.comment === restaurant.comment);
  });

  state.editedRestaurants = Object.fromEntries(
    Object.entries(state.editedRestaurants).filter(([id, restaurant]) => {
      const source = sourceById.get(id) || sourceByName.get(restaurant.name);
      return !(source && editAppliedToSource(source, restaurant));
    })
  );

  if (state.addedRestaurants.length !== previousAddedCount) saveAddedRestaurants();
  if (Object.keys(state.editedRestaurants).length !== previousEditedCount) saveEditedRestaurants();
};

const pendingUpdates = () => {
  const added = state.addedRestaurants.map((restaurant) => ({ type: "추가", restaurant }));
  const edited = Object.entries(state.editedRestaurants).map(([id, restaurant]) => ({
    type: "수정",
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
  button.setAttribute("aria-label", `${updates.length} pending updates`);
};

const showPendingUpdates = async () => {
  const updates = pendingUpdates();
  if (!updates.length) {
    window.alert("반영 대기 중인 업데이트가 없습니다.");
    return;
  }

  const payload = {
    added: state.addedRestaurants,
    edited: state.editedRestaurants,
  };
  const summary = updates.map((item, index) => `${index + 1}. ${item.type} ${item.restaurant.name}`).join("\n");

  try {
    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    window.alert(`반영 대기 업데이트\n\n${summary}\n\n업데이트 JSON을 클립보드에 복사했습니다.`);
  } catch {
    window.alert(`반영 대기 업데이트\n\n${summary}`);
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
    ? `<span class="verify-badge is-verified">검증후</span>`
    : `<span class="verify-badge">검증전</span>`;

const platformMini = (restaurant) =>
  Object.entries(restaurant.platformRatings || {})
    .map(([key, platform]) => {
      const shortLabel = { kakao: "K", naver: "N", google: "G" }[key] || platform.label;
      const rating = platformRating(platform);
      const value = rating ? rating.toFixed(1) : "-";
      const highClass = rating > 4.5 ? "is-high-rating" : "";
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
      const emphasizeRating = shouldEmphasizeRating(restaurant);
      const highRatingClass = emphasizeRating ? "is-top-rated" : "";
      return `
        <article class="restaurant-card ${ratingClass}" data-id="${restaurant.id}" style="--category-color: ${meta.color}">
          <div class="card-thumb-wrap">
            <img class="card-thumb ${highRatingClass}" src="${thumbnail}" alt="${restaurant.name} 대표 이미지" loading="lazy" onerror="this.src='${meta.image}'" />
            ${verificationBadge(restaurant)}
          </div>
          <button class="favorite-button ${favorite ? "is-active" : ""}" type="button" data-favorite="${restaurant.id}" aria-label="favorite">
            ${favorite ? "&#9733;" : "&#9734;"}
          </button>
          <div class="card-topline">
            <span class="rating-cluster">
              <span class="stars ${emphasizeRating ? "is-high-rating" : ""}">${starHtml(restaurant.rating)}</span>
              ${hasJaeRating(restaurant.rating) ? `<span class="rating-source">${restaurant.rating.toFixed(1)} (${ratingLabel(restaurant)})</span>` : ""}
            </span>
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
  const rating = platformRating(platform);
  return rating ? `평점 ${rating.toFixed(1)}` : "평점 없음";
};

const checkedText = (checkedAt) => (checkedAt ? `확인일 ${checkedAt}` : "확인 전");
const priceText = (price) => (typeof price === "number" ? `${price.toLocaleString("ko-KR")}원` : "가격 확인 중");

const platformRows = (restaurant) => {
  const links = {
    kakao: restaurant.kakaoMapLink,
    naver: restaurant.naverMapLink,
    google: restaurant.googleMapLink,
  };

  return Object.entries(restaurant.platformRatings)
    .map(([key, platform]) => `
      <a class="platform-link ${platformRating(platform) > 4.5 ? "is-high-rating" : ""}" href="${links[key]}" target="_blank" rel="noreferrer">
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
          <p class="eyebrow">${restaurant.area} · ${restaurant.category} · ${(restaurant.verificationStatus === "검증후" || restaurant.verifiedAt) ? "검증후" : "검증전"}</p>
          <h2 id="modalTitle">${restaurant.name}</h2>
        </div>
        <div class="modal-actions">
          <button class="text-button modal-edit" type="button" data-edit="${restaurant.id}">수정</button>
          <span class="modal-rating ${shouldEmphasizeRating(restaurant) ? "is-high-rating" : ""}">${ratingLabel(restaurant)} ${starHtml(restaurant.rating)} ${hasJaeRating(restaurant.rating) ? restaurant.rating.toFixed(1) : "검증전"}</span>
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
  $(".add-submit").textContent = restaurant ? "수정 내용 저장" : "검증전으로 추가";
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
  form.elements.kakaoRating.value = platformRating(restaurant.platformRatings?.kakao) ?? "";
  form.elements.naverRating.value = platformRating(restaurant.platformRatings?.naver) ?? "";
  form.elements.googleRating.value = platformRating(restaurant.platformRatings?.google) ?? "";
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

  $(".control-group[aria-label='카테고리 필터']").addEventListener("click", (event) => {
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
      window.alert("비밀번호가 달라서 수정할 수 없습니다.");
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
      window.alert("비밀번호가 달라서 추가할 수 없습니다.");
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
  if (/성수|성동구|서울숲|뚝섬|송정동/.test(text)) return "성수";
  if (/건대|광진구|화양|자양|능동로/.test(text)) return "건대";
  return "기타";
};

const inferCategory = (name, comment) => {
  const text = `${name} ${comment}`;
  if (/카페|커피|디저트|베이글|젤라또|소금빵|휘낭시에|콘파냐/.test(text)) return "디저트";
  if (/라멘|소바|우동|초밥|스시|텐동|돈카츠|야키토리|오코노미|일식/.test(text)) return "일식";
  if (/중식|마라|양꼬치|도삭|딤섬|짜장|짬뽕|탄탄|지로/.test(text)) return "중식";
  if (/쌀국수|태국|베트남|아시아|똠얌|분짜/.test(text)) return "아시아";
  if (/버거|햄버거|치킨버거|슬라이더/.test(text)) return "햄부기";
  if (/타코|멕시칸/.test(text)) return "멕시칸";
  if (/피자|파스타|스테이크|양식|샤퀴테리/.test(text)) return "양식";
  return "한식";
};

const numberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= 5 ? number : null;
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
      : previous.verificationNote || "수정된 로컬 데이터입니다.",
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
    message.textContent = "비밀번호가 달라서 저장할 수 없습니다.";
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
  message.textContent = editId ? `${name} 수정 내용이 저장되었습니다.` : `${name} 검증전 맛집으로 추가되었습니다.`;
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
  syncAppliedPendingUpdates();
  bindEvents();
  renderUpdateIndicator();
  renderCards();
  renderRecent();
  FoodMap.init(filteredRestaurants(), selectRestaurant, renderCards);
});


