export function buildScoreOnlyReply(result) {
  const trustIndex = Number(result?.trustIndex);
  if (!Number.isFinite(trustIndex)) {
    throw new Error("Verification result is missing trustIndex");
  }

  return `Trust Index: **${Math.round(trustIndex)}** / 100`;
}
