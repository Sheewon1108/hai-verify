$questions = @(
  @{ who = "Growth Loops"; q = "Hai-Ic를 우리 multi-agent 파이프라인에 붙이면 Grok 대신 Claude도 같이 쓸 수 있나요?" },
  @{ who = "Growth Loops"; q = "연간 라이선스 $15k면 ROI가 언제 나오나요? 우리 월 50만 API call 기준으로요." },
  @{ who = "instinctools"; q = "Hai-Ic SDK를 React + Node 스택에 2주 안에 통합 가능한가요?" },
  @{ who = "instinctools"; q = "데모 봤는데 괜찮아 보이는데, 실제 고객사 레퍼런스가 있나요?" },
  @{ who = "Closeloop"; q = "Hai-Ic를 우리 자동화 워크플로우 첫 단계로 넣으면 latency 얼마나 늘어나요?" },
  @{ who = "Closeloop"; q = "좋을 것 같은데 어떻게 시작하면 될까요?" },
  @{ who = "Google DD"; q = "Gemini API 앞단에 Hai-Ic를 붙였을 때 hallucination rate before/after 수치가 있나요?" },
  @{ who = "Google DD"; q = "Google Cloud Marketplace 등록 가능하고 SLA 99.9% 보장되나요?" },
  @{ who = "Google DD"; q = "training data contamination이나 bias audit 리포트를 제공하나요?" },
  @{ who = "Google DD"; q = "Hai-Ic IP ownership은 누구에게 있고 Google이 modify 가능한가요?" },
  @{ who = "Google enterprise"; q = "Google Workspace 팀이 쓸 AI gate로 Hai-Ic 도입 시 GDPR·SOC2 컴플라이언스는?" },
  @{ who = "Google enterprise"; q = "3개월 pilot 비용과 exit 조건은 어떻게 되나요?" },
  @{ who = "vague buyer"; q = "Hai-Ic 좋아 보이는데 어떻게 쓰면 좋을까요?" },
  @{ who = "specific buyer"; q = "Growth Loops에 Hai-Ic 레이어를 2026년 9월까지 PoC로 $12k 예산에 붙이고 싶습니다." }
)

$results = @()
foreach ($item in $questions) {
  $body = @{ input = $item.q } | ConvertTo-Json -Compress
  $r = Invoke-RestMethod http://localhost:3001/api/hai-ic/analyze -Method POST -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 15
  $results += [PSCustomObject]@{
    Buyer = $item.who
    IC = "$($r.confidence)%"
    Mode = if ($r.sincereMode) { "ON" } else { "OFF" }
    DD = $r.isDueDiligence
    Question = $item.q
  }
}
$results | Format-Table -AutoSize -Wrap