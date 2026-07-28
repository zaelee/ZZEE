(() => {
const { builds, difficultyMeta, tierMeta } = globalThis.CyberpunkBuildData;

const TIER_COLORS = {
  A: "#f4ed16",
  B: "#82ef58",
  C: "#27f4da",
  D: "#4ba7ff",
  E: "#b18bff",
  F: "#ff5472",
};

const grid = document.querySelector("#tier-grid");
const template = document.querySelector("#build-card-template");
const searchInput = document.querySelector("#search-input");
const osFilter = document.querySelector("#os-filter");
const tierFilter = document.querySelector("#tier-filter");
const resetButton = document.querySelector("#reset-filters");
const resultCount = document.querySelector("#result-count");
const buildTotal = document.querySelector("#build-total");
const emptyState = document.querySelector("#empty-state");

const normalize = (value) => value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");

function makeHeaders() {
  const corner = document.createElement("div");
  corner.className = "difficulty-corner";
  corner.textContent = "조작 난이도 →";
  grid.append(corner);

  Object.entries(difficultyMeta).forEach(([difficulty, meta]) => {
    const header = document.createElement("div");
    header.className = "difficulty-header";
    header.dataset.difficulty = difficulty;
    header.innerHTML = `<strong>${meta.label}</strong><span>${meta.note}</span>`;
    grid.append(header);
  });
}

function makeCard(build, index) {
  const card = template.content.firstElementChild.cloneNode(true);
  card.href = `./build.html?id=${encodeURIComponent(build.id)}`;
  card.dataset.tier = build.tier;
  card.style.setProperty("--tier-color", TIER_COLORS[build.tier]);
  card.querySelector(".card-os").textContent = build.os;
  card.querySelector(".card-index").textContent = `#${String(index + 1).padStart(2, "0")}`;
  card.querySelector("h3").textContent = build.name;
  card.querySelector(".card-weapons").textContent = build.weapons.join(" · ");
  card.querySelector(".card-summary").textContent = build.summary;
  card.querySelector(".card-version").textContent = build.version;
  card.setAttribute(
    "aria-label",
    `${build.name}, ${build.tier} 티어, 조작 난이도 ${difficultyMeta[build.difficulty].label}. 새 창에서 공략 열기`,
  );
  return card;
}

function searchableText(build) {
  return normalize([
    build.name,
    build.os,
    build.weapons.join(" "),
    build.tags.join(" "),
    build.summary,
    build.verdict,
  ].join(" "));
}

function filteredBuilds() {
  const query = normalize(searchInput.value.trim());
  return builds.filter((build) => {
    const matchesSearch = !query || searchableText(build).includes(query);
    const matchesOs = osFilter.value === "all" || build.os === osFilter.value;
    const matchesTier = tierFilter.value === "all" || build.tier === tierFilter.value;
    return matchesSearch && matchesOs && matchesTier;
  });
}

function render() {
  const visible = filteredBuilds();
  const visibleIds = new Set(visible.map((build) => build.id));
  grid.replaceChildren();
  makeHeaders();

  Object.entries(tierMeta).forEach(([tier, meta]) => {
    const label = document.createElement("div");
    label.className = "tier-label";
    label.style.setProperty("--tier-color", TIER_COLORS[tier]);
    label.innerHTML = `<strong>${tier}</strong><span>${meta.label}</span>`;
    label.title = meta.description;
    grid.append(label);

    Object.keys(difficultyMeta).forEach((difficulty) => {
      const cell = document.createElement("div");
      cell.className = "tier-cell";
      cell.style.setProperty("--tier-color", TIER_COLORS[tier]);
      cell.dataset.tier = tier;
      cell.dataset.difficulty = difficulty;

      builds.forEach((build, index) => {
        if (
          build.tier === tier
          && String(build.difficulty) === difficulty
          && visibleIds.has(build.id)
        ) {
          cell.append(makeCard(build, index));
        }
      });
      grid.append(cell);
    });
  });

  resultCount.textContent = String(visible.length);
  emptyState.hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
}

function populateOsFilter() {
  const operatingSystems = [...new Set(builds.map((build) => build.os))].sort((a, b) =>
    a.localeCompare(b, "ko-KR"),
  );
  operatingSystems.forEach((os) => {
    const option = document.createElement("option");
    option.value = os;
    option.textContent = os;
    osFilter.append(option);
  });
}

function resetFilters() {
  searchInput.value = "";
  osFilter.value = "all";
  tierFilter.value = "all";
  render();
  searchInput.focus();
}

populateOsFilter();
buildTotal.textContent = String(builds.length);
render();

searchInput.addEventListener("input", render);
osFilter.addEventListener("change", render);
tierFilter.addEventListener("change", render);
resetButton.addEventListener("click", resetFilters);
})();
