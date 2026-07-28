import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const dataSource = await readFile(path.join(projectRoot, "data.js"), "utf8");
const context = { globalThis: {} };
vm.runInNewContext(dataSource, context);
const builds = context.globalThis.CyberpunkBuildData.builds;

const itemMap = {
  사타라: ["DB-2 Satara", "테크 샷건"],
  데저터: ["Dezerter", "신화 파워 샷건"],
  "투사체 발사기": ["Projectile Launch System", "팔 사이버웨어"],
  "신겐 프로토타입 V": ["Prototype: Shingen Mark V", "신화 스마트 SMG"],
  잉롱: ["Yinglong", "신화 스마트 SMG"],
  "시냅스 과열": ["Synapse Burnout", "전투 퀵핵"],
  "MA70 HB": ["MA70 HB", "파워 경기관총"],
  "NDI 오스프레이": ["Nokota Osprey", "신화 파워 저격소총"],
  "바 싱 총": ["Ba Xing Chong", "신화 스마트 샷건"],
  카이켄: ["Kaiken", "신화 투척 나이프"],
  토마호크: ["Tomahawk", "투척 도끼"],
  마체테: ["Machete", "블레이드"],
  헤드헌터: ["Headhunter", "신화 투척 나이프"],
  카타나: ["Katana", "블레이드"],
  뱍코: ["Byakko", "신화 카타나"],
  "전기 고릴라암": ["Gorilla Arms", "팔 사이버웨어"],
  "말로리안 암즈 3516": ["Malorian Arms 3516 (2077)", "신화 파워 피스톨"],
  라이쥬: ["Raiju", "신화 테크 SMG"],
  네코마타: ["Nekomata", "테크 저격소총"],
  라세츠: ["Tsunami Rasetsu", "신화 테크 저격소총"],
  "전기 투사체": ["Projectile Launch System", "팔 사이버웨어"],
  고릴라암: ["Gorilla Arms", "팔 사이버웨어"],
  "제어 퀵핵": ["Cyberware Malfunction", "퀵핵 묶음"],
  디펜더: ["Defender", "파워 경기관총"],
  펜리르: ["Fenrir", "신화 파워 SMG"],
  "프로블럼 솔버": ["Problem Solver", "신화 파워 SMG"],
  "맨티스 블레이드": ["Mantis Blades", "팔 사이버웨어"],
  "메모리 소거": ["Memory Wipe", "잠입 퀵핵"],
  "시스템 붕괴": ["System Collapse", "궁극 퀵핵"],
  "소음기 피스톨": ["Unity", "소음기용 파워 피스톨"],
  "파워 피스톨": ["Unity", "파워 피스톨"],
  리볼버: ["Overture", "파워 리볼버"],
  오버워치: ["Overwatch", "신화 파워 저격소총"],
  타마유라: ["Tamayura", "파워 피스톨"],
  렉싱턴: ["Militech M-10AF Lexington", "파워 피스톨"],
  퍼라이어: ["Pariah", "신화 테크 피스톨"],
  퀘이사: ["Darra Polytechnic DR-12 Quasar", "테크 리볼버"],
  아슈라: ["Ashura", "스마트 저격소총"],
  테스테라: ["DB-2 Testera", "파워 더블배럴 샷건"],
  "금 도금 방망이": ["Gold-plated baseball bat", "신화 둔기"],
  데드앤택스: ["Death and Taxes", "신화 파워 피스톨"],
  소베린: ["Sovereign", "신화 파워 샷건"],
  아가우: ["Agaou", "신화 투척 도끼"],
  "열 모노와이어": ["Monowire", "팔 사이버웨어"],
  "독 수류탄": ["MOLODETS BioHaz Grenade", "수류탄"],
  전염: ["Contagion", "전투 퀵핵"],
  해머: ["Hammer", "둔기"],
  "사스콰치 해머": ["Sasquatch's Hammer", "신화 둔기"],
  "시편 11:6": ["Psalm 11:6", "신화 파워 돌격소총"],
  에라타: ["Errata", "신화 카타나"],
  "컷오매틱 X-MOD2": ["Cut-o-Matic x-MOD2", "신화 체인소드"],
  "열 투사체": ["Projectile Launch System", "팔 사이버웨어"],
  오마하: ["Omaha", "테크 피스톨"],
  아킬레스: ["M-179 Achilles", "테크 정밀소총"],
  "공습 카타나": ["Katana", "공습 개조 블레이드"],
  "사이클론 카타나": ["Katana", "사이클론 개조 블레이드"],
  "사이버웨어 오작동": ["Cyberware Malfunction", "제어 퀵핵"],
  코퍼헤드: ["D5 Copperhead", "파워 돌격소총"],
  "움브라 X-MOD2": ["Umbra x-MOD2", "신화 파워 돌격소총"],
  마사무네: ["M251s Ajax", "파워 돌격소총"],
  팽: ["Fang", "신화 투척 나이프"],
  "대머리 독수리": ["Bald Eagle", "신화 파워 리볼버"],
  "와일드 도그": ["Wild Dog", "신화 파워 경기관총"],
  "존 팔루스티프 경": ["Sir John Phallustiff", "신화 둔기"],
  "BFC 9000": ["BFC 9000", "신화 둔기"],
  "옵티컬 카모": ["Optical Camo", "외피 사이버웨어"],
  메텔: ["Metel", "파워 리볼버"],
  알라바이: ["Alabai", "신화 파워 샷건"],
  수류탄: ["F-GX Frag Grenade", "수류탄"],
  단검: ["Knife", "투척 나이프"],
  "테크 피스톨": ["Omaha", "테크 피스톨"],
  스팅어: ["Stinger", "신화 투척 나이프"],
  "칸토 MK.6": ["Militech Canto Mk.6", "신화 사이버덱"],
  "블랙월 게이트웨이": ["Blackwall Gateway", "궁극 퀵핵"],
  SMG: ["TKI-20 Shingen", "기관단총"],
  나이프: ["Knife", "투척 나이프"],
  말로리안: ["Malorian Arms 3516 (2077)", "신화 파워 피스톨"],
  팔리카: ["DB-4 Palica", "스마트 더블배럴 샷건"],
  워든: ["Warden", "스마트 SMG"],
  피즈데츠: ["Pizdets", "신화 스마트 SMG"],
  "위도우 메이커": ["Widow Maker", "신화 테크 정밀소총"],
  "헤라클레스 3AX": ["Militech Hercules 3AX", "신화 스마트 돌격소총"],
  LMG: ["Defender", "파워 경기관총"],
  "도살자 클리버": ["Butcher's Cleaver", "신화 블레이드"],
  "컷오매틱 X-MOD": ["Cut-o-Matic x-MOD2", "신화 체인소드"],
  "오버추어 3자루": ["Overture", "파워 리볼버"],
  올릴라이어블: ["Ol' Reliable", "신화 파워 리볼버"],
  로스코: ["Rosco", "신화 파워 리볼버"],
  "사이코 마체테": ["Machete", "블레이드"],
  "썰어버려 카타나": ["Katana", "블레이드"],
  "테스테라 2~3자루": ["DB-2 Testera", "파워 더블배럴 샷건"],
  셔플러: ["Shuffler", "원거리 무기 개조부품"],
};

