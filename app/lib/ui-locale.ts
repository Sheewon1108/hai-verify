import { formatRiskFlagsForDisplay, type RiskFlagLocale } from "./verification";

export type AppLocale = "en" | "ko" | "ja" | "es" | "fr";

export const APP_LOCALES: AppLocale[] = ["en", "ko", "ja", "es", "fr"];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "EN",
  ko: "KO",
  ja: "JA",
  es: "ES",
  fr: "FR",
};

export function toVerifyApiLocale(locale: AppLocale): RiskFlagLocale {
  return locale === "ko" ? "ko" : "en";
}

export function acceptLanguageHeader(locale: AppLocale): string {
  const map: Record<AppLocale, string> = {
    en: "en-US,en;q=0.9",
    ko: "ko-KR,ko;q=0.9",
    ja: "ja-JP,ja;q=0.9",
    es: "es-ES,es;q=0.9",
    fr: "fr-FR,fr;q=0.9",
  };
  return map[locale];
}

const RISK_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
  missing_source_long_text: {
    ja: "長文に出典がありません",
    es: "Texto largo sin fuente",
    fr: "Texte long sans source",
  },
  overconfident_language: {
    ja: "過度に断定的な表現があります",
    es: "Lenguaje demasiado confiado",
    fr: "Formulation trop catégorique",
  },
  subjective_future_claim: {
    ja: "将来見通しや価値判断が含まれています",
    es: "Afirmación subjetiva sobre el futuro",
    fr: "Projection ou jugement subjectif",
  },
  unverified_numbers: {
    ja: "根拠のない数値があります",
    es: "Números sin verificar",
    fr: "Chiffres non vérifiés",
  },
  regulated_domain_no_source: {
    ja: "規制分野の内容に出典がありません",
    es: "Dominio regulado sin fuente",
    fr: "Domaine réglementé sans source",
  },
  low_risk_cleared: {
    ja: "大きなリスク信号はありません",
    es: "Riesgo bajo — sin alertas",
    fr: "Faible risque — aucun signal majeur",
  },
  pii_detected: {
    ja: "個人情報の可能性があります",
    es: "Posible información personal",
    fr: "Données personnelles possibles",
  },
  missing_evidence: {
    ja: "長文に出典がありません",
    es: "Texto largo sin fuente",
    fr: "Texte long sans source",
  },
  subjective_claim: {
    ja: "将来見通しや価値判断が含まれています",
    es: "Afirmación subjetiva sobre el futuro",
    fr: "Projection ou jugement subjectif",
  },
  unverified_claim: {
    ja: "根拠のない数値があります",
    es: "Números sin verificar",
    fr: "Chiffres non vérifiés",
  },
  regulated_content: {
    ja: "規制分野の内容に出典がありません",
    es: "Dominio regulado sin fuente",
    fr: "Domaine réglementé sans source",
  },
  low_risk: {
    ja: "大きなリスク信号はありません",
    es: "Riesgo bajo — sin alertas",
    fr: "Faible risque — aucun signal majeur",
  },
};

export function formatRiskFlagsForAppLocale(flags: string[], locale: AppLocale) {
  if (locale === "ko" || locale === "en") {
    return formatRiskFlagsForDisplay(flags, locale);
  }
  return flags.map((code) => ({
    code,
    label: RISK_I18N[code]?.[locale] ?? code.replace(/_/g, " "),
  }));
}

export type OrderCopy = {
  brand: string;
  title: string;
  subtitle: string;
  selectProduct: string;
  contentLabel: string;
  contentHint: string;
  contentPlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  disclaimer: string;
  submit: string;
  flowHint: string;
  errContent: string;
  errEmail: string;
  errVerify: string;
  errCheckout: string;
  errVerifyFailed: string;
  errCheckoutFailed: string;
  loadingMessage: string;
  loadingSub: string;
  checkoutTitle: string;
  checkoutStripe: string;
  billingContact: string;
  checkoutMock: string;
  pay: string;
  authorizing: string;
  paymentConfirmed: string;
  reportTitle: string;
  reportMeta: string;
  paid: string;
  trustIndex: string;
  hallucinationRisk: string;
  riskFlags: string;
  noFlags: string;
  summary: string;
  nextStep: string;
  submitAnother: string;
  asideHai: string;
  asideXgoma: string;
  freeScan: string;
  returnVerify: string;
  backLanding: string;
  intakeEyebrow: string;
  deliveryBadge: string;
  certificateSeal: string;
  trustStrip: [string, string, string];
  enterpriseBadge: string;
  foundingStarter: {
    badge: string;
    priceNote: string;
    noSub: string;
    delivery: string;
    whatsIncluded: string;
    cta: string;
    urgency: string;
  };
  offers: Record<
    "starter" | "trust_pilot",
    { title: string; subtitle: string; includes: string[] }
  >;
};

