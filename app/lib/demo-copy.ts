import type { AppLocale } from "./ui-locale";

export type DemoCopy = {
  eyebrow: string;
  title: string;
  description: string;
  enterpriseWorkspace: string;
  policy: string;
  liveEvaluation: string;
  evaluated: string;
  newScan: string;
  keyMetrics: string;
  hallucinationRisk: string;
  trustIndex: string;
  sourceCoverage: string;
  policyAlignment: string;
  levelBand: string;
  compositeScore: string;
  citations: string;
  policyFit: string;
  aiOutput: string;
  aiOutputDesc: string;
  words: string;
  placeholder: string;
  sampleCompliance: string;
  sampleHighRisk: string;
  clear: string;
  riskAssessment: string;
  riskAssessmentDesc: string;
  statRisk: string;
  statTrust: string;
  statFacts: string;
  queue: string;
  sla: string;
  autoMode: string;
  autoModeDesc: string;
  autoModeBody: string;
  summaryTitle: string;
  summaryDesc: string;
  copyAudit: string;
  copied: string;
  pillars: [string, string, string, string];
  signalsTitle: string;
  signalsDesc: string;
  claimConfidence: string;
  statusIdleLabel: string;
  statusIdleDesc: string;
  statusClearedLabel: string;
  statusReviewLabel: string;
  statusBlockedLabel: string;
  trustBadge: string;
  riskBadge: string;
  levels: { Low: string; Moderate: string; High: string; Critical: string };
  signalStates: { pass: string; review: string; fail: string };
  signalLabels: Record<string, string>;
  defaultSample: string;
  complianceSample: string;
  highRiskSample: string;
};