const descriptions = {
  퀵핵: "적의 시스템에 업로드해 상태 이상·잠입·직접 피해를 만드는 프로그램입니다.",
  사이버웨어: "신체 슬롯에 장착해 빌드의 액티브 능력이나 고유 전투 효과를 여는 장비입니다.",
  수류탄: "재충전식 투척 장비로 광역 피해와 상태 이상을 담당합니다.",
  개조부품: "무기 슬롯에 장착해 탄도나 운용 방식을 바꾸는 부품입니다.",
  블레이드: "반사신경 특전과 연동되는 근접 무기입니다. 도약·탄환 반사·마무리 공격에 사용합니다.",
  둔기: "신체 특전과 연동되는 근접 무기입니다. 넘어뜨리기·퀘이크·투척 연계에 사용합니다.",
  나이프: "냉정 특전과 연동되는 투척 무기입니다. 헤드샷과 회수 루프에 사용합니다.",
  스마트: "스마트 링크로 적을 자동 추적하는 무기입니다. 넷러너의 스마트 시너지와 잘 맞습니다.",
  테크: "충전 사격으로 엄폐를 관통하는 무기입니다. 테크 특전의 볼트와 연동됩니다.",
  샷건: "근거리에서 큰 순간 피해와 경직을 주는 무기입니다.",
  리볼버: "낮은 연사력 대신 강한 단발·헤드샷 피해에 집중하는 보조무기입니다.",
  피스톨: "집중·데드아이·퀵드로우와 연동되는 기동형 보조무기입니다.",
  저격소총: "장거리 약점·헤드샷을 노리는 고화력 무기입니다.",
  정밀소총: "중장거리 정밀 사격과 약점 공략에 쓰는 소총입니다.",
  돌격소총: "중거리 연사와 이동 사격을 담당하는 범용 소총입니다.",
  경기관총: "큰 탄창과 지속 사격으로 전면전을 밀어붙이는 중화기입니다.",
  SMG: "높은 연사력과 빠른 재장전으로 근중거리 적을 압박하는 기관단총입니다.",
};

function describe(type) {
  const key = Object.keys(descriptions).find((candidate) =>
    type.includes(candidate),
  );
  return descriptions[key] ?? "이 공략의 핵심 공격 수단으로 지정된 장비입니다.";
}

