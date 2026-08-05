import type { AppLocale } from "./ui-locale";
import { getDemoCopy, type DemoCopy } from "./demo-copy";

export type CommonCopy = {
  createdBy: string;
  orderCta: string;
  nav: {
    origin: string;
    workflow: string;
    verify: string;
    order: string;
    demo: string;
    contact: string;
  };
};

export type OriginCopy = {
  tagline: string;
  intro1: string;
  intro2a: string;
  intro2b: string;
  compassEyebrow: string;
  compassHeadline: string;
  compassBody: string;
  lenses: Array<{ title: string; note: string }>;
  principleEyebrow: string;
  principles: string[];
  behaviorEyebrow: string;
  behaviors: Array<{ condition: string; response: string }>;
  quote: string;
  flowEyebrow: string;
  flowSteps: string[];
  footerLegal: string;
};

export type VerifyCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  fieldLabel: string;
  placeholder: string;
  submit: string;
  submitting: string;
  errEmpty: string;
  errApi: string;
  errFailed: string;
  resultTitle: string;
  copyReport: string;
  copied: string;
  trustIndex: string;
  trustHint: string;
  hallucinationRisk: string;
  scanNote: string;
  disclaimer: string;
  riskFlags: string;
  riskFlagsHint: string;
  noFlags: string;
  summary: string;
  nextStep: string;
  orderPrompt: string;
  orderLink: string;
  shareTitle: string;
  shareHint: string;
  copyShare: string;
  backLanding: string;
};

export type LandingCopy = {
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroDemo: string;
  heroOrder: string;
  heroWorkflow: string;
  heroTagline: string;
  footerHumanVerified: string;
  footerDesc: string;
  footerCopyright: string;
  session: string;
  trustTitle: string;
  trustItems: Array<{ label: string; detail: string }>;
  workflowEyebrow: string;
  workflowTitle: string;
  workflowDesc: string;
  workflowSteps: Array<{ step: string; title: string; description: string }>;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaDemo: string;
  ctaPoweredBy: string;
  ctaEnterprise: string;
};

export type UiCopy = {
  common: CommonCopy;
  origin: OriginCopy;
  verify: VerifyCopy;
  landing: LandingCopy;
  demo: DemoCopy;
};

const COMMON: Record<AppLocale, CommonCopy> = {
  en: {
    createdBy: "Created by KARAM",
    orderCta: "Start $300 Evaluation",
    nav: {
      origin: "Origin",
      workflow: "Workflow",
      verify: "Verify",
      order: "XGOMA Order",
      demo: "Demo",
      contact: "Contact",
    },
  },
  ko: {
    createdBy: "Created by KARAM",
    orderCta: "Start $300 Evaluation",
    nav: {
      origin: "기원",
      workflow: "워크플로",
      verify: "검증",
      order: "XGOMA 주문",
      demo: "데모",
      contact: "문의",
    },
  },
  ja: {
    createdBy: "Created by KARAM",
    orderCta: "Start $300 Evaluation",
    nav: {
      origin: "起源",
      workflow: "ワークフロー",
      verify: "検証",
      order: "XGOMA注文",
      demo: "デモ",
      contact: "お問い合わせ",
    },
  },
  es: {
    createdBy: "Created by KARAM",
    orderCta: "Start $300 Evaluation",
    nav: {
      origin: "Origen",
      workflow: "Flujo",
      verify: "Verificar",
      order: "Pedido XGOMA",
      demo: "Demo",
      contact: "Contacto",
    },
  },
  fr: {
    createdBy: "Created by KARAM",
    orderCta: "Start $300 Evaluation",
    nav: {
      origin: "Origine",
      workflow: "Flux",
      verify: "Vérifier",
      order: "Commande XGOMA",
      demo: "Démo",
      contact: "Contact",
    },
  },
};