export const DEMO_COPY: Record<AppLocale, DemoCopy> = {
  en: {
    eyebrow: "Interactive demo",
    title: "Live verification console",
    description:
      "Paste AI output to see Trust Index, hallucination risk, and risk signals instantly. We show results only — nothing is blocked.",
    enterpriseWorkspace: "Enterprise workspace",
    policy: "Policy HAI-VERIFY-01",
    liveEvaluation: "Live evaluation",
    evaluated: "Evaluated",
    newScan: "New scan",
    keyMetrics: "Key metrics",
    hallucinationRisk: "Hallucination risk",
    trustIndex: "Trust index",
    sourceCoverage: "Source coverage",
    policyAlignment: "Policy alignment",
    levelBand: "{level} band",
    compositeScore: "Composite score",
    citations: "Citations",
    policyFit: "Policy fit",
    aiOutput: "AI output",
    aiOutputDesc: "Paste model response to run verification checks.",
    words: "words",
    placeholder: "Paste AI output here…",
    sampleCompliance: "Compliance",
    sampleHighRisk: "High risk",
    clear: "Clear",
    riskAssessment: "Risk assessment",
    riskAssessmentDesc: "Composite hallucination score.",
    statRisk: "Risk",
    statTrust: "Trust",
    statFacts: "Facts",
    queue: "Queue",
    sla: "SLA",
    autoMode: "Auto mode",
    autoModeDesc: "Results only — no manual queue.",
    autoModeBody: "Verification runs automatically on every edit.",
    summaryTitle: "Verification summary",
    summaryDesc: "What matters, why it matters, and what to do next — at a glance.",
    copyAudit: "Copy audit",
    copied: "Copied",
    pillars: ["Human", "Heart", "AI", "Law"],
    signalsTitle: "Verification signals",
    signalsDesc: "The checks behind your score.",
    claimConfidence: "Claim confidence",
    statusIdleLabel: "Awaiting input",
    statusIdleDesc: "Paste AI output to see Trust Index and risk signals right away.",
    statusClearedLabel: "Verified",
    statusReviewLabel: "Review recommended",
    statusBlockedLabel: "Needs fixes",
    trustBadge: "Trust",
    riskBadge: "Risk",
    levels: { Low: "Low", Moderate: "Moderate", High: "High", Critical: "Critical" },
    signalStates: { pass: "Pass", review: "Review", fail: "Fail" },
    signalLabels: {
      "Source grounding": "Source grounding",
      "Calibrated language": "Calibrated language",
      "Regulated content": "Regulated content",
      "Data handling": "Data handling",
    },
    defaultSample:
      "Draft a verification memo for a vendor contract clause on data retention and incident reporting. Include citations [1] and note jurisdictional limits.",
    complianceSample:
      "Summarize GDPR retention requirements for customer support chat logs across EU member states with exact timeframes.",
    highRiskSample:
      "This medication is 100% safe for everyone and will definitely cure migraines. Take 900mg daily. No side effects.",
  },
  ko: {
    eyebrow: "인터랙티브 데모",
    title: "실시간 검증 콘솔",
    description:
      "AI 출력을 붙여 넣으면 신뢰 지수, 환각 위험, 위험 신호를 바로 확인할 수 있어요. 결과만 보여 드리고 차단은 하지 않습니다.",
    enterpriseWorkspace: "엔터프라이즈 워크스페이스",
    policy: "정책 HAI-VERIFY-01",
    liveEvaluation: "실시간 평가",
    evaluated: "평가 시각",
    newScan: "새 스캔",
    keyMetrics: "핵심 지표",
    hallucinationRisk: "환각 위험",
    trustIndex: "신뢰 지수",
    sourceCoverage: "출처 연결",
    policyAlignment: "정책 적합성",
    levelBand: "{level} 구간",
    compositeScore: "종합 점수",
    citations: "인용",
    policyFit: "정책 적합",
    aiOutput: "AI 출력",
    aiOutputDesc: "모델 응답을 붙여 넣으면 검증을 실행해요.",
    words: "단어",
    placeholder: "AI 출력을 여기에 붙여 넣으세요…",
    sampleCompliance: "컴플라이언스",
    sampleHighRisk: "고위험",
    clear: "지우기",
    riskAssessment: "위험 평가",
    riskAssessmentDesc: "환각 위험 종합 점수예요.",
    statRisk: "위험",
    statTrust: "신뢰",
    statFacts: "사실성",
    queue: "대기열",
    sla: "SLA",
    autoMode: "자동 모드",
    autoModeDesc: "결과만 표시 — 수동 대기열 없음.",
    autoModeBody: "편집할 때마다 자동으로 검증이 실행돼요.",
    summaryTitle: "검증 요약",
    summaryDesc: "무엇이 문제고, 왜 그런지, 다음에 무엇을 하면 좋은지 한눈에.",
    copyAudit: "감사 복사",
    copied: "복사됨",
    pillars: ["Human", "Heart", "AI", "Law"],
    signalsTitle: "검증 신호",
    signalsDesc: "점수 뒤에 숨은 검증 항목이에요.",
    claimConfidence: "주장 신뢰도",
    statusIdleLabel: "검증 대기",
    statusIdleDesc: "AI 출력을 붙여 넣으면 신뢰 지수와 위험 신호를 바로 알려 드릴게요.",
    statusClearedLabel: "검증 완료",
    statusReviewLabel: "검토 권장",
    statusBlockedLabel: "수정 필요",
    trustBadge: "신뢰",
    riskBadge: "위험",
    levels: { Low: "낮음", Moderate: "보통", High: "높음", Critical: "심각" },
    signalStates: { pass: "통과", review: "검토", fail: "실패" },
    signalLabels: {
      "Source grounding": "출처 근거",
      "Calibrated language": "표현 조절",
      "Regulated content": "규제 콘텐츠",
      "Data handling": "데이터 처리",
    },
    defaultSample:
      "벤더 계약의 데이터 보존 및 사고 보고 조항에 대한 검증 메모 초안을 작성해 주세요. 인용 [1]을 포함하고 관할권 한계를 명시해 주세요.",
    complianceSample:
      "EU 회원국 고객 지원 채팅 로그의 GDPR 보존 요건을 정확한 기한과 함께 요약해 주세요.",
    highRiskSample:
      "이 약은 모든 사람에게 100% 안전하며 편두통을 반드시 치료합니다. 하루 900mg 복용. 부작용 없음.",
  },
  ja: {
    eyebrow: "インタラクティブデモ",
    title: "ライブ検証コンソール",
    description:
      "AI出力を貼り付けると、Trust Index、幻覚リスク、リスク信号をすぐ確認できます。結果表示のみ — ブロックはしません。",
    enterpriseWorkspace: "エンタープライズワークスペース",
    policy: "ポリシー HAI-VERIFY-01",
    liveEvaluation: "ライブ評価",
    evaluated: "評価時刻",
    newScan: "新規スキャン",
    keyMetrics: "主要指標",
    hallucinationRisk: "幻覚リスク",
    trustIndex: "Trust Index",
    sourceCoverage: "出典カバレッジ",
    policyAlignment: "ポリシー適合",
    levelBand: "{level}帯",
    compositeScore: "総合スコア",
    citations: "引用",
    policyFit: "ポリシー適合",
    aiOutput: "AI出力",
    aiOutputDesc: "モデル応答を貼り付けて検証を実行します。",
    words: "語",
    placeholder: "AI出力をここに貼り付け…",
    sampleCompliance: "コンプライアンス",
    sampleHighRisk: "高リスク",
    clear: "クリア",
    riskAssessment: "リスク評価",
    riskAssessmentDesc: "幻覚リスクの総合スコアです。",
    statRisk: "リスク",
    statTrust: "信頼",
    statFacts: "事実性",
    queue: "キュー",
    sla: "SLA",
    autoMode: "自動モード",
    autoModeDesc: "結果のみ — 手動キューなし。",
    autoModeBody: "編集のたびに自動で検証が実行されます。",
    summaryTitle: "検証サマリー",
    summaryDesc: "何が問題で、なぜか、次に何をすべきか — 一目で。",
    copyAudit: "監査をコピー",
    copied: "コピー済み",
    pillars: ["Human", "Heart", "AI", "Law"],
    signalsTitle: "検証シグナル",
    signalsDesc: "スコアの裏にある検証項目です。",
    claimConfidence: "主張の信頼度",
    statusIdleLabel: "入力待ち",
    statusIdleDesc: "AI出力を貼り付けるとTrust Indexとリスク信号がすぐ表示されます。",
    statusClearedLabel: "検証完了",
    statusReviewLabel: "レビュー推奨",
    statusBlockedLabel: "修正が必要",
    trustBadge: "Trust",
    riskBadge: "Risk",
    levels: { Low: "低", Moderate: "中", High: "高", Critical: "重大" },
    signalStates: { pass: "合格", review: "要確認", fail: "不合格" },
    signalLabels: {
      "Source grounding": "出典の根拠",
      "Calibrated language": "表現の調整",
      "Regulated content": "規制コンテンツ",
      "Data handling": "データ取扱",
    },
    defaultSample:
      "ベンダー契約のデータ保持およびインシデント報告条項に関する検証メモの草案を作成してください。引用[1]を含め、管轄の限界を明記してください。",
    complianceSample:
      "EU加盟国のカスタマーサポートチャットログに関するGDPR保持要件を正確な期限とともに要約してください。",
    highRiskSample:
      "この薬は全員に100%安全で、偏頭痛を必ず治します。1日900mg服用。副作用なし。",
  },
  es: {
    eyebrow: "Demo interactiva",
    title: "Consola de verificación en vivo",
    description:
      "Pegue la salida de IA para ver Trust Index, riesgo de alucinación y señales al instante. Solo mostramos resultados — no bloqueamos.",
    enterpriseWorkspace: "Espacio de trabajo empresarial",
    policy: "Política HAI-VERIFY-01",
    liveEvaluation: "Evaluación en vivo",
    evaluated: "Evaluado",
    newScan: "Nuevo escaneo",
    keyMetrics: "Métricas clave",
    hallucinationRisk: "Riesgo de alucinación",
    trustIndex: "Trust Index",
    sourceCoverage: "Cobertura de fuentes",
    policyAlignment: "Alineación de política",
    levelBand: "Banda {level}",
    compositeScore: "Puntuación compuesta",
    citations: "Citas",
    policyFit: "Ajuste de política",
    aiOutput: "Salida de IA",
    aiOutputDesc: "Pegue la respuesta del modelo para ejecutar verificaciones.",
    words: "palabras",
    placeholder: "Pegue la salida de IA aquí…",
    sampleCompliance: "Cumplimiento",
    sampleHighRisk: "Alto riesgo",
    clear: "Borrar",
    riskAssessment: "Evaluación de riesgo",
    riskAssessmentDesc: "Puntuación compuesta de alucinación.",
    statRisk: "Riesgo",
    statTrust: "Confianza",
    statFacts: "Hechos",
    queue: "Cola",
    sla: "SLA",
    autoMode: "Modo automático",
    autoModeDesc: "Solo resultados — sin cola manual.",
    autoModeBody: "La verificación se ejecuta automáticamente en cada edición.",
    summaryTitle: "Resumen de verificación",
    summaryDesc: "Qué importa, por qué y qué hacer a continuación — de un vistazo.",
    copyAudit: "Copiar auditoría",
    copied: "Copiado",
    pillars: ["Human", "Heart", "AI", "Law"],
    signalsTitle: "Señales de verificación",
    signalsDesc: "Las comprobaciones detrás de su puntuación.",
    claimConfidence: "Confianza de afirmación",
    statusIdleLabel: "Esperando entrada",
    statusIdleDesc: "Pegue la salida de IA para ver Trust Index y señales de riesgo al instante.",
    statusClearedLabel: "Verificado",
    statusReviewLabel: "Revisión recomendada",
    statusBlockedLabel: "Requiere correcciones",
    trustBadge: "Trust",
    riskBadge: "Risk",
    levels: { Low: "Bajo", Moderate: "Moderado", High: "Alto", Critical: "Crítico" },
    signalStates: { pass: "Aprobado", review: "Revisar", fail: "Fallo" },
    signalLabels: {
      "Source grounding": "Fundamento de fuentes",
      "Calibrated language": "Lenguaje calibrado",
      "Regulated content": "Contenido regulado",
      "Data handling": "Manejo de datos",
    },
    defaultSample:
      "Redacte un memo de verificación para una cláusula de contrato de proveedor sobre retención de datos e informes de incidentes. Incluya citas [1] y límites jurisdiccionales.",
    complianceSample:
      "Resuma los requisitos de retención GDPR para registros de chat de soporte en estados miembros de la UE con plazos exactos.",
    highRiskSample:
      "Este medicamento es 100% seguro para todos y curará definitivamente las migrañas. Tome 900 mg diarios. Sin efectos secundarios.",
  },
  fr: {
    eyebrow: "Démo interactive",
    title: "Console de vérification en direct",
    description:
      "Collez la sortie IA pour voir Trust Index, risque d'hallucination et signaux instantanément. Résultats uniquement — aucun blocage.",
    enterpriseWorkspace: "Espace de travail entreprise",
    policy: "Politique HAI-VERIFY-01",
    liveEvaluation: "Évaluation en direct",
    evaluated: "Évalué",
    newScan: "Nouveau scan",
    keyMetrics: "Métriques clés",
    hallucinationRisk: "Risque d'hallucination",
    trustIndex: "Trust Index",
    sourceCoverage: "Couverture des sources",
    policyAlignment: "Alignement politique",
    levelBand: "Bande {level}",
    compositeScore: "Score composite",
    citations: "Citations",
    policyFit: "Adéquation politique",
    aiOutput: "Sortie IA",
    aiOutputDesc: "Collez la réponse du modèle pour lancer les vérifications.",
    words: "mots",
    placeholder: "Collez la sortie IA ici…",
    sampleCompliance: "Conformité",
    sampleHighRisk: "Risque élevé",
    clear: "Effacer",
    riskAssessment: "Évaluation des risques",
    riskAssessmentDesc: "Score composite d'hallucination.",
    statRisk: "Risque",
    statTrust: "Confiance",
    statFacts: "Faits",
    queue: "File",
    sla: "SLA",
    autoMode: "Mode auto",
    autoModeDesc: "Résultats uniquement — pas de file manuelle.",
    autoModeBody: "La vérification s'exécute automatiquement à chaque modification.",
    summaryTitle: "Résumé de vérification",
    summaryDesc: "Ce qui compte, pourquoi, et quoi faire ensuite — en un coup d'œil.",
    copyAudit: "Copier l'audit",
    copied: "Copié",
    pillars: ["Human", "Heart", "AI", "Law"],
    signalsTitle: "Signaux de vérification",
    signalsDesc: "Les contrôles derrière votre score.",
    claimConfidence: "Confiance des affirmations",
    statusIdleLabel: "En attente",
    statusIdleDesc: "Collez la sortie IA pour voir Trust Index et signaux de risque immédiatement.",
    statusClearedLabel: "Vérifié",
    statusReviewLabel: "Revue recommandée",
    statusBlockedLabel: "Corrections requises",
    trustBadge: "Trust",
    riskBadge: "Risk",
    levels: { Low: "Faible", Moderate: "Modéré", High: "Élevé", Critical: "Critique" },
    signalStates: { pass: "OK", review: "Revue", fail: "Échec" },
    signalLabels: {
      "Source grounding": "Ancrage des sources",
      "Calibrated language": "Langage calibré",
      "Regulated content": "Contenu réglementé",
      "Data handling": "Traitement des données",
    },
    defaultSample:
      "Rédigez un mémo de vérification pour une clause de contrat fournisseur sur la rétention des données et les rapports d'incident. Incluez des citations [1] et les limites juridictionnelles.",
    complianceSample:
      "Résumez les exigences de rétention RGPD pour les journaux de chat support dans les États membres de l'UE avec des délais exacts.",
    highRiskSample:
      "Ce médicament est sûr à 100% pour tous et guérira définitivement les migraines. 900 mg par jour. Aucun effet secondaire.",
  },
};

export function getDemoCopy(locale: AppLocale): DemoCopy {
  return DEMO_COPY[locale];
}

export function localeToDateFormat(locale: AppLocale): string {
  const map: Record<AppLocale, string> = {
    en: "en-US",
    ko: "ko-KR",
    ja: "ja-JP",
    es: "es-ES",
    fr: "fr-FR",
  };
  return map[locale];
}