function decodeHtml(value) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\[[^\]]*edit[^\]]*\]/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function localizeAcquisition(value) {
  return value
    .replace(/^Acquisition\s*\[\s*\]\s*/i, "")
    .replace(/\bCan be acquired from\b/gi, "획득:")
    .replace(/\bAcquired from\b/gi, "획득:")
    .replace(/\bCan be purchased from\b/gi, "구매:")
    .replace(/\bCan be looted from\b/gi, "전리품:")
    .replace(/\bCan be obtained from\b/gi, "획득:")
    .replace(/\bCan be found\b/gi, "발견:")
    .replace(/\bCan be crafted after\b/gi, "제작 조건:")
    .replace(/\bReward for completing\b/gi, "완료 보상:")
    .replace(/\bObtained during\b/gi, "획득 임무:")
    .replace(/\bDropped by\b/gi, "드롭:")
    .replace(/\bFound (?:in|at|on)\b/gi, "발견 위치:")
    .replace(/\bthe following enemies\b/gi, "다음 적에게서 드롭")
    .replace(/\bany Weapon Vendor\b/gi, "모든 무기 상인")
    .replace(/\bat level (\d+) or higher\b/gi, "레벨 $1 이상")
    .replace(/\bafter completing\b/gi, "완료 후")
    .replace(/\bduring\b/gi, "진행 중");
}

async function api(params) {
  const url = new URL("https://cyberpunk.fandom.com/api.php");
  url.search = new URLSearchParams({
    format: "json",
    origin: "*",
    ...params,
  });
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "CyberpunkBuildGuide/1.0 (static research page; contact via source repository)",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function fetchItem(title) {
  const meta = await api({
    action: "query",
    redirects: "1",
    prop: "pageimages",
    piprop: "thumbnail|original",
    pithumbsize: "640",
    titles: title,
  });
  const page = Object.values(meta.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined) {
    return {
      resolvedTitle: title,
      thumbnail: "",
      acquisition: "",
      missing: true,
    };
  }

  let acquisition = "";
  try {
    const sectionData = await api({
      action: "parse",
      page: page.title,
      prop: "sections",
    });
    const section = sectionData.parse?.sections?.find((item) =>
      /acquisition|location|obtaining/i.test(item.line),
    );
    if (section) {
      const sectionData = await api({
        action: "parse",
        page: page.title,
        section: section.index,
        prop: "text",
      });
      const plain = decodeHtml(sectionData.parse?.text?.["*"] ?? "");
      acquisition = localizeAcquisition(plain).slice(0, 520);
    }
  } catch {
    acquisition = "";
  }

  return {
    resolvedTitle: page.title,
    thumbnail: page.thumbnail?.source ?? page.original?.source ?? "",
    acquisition,
    missing: false,
  };
}

async function mapLimit(values, limit, task) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await task(values[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return output;
}

const names = [...new Set(builds.flatMap((build) => build.weapons))];
const missingMappings = names.filter((name) => !itemMap[name]);
if (missingMappings.length) {
  throw new Error(`Missing item mappings: ${missingMappings.join(", ")}`);
}

const titles = [...new Set(names.map((name) => itemMap[name][0]))];
const fetched = await mapLimit(titles, 6, async (title) => {
  try {
    return [title, await fetchItem(title)];
  } catch (error) {
    return [
      title,
      {
        resolvedTitle: title,
        thumbnail: "",
        acquisition: "",
        missing: true,
        error: String(error),
      },
    ];
  }
});
const fetchedByTitle = Object.fromEntries(fetched);

const catalog = {};
for (const name of names) {
  const [wikiTitle, type] = itemMap[name];
  const item = fetchedByTitle[wikiTitle];
  const articleTitle = item.resolvedTitle || wikiTitle;
  const isGeneric = /^(SMG|LMG|수류탄|단검|나이프|리볼버|파워 피스톨|소음기 피스톨|테크 피스톨|제어 퀵핵)$/.test(
    name,
  );
  catalog[name] = {
    name,
    type,
    description: describe(type),
    thumbnail: item.thumbnail,
    acquisition:
      item.acquisition ||
      (isGeneric
        ? "일반 장비는 무기 상인·리퍼닥·적 드롭에서 구할 수 있습니다. 등급과 개조 슬롯은 캐릭터 레벨과 상점 재고에 따라 달라집니다."
        : "고유 획득 조건은 연결된 장비 위키의 Acquisition 항목에서 확인하세요."),
    source: `https://cyberpunk.fandom.com/wiki/${encodeURIComponent(
      articleTitle.replaceAll(" ", "_"),
    )}`,
    sourceTitle: articleTitle,
    missing: item.missing,
  };
}

const output = `(() => {\n  globalThis.CyberpunkGearCatalog = ${JSON.stringify(
  catalog,
  null,
  2,
)};\n})();\n`;
await writeFile(path.join(projectRoot, "gear-data.js"), output, "utf8");

const missingPages = titles
  .filter((title) => fetchedByTitle[title].missing)
  .map((title) => ({
    title,
    error: fetchedByTitle[title].error ?? "",
  }));
process.stdout.write(
  `${JSON.stringify(
    {
      items: names.length,
      uniquePages: titles.length,
      missingPages,
    },
    null,
    2,
  )}\n`,
);