const ORIGIN: Record<AppLocale, OriginCopy> = {
  en: {
    tagline: "Human-Heart + AI-Law = Verification",
    intro1: "It was born from real human–AI interaction risk.",
    intro2a: "The goal is not to replace human judgment.",
    intro2b: "The goal is to protect it.",
    compassEyebrow: "KARAM compass",
    compassHeadline: "Not money only",
    compassBody:
      "KARAM treats direction, family, product, IP, execution, and trust as one whole — not isolated metrics on a checkout screen.",
    lenses: [
      { title: "Direction", note: "Where KARAM is going — not a single revenue line." },
      { title: "Family", note: "People first — inside the team and in every high-stakes decision." },
      { title: "Product", note: "What ships, how it behaves, and how it protects human judgment." },
      { title: "IP", note: "Founder-originated concepts, workflows, and verification structure." },
      { title: "Execution", note: "Human → AI → HAI → Human → XGOMA — shipped, not slideware." },
      { title: "Trust", note: "Trust Index, relationships, and defensible outcomes — not hype." },
    ],
    principleEyebrow: "Principle",
    principles: ["AI answers.", "HAI verifies.", "Human approves.", "XGOMA executes."],
    behaviorEyebrow: "Product behavior",
    behaviors: [
      { condition: "Clearly false", response: "HAI Verify says it is false." },
      { condition: "Risky", response: "HAI Verify says it is risky." },
      { condition: "Uncertain", response: "HAI Verify says verification is needed." },
      {
        condition: "Money, legal, medical, family, security, or high-risk action",
        response: "HAI Verify requires human confirmation.",
      },
    ],
    quote:
      "HAI Verify does not make the final decision. It detects risk, explains uncertainty, and requires human verification before action.",
    flowEyebrow: "Flow",
    flowSteps: ["Human", "AI", "HAI Verification", "Human Approval", "XGOMA"],
    footerLegal:
      "All founder-originated concepts, workflows, verification structure, and HAI principles are retained by KARAM unless separately transferred by written agreement.",
  },
  ko: {
    tagline: "Human-Heart + AI-Law = Verification",
    intro1: "실제 사람과 AI 상호작용의 위험에서 시작했어요.",
    intro2a: "목표는 사람의 판단을 대체하는 것이 아니에요.",
    intro2b: "목표는 그 판단을 지키는 것이에요.",
    compassEyebrow: "KARAM 나침반",
    compassHeadline: "돈만이 전부가 아니에요",
    compassBody:
      "KARAM은 방향, 가족, 제품, IP, 실행, 신뢰를 하나로 봐요. 결제 화면의 숫자 하나로 끝나지 않아요.",
    lenses: [
      { title: "전체 방향", note: "KARAM이 어디로 가는지 — 매출 한 줄이 전부가 아니에요." },
      { title: "가족", note: "사람이 먼저 — 팀 안에서도, 중요한 결정에서도." },
      { title: "제품", note: "무엇을 출시하고, 어떻게 동작하며, 사람의 판단을 어떻게 지키는지." },
      { title: "IP", note: "창업자가 만든 개념, 워크플로, 검증 구조." },
      { title: "실행", note: "Human → AI → HAI → Human → XGOMA — 슬라이드가 아니라 실제로." },
      { title: "신뢰", note: "신뢰 지수, 관계, 방어 가능한 결과 — 과장이 아니에요." },
    ],
    principleEyebrow: "원칙",
    principles: ["AI가 답해요.", "HAI가 검증해요.", "사람이 승인해요.", "XGOMA가 실행해요."],
    behaviorEyebrow: "제품 동작",
    behaviors: [
      { condition: "명백히 거짓", response: "HAI Verify는 거짓이라고 알려요." },
      { condition: "위험함", response: "HAI Verify는 위험하다고 알려요." },
      { condition: "불확실함", response: "HAI Verify는 검증이 필요하다고 알려요." },
      {
        condition: "돈, 법, 의료, 가족, 보안, 고위험 행동",
        response: "HAI Verify는 사람의 확인을 요구해요.",
      },
    ],
    quote:
      "HAI Verify가 최종 결정을 내리지 않아요. 위험을 감지하고, 불확실성을 설명하고, 행동 전 사람의 검증을 요구해요.",
    flowEyebrow: "흐름",
    flowSteps: ["Human", "AI", "HAI Verification", "Human Approval", "XGOMA"],
    footerLegal:
      "창업자가 만든 모든 개념, 워크플로, 검증 구조, HAI 원칙은 별도 서면 양도 없이 KARAM에게 귀속됩니다.",
  },
  ja: {
    tagline: "Human-Heart + AI-Law = Verification",
    intro1: "実際の人とAIの相互作用リスクから生まれました。",
    intro2a: "目的は人の判断を置き換えることではありません。",
    intro2b: "目的はその判断を守ることです。",
    compassEyebrow: "KARAMコンパス",
    compassHeadline: "お金だけではない",
    compassBody:
      "KARAMは方向、家族、製品、IP、実行、信頼を一つの全体として見ます。チェックアウト画面の数字だけではありません。",
    lenses: [
      { title: "方向", note: "KARAMが向かう先 — 売上の一行だけではありません。" },
      { title: "家族", note: "人を第一に — チーム内でも、重要な決定でも。" },
      { title: "製品", note: "何を出荷し、どう動き、人の判断をどう守るか。" },
      { title: "IP", note: "創業者起点の概念、ワークフロー、検証構造。" },
      { title: "実行", note: "Human → AI → HAI → Human → XGOMA — スライドではなく実装。" },
      { title: "信頼", note: "Trust Index、関係、防御可能な成果 — 誇大ではありません。" },
    ],
    principleEyebrow: "原則",
    principles: ["AIが答える。", "HAIが検証する。", "人が承認する。", "XGOMAが実行する。"],
    behaviorEyebrow: "製品の動作",
    behaviors: [
      { condition: "明らかに false", response: "HAI Verifyは false と伝えます。" },
      { condition: "リスクあり", response: "HAI Verifyはリスクがあると伝えます。" },
      { condition: "不確実", response: "HAI Verifyは検証が必要と伝えます。" },
      {
        condition: "お金、法律、医療、家族、セキュリティ、高リスク行動",
        response: "HAI Verifyは人の確認を要求します。",
      },
    ],
    quote:
      "HAI Verifyが最終決定を下しません。リスクを検出し、不確実性を説明し、行動前に人の検証を要求します。",
    flowEyebrow: "フロー",
    flowSteps: ["Human", "AI", "HAI Verification", "Human Approval", "XGOMA"],
    footerLegal:
      "創業者起点のすべての概念、ワークフロー、検証構造、HAI原則は、別途書面譲渡がない限りKARAMに帰属します。",
  },
  es: {
    tagline: "Human-Heart + AI-Law = Verification",
    intro1: "Nació del riesgo real en la interacción humano–IA.",
    intro2a: "El objetivo no es reemplazar el juicio humano.",
    intro2b: "El objetivo es protegerlo.",
    compassEyebrow: "Brújula KARAM",
    compassHeadline: "No solo dinero",
    compassBody:
      "KARAM ve dirección, familia, producto, IP, ejecución y confianza como un todo — no métricas aisladas en una pantalla de pago.",
    lenses: [
      { title: "Dirección", note: "Hacia dónde va KARAM — no una sola línea de ingresos." },
      { title: "Familia", note: "Personas primero — en el equipo y en cada decisión crítica." },
      { title: "Producto", note: "Qué se lanza, cómo se comporta y cómo protege el juicio humano." },
      { title: "IP", note: "Conceptos, flujos y estructura de verificación del fundador." },
      { title: "Ejecución", note: "Human → AI → HAI → Human → XGOMA — hecho, no diapositivas." },
      { title: "Confianza", note: "Trust Index, relaciones y resultados defendibles — no hype." },
    ],
    principleEyebrow: "Principio",
    principles: ["La IA responde.", "HAI verifica.", "El humano aprueba.", "XGOMA ejecuta."],
    behaviorEyebrow: "Comportamiento del producto",
    behaviors: [
      { condition: "Claramente falso", response: "HAI Verify dice que es falso." },
      { condition: "Riesgoso", response: "HAI Verify dice que es riesgoso." },
      { condition: "Incertidumbre", response: "HAI Verify dice que se necesita verificación." },
      {
        condition: "Dinero, legal, médico, familia, seguridad o acción de alto riesgo",
        response: "HAI Verify requiere confirmación humana.",
      },
    ],
    quote:
      "HAI Verify no toma la decisión final. Detecta riesgo, explica incertidumbre y exige verificación humana antes de actuar.",
    flowEyebrow: "Flujo",
    flowSteps: ["Human", "AI", "HAI Verification", "Human Approval", "XGOMA"],
    footerLegal:
      "Todos los conceptos, flujos, estructura de verificación y principios HAI del fundador permanecen con KARAM salvo transferencia escrita.",
  },
  fr: {
    tagline: "Human-Heart + AI-Law = Verification",
    intro1: "Né du risque réel de l'interaction humain–IA.",
    intro2a: "L'objectif n'est pas de remplacer le jugement humain.",
    intro2b: "L'objectif est de le protéger.",
    compassEyebrow: "Boussole KARAM",
    compassHeadline: "Pas l'argent seul",
    compassBody:
      "KARAM voit direction, famille, produit, IP, exécution et confiance comme un tout — pas des métriques isolées sur un écran de paiement.",
    lenses: [
      { title: "Direction", note: "Où va KARAM — pas une seule ligne de revenu." },
      { title: "Famille", note: "Les personnes d'abord — dans l'équipe et dans chaque décision critique." },
      { title: "Produit", note: "Ce qui est livré, comment ça se comporte et comment ça protège le jugement humain." },
      { title: "IP", note: "Concepts, flux et structure de vérification du fondateur." },
      { title: "Exécution", note: "Human → AI → HAI → Human → XGOMA — livré, pas des slides." },
      { title: "Confiance", note: "Trust Index, relations et résultats défendables — pas du hype." },
    ],
    principleEyebrow: "Principe",
    principles: ["L'IA répond.", "HAI vérifie.", "L'humain approuve.", "XGOMA exécute."],
    behaviorEyebrow: "Comportement produit",
    behaviors: [
      { condition: "Clairement faux", response: "HAI Verify indique que c'est faux." },
      { condition: "Risqué", response: "HAI Verify indique que c'est risqué." },
      { condition: "Incertain", response: "HAI Verify indique qu'une vérification est nécessaire." },
      {
        condition: "Argent, juridique, médical, famille, sécurité ou action à haut risque",
        response: "HAI Verify exige une confirmation humaine.",
      },
    ],
    quote:
      "HAI Verify ne prend pas la décision finale. Il détecte le risque, explique l'incertitude et exige une vérification humaine avant l'action.",
    flowEyebrow: "Flux",
    flowSteps: ["Human", "AI", "HAI Verification", "Human Approval", "XGOMA"],
    footerLegal:
      "Tous les concepts, flux, structure de vérification et principes HAI du fondateur restent avec KARAM sauf transfert écrit.",
  },
};

