(() => {
  const mobileUserAgentPattern =
    /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i;

  const escapeAttribute = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const validCoordinate = (value) =>
    Number.isFinite(Number(value)) ? Number(value) : null;

  const kakaoPlaceId = (url = "") =>
    String(url).match(
      /(?:place\.map\.kakao\.com\/|map\.kakao\.com\/link\/(?:map|to)\/)(\d+)/,
    )?.[1] || null;

  const kakaoMobileUrl = (restaurant) => {
    const placeId = kakaoPlaceId(restaurant.kakaoMapLink);
    if (placeId) {
      return `https://m.map.kakao.com/scheme/place?id=${placeId}`;
    }

    const params = new URLSearchParams({ q: restaurant.name || "" });
    const latitude = validCoordinate(restaurant.latitude);
    const longitude = validCoordinate(restaurant.longitude);
    if (latitude !== null && longitude !== null) {
      params.set("p", `${latitude},${longitude}`);
    }
    return `https://m.map.kakao.com/scheme/search?${params}`;
  };

  const naverAppUrl = (restaurant) => {
    const latitude = validCoordinate(restaurant.latitude);
    const longitude = validCoordinate(restaurant.longitude);
    const appname = `${window.location.origin}${window.location.pathname}`;

    if (latitude !== null && longitude !== null) {
      const params = new URLSearchParams({
        lat: latitude,
        lng: longitude,
        name: restaurant.name || restaurant.address || "",
        appname,
      });
      return `nmap://place?${params}`;
    }

    const params = new URLSearchParams({
      query: restaurant.name || restaurant.address || "",
      appname,
    });
    return `nmap://search?${params}`;
  };

  const naverAndroidIntentUrl = (appUrl, webUrl) => {
    const action = appUrl.replace(/^nmap:\/\//, "");
    return (
      `intent://${action}` +
      "#Intent;scheme=nmap;action=android.intent.action.VIEW;" +
      "category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;" +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
    );
  };

  const anchorAttributes = (platform, restaurant) => {
    const webUrl = restaurant[`${platform}MapLink`] || "";
    const label = { kakao: "카카오맵", naver: "네이버지도", google: "구글지도" }[
      platform
    ];
    const appData =
      platform === "kakao" || platform === "naver"
        ? [
            `data-map-app="${platform}"`,
            `data-map-name="${escapeAttribute(restaurant.name)}"`,
            `data-map-latitude="${escapeAttribute(restaurant.latitude ?? "")}"`,
            `data-map-longitude="${escapeAttribute(restaurant.longitude ?? "")}"`,
            `title="${label} 앱에서 열기"`,
          ].join(" ")
        : `title="${label}에서 열기"`;

    return [
      `href="${escapeAttribute(webUrl)}"`,
      'target="_blank"',
      'rel="noopener noreferrer"',
      appData,
    ].join(" ");
  };

  const openSchemeWithFallback = (appUrl, webUrl) => {
    let pageHidden = false;
    const markHidden = () => {
      if (document.visibilityState === "hidden") pageHidden = true;
    };
    document.addEventListener("visibilitychange", markHidden, { once: true });
    window.addEventListener("pagehide", () => {
      pageHidden = true;
    }, { once: true });

    window.location.href = appUrl;
    window.setTimeout(() => {
      if (!pageHidden && document.visibilityState === "visible") {
        window.location.href = webUrl;
      }
    }, 1500);
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[data-map-app]");
    if (!anchor || !mobileUserAgentPattern.test(navigator.userAgent)) return;

    event.preventDefault();
    const restaurant = {
      name: anchor.dataset.mapName || "",
      latitude: anchor.dataset.mapLatitude,
      longitude: anchor.dataset.mapLongitude,
      kakaoMapLink: anchor.href,
      naverMapLink: anchor.href,
    };

    if (anchor.dataset.mapApp === "kakao") {
      window.location.href = kakaoMobileUrl(restaurant);
      return;
    }

    const appUrl = naverAppUrl(restaurant);
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = naverAndroidIntentUrl(appUrl, anchor.href);
      return;
    }
    openSchemeWithFallback(appUrl, anchor.href);
  });

  window.MapAppLinks = Object.freeze({ anchorAttributes });
})();
