const queries = [
  "슈퍼슬라이더",
  "슈퍼슬라이더 건대",
  "슈퍼슬라이더스",
  "슈퍼슬라이더스 건대",
  "슈퍼 슬라이더",
  "슈퍼 슬라이더 건대",
  "슬라이더스 건대",
  "슬라이더 버거 건대",
  "슬라이더버거 건대",
  "미니버거 건대",
  "작은 버거 건대",
  "Super Slider Seoul",
  "Super Sliders Seoul",
  "Super Slider Konkuk",
];

const extractFirst = (html) => {
  const matches = [
    ...html.matchAll(
      /"name":"([^"]+)".{0,500}?"address":"([^"]*)".{0,500}?"roadAddress":"([^"]*)".{0,500}?"latitude":([0-9.]+),"longitude":([0-9.]+)/g,
    ),
  ];
  return matches[0] || null;
};

for (const query of queries) {
  const url = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(query)}&sm=hty&style=v5`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const html = await response.text();
  const match = extractFirst(html);

  if (!match) {
    console.log(`NO\t${query}`);
  } else {
    console.log(`OK\t${query}\t${match[1]}\t${match[3] || match[2]}\t${match[4]}\t${match[5]}`);
  }
}