const VERIFY: Record<AppLocale, VerifyCopy> = {
  en: {
    eyebrow: "HAI Verify",
    title: "Verify AI output",
    subtitle:
      "Quickly score AI text for trust and risk. Results are advisory — human review is required before high-stakes decisions.",
    fieldLabel: "AI output",
    placeholder: "Paste AI-generated text here…",
    submit: "Verify",
    submitting: "Verifying…",
    errEmpty: "Paste text to verify first.",
    errApi: "Could not reach the verification API. Please try again.",
    errFailed: "Verification failed.",
    resultTitle: "Verification result",
    copyReport: "Copy Report",
    copied: "Copied",
    trustIndex: "Trust Index",
    trustHint: "Composite trust score reflecting sources, tone, and regulatory fit.",
    hallucinationRisk: "Hallucination risk",
    scanNote: "Rule-based preliminary scan. Do not rely on scores alone for important decisions.",
    disclaimer:
      "This is a rule-based preliminary scan. Human review is required before legal, medical, financial, or high-stakes decisions.",
    riskFlags: "Risk flags",
    riskFlagsHint: "Signals detected by the verification engine",
    noFlags: "No flags raised.",
    summary: "Summary",
    nextStep: "Recommended next step",
    orderPrompt: "Need a human-reviewed report with audit notes and delivery SLA?",
    orderLink: "Open XGOMA Order",
    shareTitle: "RESULT — for Grok / GPT / Google",
    shareHint: "Extended copy including input excerpt and JSON",
    copyShare: "Copy RESULT",
    backLanding: "Back to landing",
  },
  ko: {
    eyebrow: "HAI Verify",
    title: "AI 출력 검증",
    subtitle:
      "AI 텍스트의 신뢰도와 위험을 빠르게 점검해 드려요. 결과는 참고용이며, 중요한 결정 전에는 사람 검토가 필요해요.",
    fieldLabel: "AI 출력",
    placeholder: "검증할 AI 생성 텍스트를 붙여 넣으세요…",
    submit: "검증하기",
    submitting: "검증 중…",
    errEmpty: "검증할 텍스트를 먼저 붙여 넣어 주세요.",
    errApi: "검증 API에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    errFailed: "검증에 실패했어요.",
    resultTitle: "검증 결과",
    copyReport: "리포트 복사",
    copied: "복사됨",
    trustIndex: "신뢰 지수",
    trustHint: "출처·표현·규제 적합성을 반영한 종합 신뢰 점수예요.",
    hallucinationRisk: "환각 위험",
    scanNote: "규칙 기반 1차 스캔 결과예요. 중요한 결정은 점수만으로 판단하지 말고 사람 검토를 꼭 거쳐 주세요.",
    disclaimer:
      "이 결과는 규칙 기반 1차 스캔이에요. 법·의료·금융처럼 중요한 결정 전에는 반드시 사람 검토를 거쳐 주세요.",
    riskFlags: "위험 플래그",
    riskFlagsHint: "엔진이 감지한 위험 신호예요",
    noFlags: "감지된 플래그 없음",
    summary: "요약",
    nextStep: "추천하는 다음 행동",
    orderPrompt: "감사 메모와 SLA가 포함된 사람 검토 리포트가 필요하신가요?",
    orderLink: "XGOMA 주문 열기",
    shareTitle: "결과 — Grok / GPT / Google용",
    shareHint: "입력 발췌와 JSON이 포함된 확장 복사본",
    copyShare: "결과 복사",
    backLanding: "랜딩으로 돌아가기",
  },
  ja: {
    eyebrow: "HAI Verify",
    title: "AI出力を検証",
    subtitle:
      "AIテキストの信頼度とリスクを素早く確認します。結果は参考用で、重要な判断の前には人のレビューが必要です。",
    fieldLabel: "AI出力",
    placeholder: "検証するAI生成テキストを貼り付け…",
    submit: "検証",
    submitting: "検証中…",
    errEmpty: "検証するテキストを貼り付けてください。",
    errApi: "検証APIに接続できませんでした。再試行してください。",
    errFailed: "検証に失敗しました。",
    resultTitle: "検証結果",
    copyReport: "レポートをコピー",
    copied: "コピー済み",
    trustIndex: "Trust Index",
    trustHint: "出典・表現・規制適合性を反映した総合信頼スコアです。",
    hallucinationRisk: "幻覚リスク",
    scanNote: "ルールベースの一次スキャン結果です。重要な判断はスコアだけに頼らないでください。",
    disclaimer:
      "これはルールベースの一次スキャンです。法務・医療・金融など重要な判断の前には必ず人のレビューが必要です。",
    riskFlags: "リスクフラグ",
    riskFlagsHint: "検証エンジンが検出した信号です",
    noFlags: "検出されたフラグはありません。",
    summary: "概要",
    nextStep: "推奨される次のステップ",
    orderPrompt: "監査メモとSLA付きの人間レビューレポートが必要ですか？",
    orderLink: "XGOMA注文を開く",
    shareTitle: "結果 — Grok / GPT / Google用",
    shareHint: "入力抜粋とJSONを含む拡張コピー",
    copyShare: "結果をコピー",
    backLanding: "ランディングに戻る",
  },
  es: {
    eyebrow: "HAI Verify",
    title: "Verificar salida de IA",
    subtitle:
      "Evalúe rápidamente la confianza y el riesgo del texto de IA. Los resultados son orientativos — se requiere revisión humana antes de decisiones críticas.",
    fieldLabel: "Salida de IA",
    placeholder: "Pegue el texto generado por IA aquí…",
    submit: "Verificar",
    submitting: "Verificando…",
    errEmpty: "Pegue primero el texto a verificar.",
    errApi: "No se pudo conectar con la API de verificación. Inténtelo de nuevo.",
    errFailed: "La verificación falló.",
    resultTitle: "Resultado de verificación",
    copyReport: "Copiar informe",
    copied: "Copiado",
    trustIndex: "Trust Index",
    trustHint: "Puntuación de confianza compuesta según fuentes, tono y ajuste regulatorio.",
    hallucinationRisk: "Riesgo de alucinación",
    scanNote: "Escaneo preliminar basado en reglas. No confíe solo en las puntuaciones para decisiones importantes.",
    disclaimer:
      "Este es un escaneo preliminar basado en reglas. Se requiere revisión humana antes de decisiones legales, médicas, financieras o de alto riesgo.",
    riskFlags: "Indicadores de riesgo",
    riskFlagsHint: "Señales detectadas por el motor de verificación",
    noFlags: "No se detectaron indicadores.",
    summary: "Resumen",
    nextStep: "Siguiente paso recomendado",
    orderPrompt: "¿Necesita un informe revisado por humanos con notas de auditoría y SLA?",
    orderLink: "Abrir pedido XGOMA",
    shareTitle: "RESULTADO — para Grok / GPT / Google",
    shareHint: "Copia extendida con extracto de entrada y JSON",
    copyShare: "Copiar RESULTADO",
    backLanding: "Volver al inicio",
  },
  fr: {
    eyebrow: "HAI Verify",
    title: "Vérifier la sortie IA",
    subtitle:
      "Évaluez rapidement la confiance et le risque du texte IA. Les résultats sont indicatifs — une revue humaine est requise avant les décisions critiques.",
    fieldLabel: "Sortie IA",
    placeholder: "Collez le texte généré par IA ici…",
    submit: "Vérifier",
    submitting: "Vérification…",
    errEmpty: "Collez d'abord le texte à vérifier.",
    errApi: "Impossible de joindre l'API de vérification. Réessayez.",
    errFailed: "La vérification a échoué.",
    resultTitle: "Résultat de vérification",
    copyReport: "Copier le rapport",
    copied: "Copié",
    trustIndex: "Trust Index",
    trustHint: "Score de confiance composite reflétant sources, ton et conformité réglementaire.",
    hallucinationRisk: "Risque d'hallucination",
    scanNote: "Scan préliminaire basé sur des règles. Ne vous fiez pas aux scores seuls pour les décisions importantes.",
    disclaimer:
      "Il s'agit d'un scan préliminaire basé sur des règles. Une revue humaine est requise avant toute décision juridique, médicale, financière ou à enjeu élevé.",
    riskFlags: "Signaux de risque",
    riskFlagsHint: "Signaux détectés par le moteur de vérification",
    noFlags: "Aucun signal détecté.",
    summary: "Résumé",
    nextStep: "Prochaine étape recommandée",
    orderPrompt: "Besoin d'un rapport revu par un humain avec notes d'audit et SLA ?",
    orderLink: "Ouvrir commande XGOMA",
    shareTitle: "RÉSULTAT — pour Grok / GPT / Google",
    shareHint: "Copie étendue avec extrait d'entrée et JSON",
    copyShare: "Copier RÉSULTAT",
    backLanding: "Retour à l'accueil",
  },
};

