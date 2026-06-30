const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  return response.text();
};

const extractBalanced = (text, startIndex, openChar = "[", closeChar = "]") => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;
    if (depth === 0) return text.slice(startIndex, index + 1);
  }
  return null;
};

const extractItems = (html) => {
  const marker = '"items":';
  let markerIndex = html.indexOf(marker);
  while (markerIndex !== -1) {
    const startIndex = html.indexOf("[", markerIndex);
    const json = startIndex === -1 ? null : extractBalanced(html, startIndex);
    const items = json ? JSON.parse(json) : [];
    if (items.some((item) => item?.name && (item?.roadAddress || item?.address))) return items;
    markerIndex = html.indexOf(marker, markerIndex + marker.length);
  }
  return [];
};

const query = "해남닭집 건대";
const url = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(query)}&sm=hty&style=v5`;
const html = await fetchText(url);
const [item] = extractItems(html);

console.log(JSON.stringify(item, null, 2));