const ORDER_COPY: Record<AppLocale, OrderCopy> = {
  en: {
    brand: "XGOMA Inc",
    title: "Enterprise Intake · Order & Analyze",
    subtitle:
      "Submit AI content for HAI verification, complete secure checkout, and receive your HAI-VERIFY-01 certified audit report — delivered within 48–72 hours.",
    selectProduct: "Select a product",
    contentLabel: "Content to Verify",
    contentHint: "Paste the AI-generated text, draft, or output you need verified before distribution.",
    contentPlaceholder: "Paste content for HAI verification…",
    emailLabel: "Client Contact Email",
    emailPlaceholder: "billing@company.com",
    disclaimer:
      "This is a rule-based preliminary scan. Human review is required before legal, medical, financial, or high-stakes decisions.",
    submit: "Order & Analyze",
    flowHint: "Verify → Stripe Test checkout → Instant analysis report",
    errContent: "Enter content to verify.",
    errEmail: "Enter a valid email address.",
    errVerify: "Could not reach the verification API. Please try again.",
    errCheckout: "Payment processing failed. Please try again.",
    errVerifyFailed: "Verification failed.",
    errCheckoutFailed: "Checkout failed.",
    loadingMessage: "Processing with HAI Verification Shield... Protecting your enterprise IP.",
    loadingSub: "HAI Verification Shield · Enterprise IP Protection",
    checkoutTitle: "Secure Checkout",
    checkoutStripe: "Stripe · Test Mode",
    billingContact: "Billing contact",
    checkoutMock:
      "Mock transaction only — no real charges. Payment authorization simulates Stripe test-mode behavior for XGOMA revenue infrastructure demos.",
    pay: "Pay",
    authorizing: "Authorizing…",
    paymentConfirmed: "Payment confirmed",
    reportTitle: "HAI Verification Report",
    reportMeta: "75-point Trust Index · {email}",
    paid: "Paid",
    trustIndex: "Trust Index",
    hallucinationRisk: "Hallucination risk",
    riskFlags: "Risk flags",
    noFlags: "No flags raised.",
    summary: "Summary",
    nextStep: "Recommended next step",
    submitAnother: "Submit another order",
    asideHai: "HAI Verify runs the 75-point Trust Index engine.",
    asideXgoma: "XGOMA Inc handles paid intake, Stripe checkout, and report delivery.",
    freeScan: "Free scan?",
    returnVerify: "Return to HAI Verify",
    backLanding: "Back to landing",
    intakeEyebrow: "Secure intake",
    deliveryBadge: "48–72 hr delivery",
    certificateSeal: "HAI-VERIFY-01",
    trustStrip: [
      "75-point Trust Index",
      "Human reviewer assigned",
      "Audit-ready PDF export",
    ],
    enterpriseBadge: "Enterprise",
    foundingStarter: {
      badge: "Founding Customer Special · Limited Time",
      priceNote: "One-time",
      noSub: "No subscription. No commitment.",
      delivery: "Delivered within 48–72 hours — async portal only, no live debrief calls.",
      whatsIncluded: "What's included",
      cta: "Claim your Starter Audit",
      urgency: "Spots strictly limited. Submit within 24 hours to secure your founding slot.",
    },
    offers: {
      starter: {
        title: "Starter Audit",
        subtitle: "Supreme Court–grade verification mark for AI outputs",
        includes: [
          "Up to 50 AI outputs verified (HAI-powered)",
          "Hallucination Risk & Confidence scoring",
          "Policy alignment check (1 Core Domain)",
          "Human reviewer assigned within 24 hours",
          "Exportable audit summary (Warm Korean/English Premium PDF)",
          "HAI-VERIFY-01 compliance certificate issued",
          "Dedicated async feedback via Secure Portal (no live calls)",
        ],
      },
      trust_pilot: {
        title: "Trust Pilot",
        subtitle: "OAuth hybrid shield setup",
        includes: [
          "Full AI interaction audit",
          "HAI Verification report",
          "Human review workflow",
          "Audit-ready summary & dashboard preview",
        ],
      },
    },
  },
  ko: {
    brand: "XGOMA Inc",
    title: "엔터프라이즈 접수 · 주문 및 분석",
    subtitle:
      "HAI 검증을 요청하고 안전한 결제를 완료하면, HAI-VERIFY-01 인증 감사 리포트를 48–72시간 내 받을 수 있어요.",
    selectProduct: "상품 선택",
    contentLabel: "검증할 콘텐츠",
    contentHint: "배포 전에 검증이 필요한 AI 생성 텍스트, 초안, 출력물을 붙여 넣어 주세요.",
    contentPlaceholder: "검증할 콘텐츠를 붙여 넣으세요…",
    emailLabel: "고객 연락 이메일",
    emailPlaceholder: "billing@company.com",
    disclaimer:
      "이 결과는 규칙 기반 1차 스캔이에요. 법·의료·금융처럼 중요한 결정 전에는 반드시 사람 검토를 거쳐 주세요.",
    submit: "주문 및 분석",
    flowHint: "검증 → Stripe 테스트 결제 → 즉시 분석 리포트",
    errContent: "검증할 콘텐츠를 입력해 주세요.",
    errEmail: "유효한 이메일 주소를 입력해 주세요.",
    errVerify: "검증 API에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    errCheckout: "결제 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
    errVerifyFailed: "검증에 실패했어요.",
    errCheckoutFailed: "결제에 실패했어요.",
    loadingMessage: "HAI 검증 실드로 처리 중… 엔터프라이즈 IP를 보호하고 있어요.",
    loadingSub: "HAI 검증 실드 · 엔터프라이즈 IP 보호",
    checkoutTitle: "안전한 결제",
    checkoutStripe: "Stripe · 테스트 모드",
    billingContact: "청구 연락처",
    checkoutMock:
      "모의 거래입니다 — 실제 결제는 없어요. Stripe 테스트 모드 결제 흐름을 시뮬레이션합니다.",
    pay: "결제",
    authorizing: "승인 중…",
    paymentConfirmed: "결제 완료",
    reportTitle: "HAI 검증 리포트",
    reportMeta: "75점 기준 · {email}",
    paid: "결제 완료",
    trustIndex: "신뢰 지수",
    hallucinationRisk: "환각 위험",
    riskFlags: "위험 플래그",
    noFlags: "감지된 플래그 없음",
    summary: "요약",
    nextStep: "추천하는 다음 행동",
    submitAnother: "다른 주문 제출",
    asideHai: "HAI Verify는 75점 신뢰 지수 엔진을 실행해요.",
    asideXgoma: "XGOMA Inc는 유료 접수, Stripe 결제, 리포트 전달을 담당해요.",
    freeScan: "무료 스캔?",
    returnVerify: "HAI Verify로 돌아가기",
    backLanding: "랜딩으로 돌아가기",
    intakeEyebrow: "보안 접수",
    deliveryBadge: "48–72시간 전달",
    certificateSeal: "HAI-VERIFY-01",
    trustStrip: [
      "75점 신뢰 지수",
      "사람 검토자 배정",
      "감사용 PDF 내보내기",
    ],
    enterpriseBadge: "엔터프라이즈",
    foundingStarter: {
      badge: "파운딩 고객 특별 · 한정",
      priceNote: "1회 결제",
      noSub: "구독 없음. 약정 없음.",
      delivery: "48–72시간 내 전달 — 비동기 포털만, 라이브 디브리프 콜 없음.",
      whatsIncluded: "포함 내역",
      cta: "스타터 감사 신청하기",
      urgency: "자리가 엄격히 제한됩니다. 24시간 내 제출로 파운딩 슬롯을 확보하세요.",
    },
    offers: {
      starter: {
        title: "스타터 감사",
        subtitle: "AI 출력물을 위한 대법관급 검증 마크",
        includes: [
          "최대 50개 AI 출력 검증 (HAI 기반)",
          "환각 위험 및 신뢰도 점수",
          "정책 적합성 점검 (핵심 도메인 1개)",
          "24시간 내 사람 검토자 배정",
          "내보낼 수 있는 감사 요약 (따뜻한 한/영 프리미엄 PDF)",
          "HAI-VERIFY-01 컴플라이언스 인증서 발급",
          "전용 비동기 피드백 (보안 포털 — 라이브 콜 없음)",
        ],
      },
      trust_pilot: {
        title: "트러스트 파일럿",
        subtitle: "OAuth 하이브리드 실드 설정",
        includes: [
          "전체 AI 상호작용 감사",
          "HAI 검증 리포트",
          "사람 검토 워크플로",
          "감사용 요약 및 대시보드 미리보기",
        ],
      },
    },
  },
  ja: {
    brand: "XGOMA Inc",
    title: "エンタープライズ受付 · 注文と分析",
    subtitle:
      "HAI検証を依頼し、安全な決済を完了すると、75点Trust Indexエンジンに基づく監査向け分析レポートをすぐ受け取れます。",
    selectProduct: "商品を選択",
    contentLabel: "検証するコンテンツ",
    contentHint: "配布前に検証が必要なAI生成テキスト、下書き、出力を貼り付けてください。",
    contentPlaceholder: "検証するコンテンツを貼り付け…",
    emailLabel: "クライアント連絡先メール",
    emailPlaceholder: "billing@company.com",
    disclaimer:
      "これはルールベースの一次スキャンです。法務・医療・金融など重要な判断の前には必ず人のレビューが必要です。",
    submit: "注文と分析",
    flowHint: "検証 → Stripeテスト決済 → 即時分析レポート",
    errContent: "検証するコンテンツを入力してください。",
    errEmail: "有効なメールアドレスを入力してください。",
    errVerify: "検証APIに接続できませんでした。しばらくして再試行してください。",
    errCheckout: "決済処理に失敗しました。しばらくして再試行してください。",
    errVerifyFailed: "検証に失敗しました。",
    errCheckoutFailed: "決済に失敗しました。",
    loadingMessage: "HAI Verification Shieldで処理中… エンタープライズIPを保護しています。",
    loadingSub: "HAI Verification Shield · エンタープライズIP保護",
    checkoutTitle: "安全な決済",
    checkoutStripe: "Stripe · テストモード",
    billingContact: "請求連絡先",
    checkoutMock:
      "モック取引のみ — 実際の請求はありません。Stripeテストモードの決済フローをシミュレートします。",
    pay: "支払う",
    authorizing: "承認中…",
    paymentConfirmed: "決済完了",
    reportTitle: "HAI検証レポート",
    reportMeta: "75点Trust Index · {email}",
    paid: "支払い済み",
    trustIndex: "Trust Index",
    hallucinationRisk: "幻覚リスク",
    riskFlags: "リスクフラグ",
    noFlags: "検出されたフラグはありません。",
    summary: "概要",
    nextStep: "推奨される次のステップ",
    submitAnother: "別の注文を送信",
    asideHai: "HAI Verifyは75点Trust Indexエンジンを実行します。",
    asideXgoma: "XGOMA Incは有料受付、Stripe決済、レポート配信を担当します。",
    freeScan: "無料スキャン？",
    returnVerify: "HAI Verifyに戻る",
    backLanding: "ランディングに戻る",
    intakeEyebrow: "セキュア受付",
    deliveryBadge: "48–72時間でお届け",
    certificateSeal: "HAI-VERIFY-01",
    trustStrip: [
      "75点Trust Index",
      "人間レビュアー配置",
      "監査用PDFエクスポート",
    ],
    enterpriseBadge: "エンタープライズ",
    foundingStarter: {
      badge: "ファウンディング顧客特別 · 期間限定",
      priceNote: "一回払い",
      noSub: "サブスクなし。縛りなし。",
      delivery: "48–72時間以内にお届け — 非同期ポータルのみ、ライブデブリーフなし。",
      whatsIncluded: "含まれる内容",
      cta: "スターター監査を申し込む",
      urgency: "枠は厳格に限定。24時間以内の申込で枠を確保してください。",
    },
    offers: {
      starter: {
        title: "スターター監査",
        subtitle: "AI出力向け最高水準の検証マーク",
        includes: [
          "最大50件のAI出力を検証（HAI搭載）",
          "幻覚リスクと信頼度スコア",
          "ポリシー適合チェック（コアドメイン1）",
          "24時間以内に人間レビュアー配置",
          "エクスポート可能な監査サマリー（温かい韓/英プレミアムPDF）",
          "HAI-VERIFY-01コンプライアンス証明書発行",
          "専用非同期フィードバック（セキュアポータル — ライブ通話なし）",
        ],
      },
      trust_pilot: {
        title: "トラストパイロット",
        subtitle: "OAuthハイブリッドシールド設定",
        includes: [
          "AI相互作用の完全監査",
          "HAI検証レポート",
          "人間レビューワークフロー",
          "監査向けサマリーとダッシュボードプレビュー",
        ],
      },
    },
  },
  es: {
    brand: "XGOMA Inc",
    title: "Recepción empresarial · Pedir y analizar",
    subtitle:
      "Envíe contenido para verificación HAI, complete el pago seguro y reciba un informe de análisis listo para auditoría — con el motor Trust Index de 75 puntos.",
    selectProduct: "Seleccionar producto",
    contentLabel: "Contenido a verificar",
    contentHint: "Pegue el texto, borrador o salida generada por IA que necesite verificar antes de publicar.",
    contentPlaceholder: "Pegue el contenido para verificación HAI…",
    emailLabel: "Correo de contacto del cliente",
    emailPlaceholder: "billing@company.com",
    disclaimer:
      "Este es un escaneo preliminar basado en reglas. Se requiere revisión humana antes de decisiones legales, médicas, financieras o de alto riesgo.",
    submit: "Pedir y analizar",
    flowHint: "Verificar → pago de prueba Stripe → informe instantáneo",
    errContent: "Introduzca el contenido a verificar.",
    errEmail: "Introduzca un correo válido.",
    errVerify: "No se pudo conectar con la API de verificación. Inténtelo de nuevo.",
    errCheckout: "Error en el procesamiento del pago. Inténtelo de nuevo.",
    errVerifyFailed: "La verificación falló.",
    errCheckoutFailed: "El pago falló.",
    loadingMessage: "Procesando con HAI Verification Shield… Protegiendo su IP empresarial.",
    loadingSub: "HAI Verification Shield · Protección de IP empresarial",
    checkoutTitle: "Pago seguro",
    checkoutStripe: "Stripe · Modo prueba",
    billingContact: "Contacto de facturación",
    checkoutMock:
      "Solo transacción simulada — sin cargos reales. Simula el flujo de pago en modo prueba de Stripe.",
    pay: "Pagar",
    authorizing: "Autorizando…",
    paymentConfirmed: "Pago confirmado",
    reportTitle: "Informe de verificación HAI",
    reportMeta: "Trust Index 75 puntos · {email}",
    paid: "Pagado",
    trustIndex: "Trust Index",
    hallucinationRisk: "Riesgo de alucinación",
    riskFlags: "Indicadores de riesgo",
    noFlags: "No se detectaron indicadores.",
    summary: "Resumen",
    nextStep: "Siguiente paso recomendado",
    submitAnother: "Enviar otro pedido",
    asideHai: "HAI Verify ejecuta el motor Trust Index de 75 puntos.",
    asideXgoma: "XGOMA Inc gestiona la recepción de pago, el pago Stripe y la entrega del informe.",
    freeScan: "¿Escaneo gratuito?",
    returnVerify: "Volver a HAI Verify",
    backLanding: "Volver al inicio",
    intakeEyebrow: "Recepción segura",
    deliveryBadge: "Entrega 48–72 h",
    certificateSeal: "HAI-VERIFY-01",
    trustStrip: [
      "Trust Index 75 puntos",
      "Revisor humano asignado",
      "Exportación PDF para auditoría",
    ],
    enterpriseBadge: "Empresarial",
    foundingStarter: {
      badge: "Oferta fundadores · Tiempo limitado",
      priceNote: "Pago único",
      noSub: "Sin suscripción. Sin compromiso.",
      delivery: "Entrega en 48–72 horas — solo portal asíncrono, sin llamadas de debrief.",
      whatsIncluded: "Qué incluye",
      cta: "Solicitar auditoría inicial",
      urgency: "Plazas estrictamente limitadas. Envíe su pedido en 24 horas para asegurar su plaza.",
    },
    offers: {
      starter: {
        title: "Auditoría inicial",
        subtitle: "Marca de verificación de máximo nivel para salidas IA",
        includes: [
          "Hasta 50 salidas IA verificadas (HAI)",
          "Puntuación de riesgo de alucinación y confianza",
          "Revisión de alineación de políticas (1 dominio core)",
          "Revisor humano asignado en 24 horas",
          "Resumen de auditoría exportable (PDF premium KO/EN)",
          "Certificado de cumplimiento HAI-VERIFY-01",
          "Feedback asíncrono dedicado (portal seguro — sin llamadas)",
        ],
      },
      trust_pilot: {
        title: "Trust Pilot",
        subtitle: "Configuración de escudo híbrido OAuth",
        includes: [
          "Auditoría completa de interacción IA",
          "Informe de verificación HAI",
          "Flujo de revisión humana",
          "Resumen listo para auditoría y vista previa del panel",
        ],
      },
    },
  },
  fr: {
    brand: "XGOMA Inc",
    title: "Réception entreprise · Commander et analyser",
    subtitle:
      "Soumettez du contenu pour vérification HAI, finalisez le paiement sécurisé et recevez un rapport d'analyse prêt pour audit — moteur Trust Index 75 points.",
    selectProduct: "Choisir un produit",
    contentLabel: "Contenu à vérifier",
    contentHint: "Collez le texte, brouillon ou sortie IA à vérifier avant diffusion.",
    contentPlaceholder: "Collez le contenu pour vérification HAI…",
    emailLabel: "E-mail de contact client",
    emailPlaceholder: "billing@company.com",
    disclaimer:
      "Il s'agit d'un scan préliminaire basé sur des règles. Une revue humaine est requise avant toute décision juridique, médicale, financière ou à enjeu élevé.",
    submit: "Commander et analyser",
    flowHint: "Vérifier → paiement test Stripe → rapport instantané",
    errContent: "Saisissez le contenu à vérifier.",
    errEmail: "Saisissez une adresse e-mail valide.",
    errVerify: "Impossible de joindre l'API de vérification. Réessayez.",
    errCheckout: "Échec du traitement du paiement. Réessayez.",
    errVerifyFailed: "La vérification a échoué.",
    errCheckoutFailed: "Le paiement a échoué.",
    loadingMessage: "Traitement avec HAI Verification Shield… Protection de votre PI d'entreprise.",
    loadingSub: "HAI Verification Shield · Protection PI entreprise",
    checkoutTitle: "Paiement sécurisé",
    checkoutStripe: "Stripe · Mode test",
    billingContact: "Contact de facturation",
    checkoutMock:
      "Transaction simulée uniquement — aucun débit réel. Simule le flux Stripe en mode test.",
    pay: "Payer",
    authorizing: "Autorisation…",
    paymentConfirmed: "Paiement confirmé",
    reportTitle: "Rapport de vérification HAI",
    reportMeta: "Trust Index 75 points · {email}",
    paid: "Payé",
    trustIndex: "Trust Index",
    hallucinationRisk: "Risque d'hallucination",
    riskFlags: "Signaux de risque",
    noFlags: "Aucun signal détecté.",
    summary: "Résumé",
    nextStep: "Prochaine étape recommandée",
    submitAnother: "Soumettre une autre commande",
    asideHai: "HAI Verify exécute le moteur Trust Index 75 points.",
    asideXgoma: "XGOMA Inc gère l'accueil payant, le paiement Stripe et la livraison du rapport.",
    freeScan: "Scan gratuit ?",
    returnVerify: "Retour à HAI Verify",
    backLanding: "Retour à l'accueil",
    intakeEyebrow: "Réception sécurisée",
    deliveryBadge: "Livraison 48–72 h",
    certificateSeal: "HAI-VERIFY-01",
    trustStrip: [
      "Trust Index 75 points",
      "Relecteur humain assigné",
      "Export PDF prêt pour audit",
    ],
    enterpriseBadge: "Entreprise",
    foundingStarter: {
      badge: "Offre fondateurs · Durée limitée",
      priceNote: "Paiement unique",
      noSub: "Sans abonnement. Sans engagement.",
      delivery: "Livré sous 48–72 h — portail asynchrone uniquement, pas de debrief en direct.",
      whatsIncluded: "Inclus",
      cta: "Réserver l'audit starter",
      urgency: "Places strictement limitées. Commandez sous 24 h pour sécuriser votre créneau.",
    },
    offers: {
      starter: {
        title: "Audit starter",
        subtitle: "Marque de vérification de plus haut niveau pour sorties IA",
        includes: [
          "Jusqu'à 50 sorties IA vérifiées (HAI)",
          "Score risque d'hallucination et confiance",
          "Contrôle d'alignement politique (1 domaine core)",
          "Relecteur humain assigné sous 24 h",
          "Résumé d'audit exportable (PDF premium KO/EN)",
          "Certificat de conformité HAI-VERIFY-01",
          "Feedback asynchrone dédié (portail sécurisé — sans appels)",
        ],
      },
      trust_pilot: {
        title: "Trust Pilot",
        subtitle: "Configuration bouclier hybride OAuth",
        includes: [
          "Audit complet des interactions IA",
          "Rapport de vérification HAI",
          "Workflow de revue humaine",
          "Résumé prêt pour audit et aperçu du tableau de bord",
        ],
      },
    },
  },
};

export function getOrderCopy(locale: AppLocale): OrderCopy {
  return ORDER_COPY[locale];
}

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}
