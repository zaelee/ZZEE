(() => {
const { builds, difficultyMeta } = globalThis.CyberpunkBuildData;

const TIER_COLORS = {
  A: "#f4ed16",
  B: "#82ef58",
  C: "#27f4da",
  D: "#4ba7ff",
  E: "#b18bff",
  F: "#ff5472",
};

const params = new URLSearchParams(window.location.search);
const buildId = params.get("id");
const index = builds.findIndex((item) => item.id === buildId);
const build = builds[index];
const detail = document.querySelector("#build-detail");
const notFound = document.querySelector("#not-found");

function fillList(selector, items) {
  const list = document.querySelector(selector);
  list.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }),
  );
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function navLabel(target, direction) {
  return `<span>${direction}</span><br><strong>${target.name}</strong>`;
}

function renderFinalMedia(selector, images, buildName, type) {
  const container = document.querySelector(selector);
  if (!images.length) {
    const empty = document.createElement("p");
    empty.className = "final-media-empty";
    empty.textContent =
      type === "특성"
        ? "원문에 ‘최종 특성·스킬트리’로 표시된 이미지가 없어 텍스트 공략만 제공합니다."
        : "원문에 ‘사이버웨어 세팅’으로 표시된 최종 화면이 없어 슬롯별 텍스트 공략만 제공합니다.";
    container.replaceChildren(empty);
    return;
  }

  const heading = document.createElement("div");
  heading.className = "final-media-heading";
  heading.innerHTML = `
    <span>ORIGINAL FINAL SETUP</span>
    <strong></strong>
  `;
  heading.querySelector("strong").textContent = `원문 최종 ${type} 화면`;

  const mediaGrid = document.createElement("div");
  mediaGrid.className = "final-media-grid";
  mediaGrid.replaceChildren(
    ...images.map((sourceImage, index) => {
      const link = document.createElement("a");
      const image = document.createElement("img");
      const caption = document.createElement("span");
      link.className = "final-setup-image";
      link.href = sourceImage.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      image.src = sourceImage.url;
      image.alt = `${buildName} 원문 최종 ${type} 이미지 ${index + 1}`;
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        link.classList.add("image-load-error");
        caption.textContent = "이미지를 불러오지 못했습니다 · 원문 열기";
      });
      caption.textContent = sourceImage.caption;
      link.append(image, caption);
      return link;
    }),
  );
  container.replaceChildren(heading, mediaGrid);
}

function renderGearCards(items, buildName) {
  const container = document.querySelector("#gear-cards");
  container.replaceChildren(
    ...items.map((gear, index) => {
      const card = document.createElement("article");
      card.className = "gear-item";
      card.innerHTML = `
        <div class="gear-thumbnail">
          <img alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          <span>NO IMAGE</span>
        </div>
        <div class="gear-copy">
          <div class="gear-heading">
            <div>
              <span class="gear-role"></span>
              <h3></h3>
            </div>
            <span class="gear-type"></span>
          </div>
          <p class="gear-description"></p>
          <dl class="gear-acquisition">
            <dt>획득처</dt>
            <dd></dd>
          </dl>
          <a class="gear-source" target="_blank" rel="noreferrer">장비 설명·획득 원문 ↗</a>
        </div>
      `;
      const image = card.querySelector("img");
      const fallback = card.querySelector(".gear-thumbnail span");
      image.alt = `${buildName} ${gear.name} 장비 섬네일`;
      if (gear.thumbnail) {
        image.src = gear.thumbnail;
        fallback.hidden = true;
        image.addEventListener("error", () => {
          image.hidden = true;
          fallback.hidden = false;
        });
      } else {
        image.hidden = true;
      }
      card.querySelector(".gear-role").textContent = `0${index + 1} · ${gear.role}`;
      card.querySelector("h3").textContent = gear.name;
      card.querySelector(".gear-type").textContent = gear.type;
      card.querySelector(".gear-description").textContent = gear.description;
      card.querySelector(".gear-acquisition dd").textContent = gear.acquisition;
      const source = card.querySelector(".gear-source");
      source.href = gear.source;
      source.title = `${gear.sourceTitle} 문서 열기`;
      return card;
    }),
  );
}

if (!build) {
  notFound.hidden = false;
} else {
  const difficulty = difficultyMeta[build.difficulty];
  const color = TIER_COLORS[build.tier];
  document.documentElement.style.setProperty("--tier-color", color);
  document.title = `${build.name} 공략 · 사이버펑크 2077 빌드 티어 연구소`;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", `${build.name}: ${build.verdict}`);

  setText("#detail-eyebrow", `${build.os} / ${build.version} / ${build.published}`);
  setText("#detail-title", build.name);
  setText("#detail-verdict", build.verdict);
  setText("#detail-tier", build.tier);
  setText("#detail-difficulty", `${difficulty.label} · ${build.difficulty}/4`);
  setText("#detail-setup", `${"■".repeat(build.setup)}${"□".repeat(5 - build.setup)} · ${build.setup}/5`);
  setText("#detail-version", build.version);
  setText("#detail-os", build.os);
  setText("#detail-weapons", build.weapons.join(" · "));
  setText("#detail-core", build.core);
  setText("#detail-reason", build.reason);
  setText("#detail-progression", build.progression);

  fillList("#detail-loop", build.loop);
  fillList("#detail-strengths", build.strengths);
  fillList("#detail-weaknesses", build.weaknesses);
  renderFinalMedia(
    "#final-attribute-media",
    build.finalAttributeImages,
    build.name,
    "특성",
  );
  renderFinalMedia(
    "#final-cyberware-media",
    build.finalCyberwareImages,
    build.name,
    "사이버웨어",
  );
  renderGearCards(build.gear, build.name);

  const tags = document.querySelector("#detail-tags");
  tags.replaceChildren(
    ...build.tags.map((tag) => {
      const span = document.createElement("span");
      span.textContent = `# ${tag}`;
      return span;
    }),
  );

  const source = document.querySelector("#detail-source");
  const sourceNote = document.querySelector("#detail-source-note");
  source.href = build.source;
  if (build.sourceAccessible === false) {
    source.textContent = "원문 삭제 · 현재 접근 불가";
    source.setAttribute("aria-disabled", "true");
    sourceNote.textContent =
      "모음 글의 링크와 제목은 확인했지만 연결된 본문은 PC·모바일 주소 모두 비어 있거나 404로 응답했습니다.";
  } else {
    sourceNote.textContent =
      "이 페이지에는 원문에서 ‘최종’ 세팅으로 표시된 특성·사이버웨어 화면만 크게 실었습니다. 장비 썸네일과 획득 정보는 각 장비 카드의 위키 원문에서 교차 확인할 수 있습니다.";
  }

  const previous = builds[(index - 1 + builds.length) % builds.length];
  const next = builds[(index + 1) % builds.length];
  const previousLink = document.querySelector("#prev-build");
  const nextLink = document.querySelector("#next-build");
  previousLink.href = `./build.html?id=${encodeURIComponent(previous.id)}`;
  previousLink.innerHTML = navLabel(previous, "← 이전 빌드");
  nextLink.href = `./build.html?id=${encodeURIComponent(next.id)}`;
  nextLink.innerHTML = navLabel(next, "다음 빌드 →");

  detail.hidden = false;
}

document.querySelector("#print-button").addEventListener("click", () => window.print());
})();