const LANDING: Record<AppLocale, LandingCopy> = {
  en: {
    heroEyebrow: "Enterprise AI verification",
    heroTitle: "Verify AI output before it reaches your customers",
    heroBody:
      "HAI Verify combines human judgment, accountable intent, AI speed, and lawful defensibility — so every model response can be scored, reviewed, and released with evidence.",
    heroDemo: "Open live demo",
    heroOrder: "Start $300 Evaluation",
    heroWorkflow: "See how it works",
    heroTagline: "Human · Heart · AI · Law — the verification framework for regulated teams",
    footerHumanVerified: "Human Verified",
    footerDesc: "HAI Verify — enterprise AI output verification.",
    footerCopyright: "All rights reserved.",
    session: "Session",
    trustTitle: "Built for enterprise trust",
    trustItems: [
      { label: "Human-in-the-loop", detail: "Reviewer routing on every high-risk output" },
      { label: "Audit-ready logs", detail: "Scan IDs and exportable verification summaries" },
      { label: "Policy aligned", detail: "HAI-VERIFY-01 enterprise verification framework" },
      { label: "Regulated domains", detail: "Legal, health, and financial signal checks" },
    ],
    workflowEyebrow: "Verification workflow",
    workflowTitle: "From model output to Human Verified",
    workflowDesc: "A clear four-step path that fits compliance, legal, and operations teams.",
    workflowSteps: [
      { step: "01", title: "Submit AI output", description: "Paste model responses from any LLM or agent workflow into the verification console." },
      { step: "02", title: "Run risk analysis", description: "Hallucination risk, source coverage, and policy alignment scores update in real time." },
      { step: "03", title: "Route human review", description: "High-risk or regulated content escalates to a human verifier with SLA targets." },
      { step: "04", title: "Release with confidence", description: "Export audit summaries and ship outputs marked Human Verified for stakeholders." },
    ],
    ctaEyebrow: "Get started",
    ctaTitle: "Bring Human Verified AI to your organization",
    ctaDesc: "Start with the interactive demo, then connect HAI Verify to your review queues, policy engine, and audit systems.",
    ctaDemo: "Try the live demo",
    ctaPoweredBy: "Powered by HAI Verification • Monetized by XGOMA Execution",
    ctaEnterprise: "Start $300 Evaluation",
  },
  ko: {
    heroEyebrow: "엔터프라이즈 AI 검증",
    heroTitle: "고객에게 닿기 전에 AI 출력을 검증하세요",
    heroBody:
      "HAI Verify는 사람의 판단, 책임 있는 의도, AI 속도, 법적 방어 가능성을 결합해 — 모든 모델 응답을 점수화하고, 검토하고, 근거와 함께 배포할 수 있게 해요.",
    heroDemo: "라이브 데모 열기",
    heroOrder: "Start $300 Evaluation",
    heroWorkflow: "작동 방식 보기",
    heroTagline: "Human · Heart · AI · Law — 규제 팀을 위한 검증 프레임워크",
    footerHumanVerified: "사람 검증 완료",
    footerDesc: "HAI Verify — 엔터프라이즈 AI 출력 검증.",
    footerCopyright: "모든 권리 보유.",
    session: "세션",
    trustTitle: "엔터프라이즈 신뢰를 위해",
    trustItems: [
      { label: "사람 개입", detail: "고위험 출력마다 검토자 라우팅" },
      { label: "감사용 로그", detail: "스캔 ID와 내보낼 수 있는 검증 요약" },
      { label: "정책 정렬", detail: "HAI-VERIFY-01 엔터프라이즈 검증 프레임워크" },
      { label: "규제 분야", detail: "법률·건강·금융 신호 점검" },
    ],
    workflowEyebrow: "검증 워크플로",
    workflowTitle: "모델 출력에서 사람 검증까지",
    workflowDesc: "컴플라이언스·법무·운영 팀에 맞는 명확한 4단계 경로예요.",
    workflowSteps: [
      { step: "01", title: "AI 출력 제출", description: "LLM 또는 에이전트 워크플로의 모델 응답을 검증 콘솔에 붙여 넣어요." },
      { step: "02", title: "위험 분석 실행", description: "환각 위험, 출처 연결, 정책 적합성 점수가 실시간으로 갱신돼요." },
      { step: "03", title: "사람 검토 라우팅", description: "고위험·규제 콘텐츠는 SLA 목표와 함께 사람 검증자에게 전달돼요." },
      { step: "04", title: "안심하고 배포", description: "감사 요약을 내보내고 이해관계자에게 사람 검증 완료 표시와 함께 배포해요." },
    ],
    ctaEyebrow: "시작하기",
    ctaTitle: "조직에 사람 검증 AI를 도입하세요",
    ctaDesc: "인터랙티브 데모로 시작한 뒤, 검토 대기열·정책 엔진·감사 시스템과 연결하세요.",
    ctaDemo: "라이브 데모 체험",
    ctaPoweredBy: "Powered by HAI Verification • Monetized by XGOMA Execution",
    ctaEnterprise: "Start $300 Evaluation",
  },
  ja: {
    heroEyebrow: "エンタープライズAI検証",
    heroTitle: "顧客に届く前にAI出力を検証",
    heroBody:
      "HAI Verifyは人の判断、説明責任ある意図、AIの速度、法的防御可能性を組み合わせ、すべてのモデル応答をスコア化・レビュー・証拠付きでリリースできます。",
    heroDemo: "ライブデモを開く",
    heroOrder: "Start $300 Evaluation",
    heroWorkflow: "仕組みを見る",
    heroTagline: "Human · Heart · AI · Law — 規制チーム向け検証フレームワーク",
    footerHumanVerified: "Human Verified",
    footerDesc: "HAI Verify — エンタープライズAI出力検証。",
    footerCopyright: "All rights reserved.",
    session: "セッション",
    trustTitle: "エンタープライズ信頼のために",
    trustItems: [
      { label: "Human-in-the-loop", detail: "高リスク出力ごとにレビュー担当へルーティング" },
      { label: "監査対応ログ", detail: "スキャンIDとエクスポート可能な検証サマリー" },
      { label: "ポリシー整合", detail: "HAI-VERIFY-01エンタープライズ検証フレームワーク" },
      { label: "規制ドメイン", detail: "法務・健康・金融シグナルチェック" },
    ],
    workflowEyebrow: "検証ワークフロー",
    workflowTitle: "モデル出力からHuman Verifiedまで",
    workflowDesc: "コンプライアンス・法務・運用チーム向けの明確な4ステップ。",
    workflowSteps: [
      { step: "01", title: "AI出力を提出", description: "LLMまたはエージェントワークフローの応答を検証コンソールに貼り付けます。" },
      { step: "02", title: "リスク分析を実行", description: "幻覚リスク、出典カバレッジ、ポリシー適合スコアがリアルタイムで更新されます。" },
      { step: "03", title: "人間レビューへルーティング", description: "高リスク・規制コンテンツはSLA目標付きでレビュアーへエスカレーション。" },
      { step: "04", title: "自信を持ってリリース", description: "監査サマリーをエクスポートし、Human Verifiedとしてステークホルダーに提供。" },
    ],
    ctaEyebrow: "始める",
    ctaTitle: "組織にHuman Verified AIを",
    ctaDesc: "インタラクティブデモから始め、レビューキュー・ポリシーエンジン・監査システムと接続。",
    ctaDemo: "ライブデモを試す",
    ctaPoweredBy: "Powered by HAI Verification • Monetized by XGOMA Execution",
    ctaEnterprise: "Start $300 Evaluation",
  },
  es: {
    heroEyebrow: "Verificación IA empresarial",
    heroTitle: "Verifique la salida de IA antes de que llegue a sus clientes",
    heroBody:
      "HAI Verify combina juicio humano, intención responsable, velocidad de IA y defensibilidad legal — para puntuar, revisar y publicar cada respuesta con evidencia.",
    heroDemo: "Abrir demo en vivo",
    heroOrder: "Start $300 Evaluation",
    heroWorkflow: "Ver cómo funciona",
    heroTagline: "Human · Heart · AI · Law — marco de verificación para equipos regulados",
    footerHumanVerified: "Human Verified",
    footerDesc: "HAI Verify — verificación empresarial de salida IA.",
    footerCopyright: "Todos los derechos reservados.",
    session: "Sesión",
    trustTitle: "Diseñado para confianza empresarial",
    trustItems: [
      { label: "Human-in-the-loop", detail: "Enrutamiento a revisores en cada salida de alto riesgo" },
      { label: "Registros listos para auditoría", detail: "IDs de escaneo y resúmenes exportables" },
      { label: "Alineado con políticas", detail: "Marco de verificación empresarial HAI-VERIFY-01" },
      { label: "Dominios regulados", detail: "Comprobaciones legales, de salud y financieras" },
    ],
    workflowEyebrow: "Flujo de verificación",
    workflowTitle: "De la salida del modelo a Human Verified",
    workflowDesc: "Un camino claro de cuatro pasos para equipos de cumplimiento, legal y operaciones.",
    workflowSteps: [
      { step: "01", title: "Enviar salida de IA", description: "Pegue respuestas del modelo desde cualquier LLM o flujo de agente." },
      { step: "02", title: "Ejecutar análisis de riesgo", description: "Riesgo de alucinación, cobertura de fuentes y alineación de política en tiempo real." },
      { step: "03", title: "Enrutar revisión humana", description: "Contenido de alto riesgo o regulado escala a un verificador humano con SLA." },
      { step: "04", title: "Publicar con confianza", description: "Exporte resúmenes de auditoría y publique como Human Verified." },
    ],
    ctaEyebrow: "Comenzar",
    ctaTitle: "Lleve IA Human Verified a su organización",
    ctaDesc: "Empiece con la demo interactiva y conecte colas de revisión, motor de políticas y sistemas de auditoría.",
    ctaDemo: "Probar la demo en vivo",
    ctaPoweredBy: "Powered by HAI Verification • Monetized by XGOMA Execution",
    ctaEnterprise: "Start $300 Evaluation",
  },
  fr: {
    heroEyebrow: "Vérification IA entreprise",
    heroTitle: "Vérifiez la sortie IA avant qu'elle n'atteigne vos clients",
    heroBody:
      "HAI Verify combine jugement humain, intention responsable, vitesse IA et défendabilité juridique — pour noter, revoir et publier chaque réponse avec preuves.",
    heroDemo: "Ouvrir la démo live",
    heroOrder: "Start $300 Evaluation",
    heroWorkflow: "Voir comment ça marche",
    heroTagline: "Human · Heart · AI · Law — cadre de vérification pour équipes réglementées",
    footerHumanVerified: "Human Verified",
    footerDesc: "HAI Verify — vérification entreprise des sorties IA.",
    footerCopyright: "Tous droits réservés.",
    session: "Session",
    trustTitle: "Conçu pour la confiance entreprise",
    trustItems: [
      { label: "Human-in-the-loop", detail: "Routage vers un relecteur pour chaque sortie à haut risque" },
      { label: "Journaux prêts pour audit", detail: "IDs de scan et résumés de vérification exportables" },
      { label: "Aligné sur les politiques", detail: "Cadre de vérification entreprise HAI-VERIFY-01" },
      { label: "Domaines réglementés", detail: "Contrôles juridiques, santé et finance" },
    ],
    workflowEyebrow: "Flux de vérification",
    workflowTitle: "De la sortie modèle à Human Verified",
    workflowDesc: "Un parcours clair en quatre étapes pour conformité, juridique et opérations.",
    workflowSteps: [
      { step: "01", title: "Soumettre la sortie IA", description: "Collez les réponses du modèle depuis tout LLM ou flux agent." },
      { step: "02", title: "Lancer l'analyse des risques", description: "Risque d'hallucination, couverture des sources et alignement politique en temps réel." },
      { step: "03", title: "Router la revue humaine", description: "Contenu à haut risque ou réglementé escaladé vers un vérificateur avec SLA." },
      { step: "04", title: "Publier en confiance", description: "Exportez les résumés d'audit et publiez en Human Verified." },
    ],
    ctaEyebrow: "Commencer",
    ctaTitle: "Apportez l'IA Human Verified à votre organisation",
    ctaDesc: "Commencez par la démo interactive, puis connectez files de revue, moteur de politiques et systèmes d'audit.",
    ctaDemo: "Essayer la démo live",
    ctaPoweredBy: "Powered by HAI Verification • Monetized by XGOMA Execution",
    ctaEnterprise: "Start $300 Evaluation",
  },
};

export function getSiteCopy(locale: AppLocale): UiCopy {
  return {
    common: COMMON[locale],
    origin: ORIGIN[locale],
    verify: VERIFY[locale],
    landing: LANDING[locale],
    demo: getDemoCopy(locale),
  };
}
