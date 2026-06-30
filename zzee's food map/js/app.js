const state = {
  category: "전체",
  rating: 0,
  sort: "recommended",
  query: "",
  favorites: new Set(JSON.parse(localStorage.getItem("jae-food-favorites") || "[]")),
  recent: JSON.parse(localStorage.getItem("jae-food-recent") || "[]"),
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const starText = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? "½" : "";
  return `${"★".repeat(full)}${half}${"☆".repeat(5 - full - (half ? 1 : 0))}`;
};

const starHtml = (rating) => {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const value = rating - index;
    const className = value >= 1 ? "is-full" : value >= 0.5 ? "is-half" : "is-empty";
    return `<span class="${className}" aria-hidden="true">★</span>`;
  }).join("");

  return `<span class="star-rating" aria-label="재리 별점 ${rating}점">${stars}</span>`;
};

const saveFavorites = () => localStorage.setItem("jae-food-favorites", JSON.stringify([...state.favorites]));
const saveRecent = () => localStorage.setItem("jae-food-recent", JSON.stringify(state.recent));

const filteredRestaurants = () => {
  const normalizedQuery = state.query.trim().toLowerCase();
  return RESTAURANTS.filter((restaurant) => {
    const categoryMatch = state.category === "전체" || restaurant.category === state.category;
    const ratingMatch = restaurant.rating >= state.rating;
    const queryTarget = [
      restaurant.name,
      restaurant.category,
      restaurant.comment,
      restaurant.signatureMenu,
      restaurant.jaeComment,
      restaurant.address,
    ]
      .join(" ")
      .toLowerCase();
    return categoryMatch && ratingMatch && queryTarget.includes(normalizedQuery);
  }).sort((a, b) => {
    if (state.sort === "rating") return b.rating - a.rating || a.recommendedOrder - b.recommendedOrder;
    if (state.sort === "name") return a.name.localeCompare(b.name, "ko");
    return a.recommendedOrder - b.recommendedOrder;
  });
};

const renderCards = () => {
  const restaurants = filteredRestaurants();
  const list = $("#restaurantList");
  $("#resultSummary").textContent = `${restaurants.length}곳의 맛집`;

  list.innerHTML = restaurants
    .map((restaurant) => {
      const meta = CATEGORY_META[restaurant.category];
      const favorite = state.favorites.has(restaurant.id);
      return `
        <article class="restaurant-card rating-${Math.floor(restaurant.rating)}" data-id="${restaurant.id}" style="--category-color: ${meta.color}">
          <button class="favorite-button ${favorite ? "is-active" : ""}" type="button" data-favorite="${restaurant.id}" aria-label="즐겨찾기">
            ${favorite ? "♥" : "♡"}
          </button>
          <div class="card-topline">
            <span class="stars">${starHtml(restaurant.rating)}</span>
            <span class="category-pill">${restaurant.category}</span>
          </div>
          <h2>${restaurant.name}</h2>
          <p>${restaurant.comment}</p>
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
    .map((id) => RESTAURANTS.find((restaurant) => restaurant.id === id))
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
      <a class="platform-link" href="${links[key]}" target="_blank" rel="noreferrer">
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
    <img class="modal-image" src="${restaurant.images[0]}" alt="${restaurant.category} 대표 이미지" />
    <div class="modal-body">
      <div class="modal-title-row">
        <div>
          <p class="eyebrow">${restaurant.category}</p>
          <h2 id="modalTitle">${restaurant.name}</h2>
        </div>
        <span class="modal-rating">재리 ${starHtml(restaurant.rating)} ${restaurant.rating.toFixed(1)}</span>
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

const selectRestaurant = (id, options = { openModal: true }) => {
  const restaurant = RESTAURANTS.find((item) => item.id === id);
  if (!restaurant) return;
  FoodMap.focus(restaurant);
  rememberRecent(id);
  if (options.openModal) openModal(restaurant);
};

const bindEvents = () => {
  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
  });

  $("[aria-label='카테고리 필터']").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter='category']");
    if (!button) return;
    state.category = button.dataset.value;
    $$(".chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderCards();
  });

  $("#ratingFilter").addEventListener("change", (event) => {
    state.rating = Number(event.target.value);
    renderCards();
  });

  $("#sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCards();
  });

  $("#restaurantList").addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      saveFavorites();
      renderCards();
      return;
    }

    const card = event.target.closest("[data-id]");
    if (card) selectRestaurant(card.dataset.id);
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
  $("#themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("jae-food-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });

  $$("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
};

const initTheme = () => {
  if (localStorage.getItem("jae-food-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindEvents();
  renderCards();
  renderRecent();
  FoodMap.init(RESTAURANTS, selectRestaurant, renderCards);
});
