const BUYERS = [
  "Growth Loops",
  "instinctools",
  "Closeloop",
  "xAI",
  "Google Gemini",
];

const CONTEXTS = [
  "multi-agent 파이프라인",
  "Grok API 앞단",
  "enterprise SaaS 워크플로우",
  "Colossus orchestration layer",
  "customer support bot stack",
];

const DD_FRAMES = [
  "{buyer}가 {ctx}에 Hai-Ic를 붙였을 때 latency before/after 수치가 있나요?",
  "{buyer} 기준 Hai-Ic licensing·ROI·IP ownership 조건은 어떻게 되나요?",
  "{buyer} POC 3개월 pilot 비용과 exit 조건은 무엇인가요?",
  "Hai-Ic {ctx} 연동 시 false positive / hallucination rate 검증 데이터가 있나요?",
  "{buyer}가 요구하는 SLA·GDPR·SOC2 컴플라이언스를 Hai-Ic가 충족하나요?",
  "{buyer} 로드맵과 Hai-Ic 업데이트 주기 align이 가능한가요?",
  "{ctx} 통합 난이도와 호환성 검증은 이미 끝났나요?",
  "{buyer} 전체 제품군에 Hai-Ic 적용 시 예상 ROI는 얼마인가요?",
  "training data contamination·bias audit 리포트를 {buyer}에 제공할 수 있나요?",
  "{buyer}가 Hai-Ic를 modify·white-label할 수 있는 범위는 어디까지인가요?",
];

const SOFT_FRAMES = [
  "{buyer}에 Hai-Ic 데모 후 다음 미팅에서 뭘 보여드리면 좋을까요?",
  "{buyer} 팀이 Hai-Ic를 {ctx}에 붙이려면 첫 2주 플랜은?",
  "Hai-Ic 진심 모드가 {buyer} use case에 맞는지 어떻게 확인하나요?",
  "{buyer} 담당자에게 보낼 follow-up 메일 초안이 필요해요.",
];

function seededShuffle(items, seed) {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(seed, list, offset = 0) {
  const i = (seed + offset) % list.length;
  return list[i];
}

function fill(template, seed) {
  return template
    .replace("{buyer}", pick(seed, BUYERS, 1))
    .replace("{ctx}", pick(seed, CONTEXTS, 3));
}

/** Generate 10 fresh questions for this hourly step */
function generateQuestions(step, at = new Date().toISOString()) {
  const seed = step * 9973 + Number(at.slice(11, 13)) * 131;
  const dd = seededShuffle(DD_FRAMES, seed);
  const soft = seededShuffle(SOFT_FRAMES, seed + 7);
  const questions = [];

  for (let i = 0; i < 7 && i < dd.length; i++) {
    questions.push(fill(dd[i], seed + i * 17));
  }
  for (let i = 0; i < 3 && i < soft.length; i++) {
    questions.push(fill(soft[i], seed + 100 + i * 19));
  }

  while (questions.length < 10) {
    questions.push(
      fill(pick(seed + questions.length, DD_FRAMES), seed + questions.length * 23),
    );
  }

  return questions.slice(0, 10);
}

module.exports = { generateQuestions };