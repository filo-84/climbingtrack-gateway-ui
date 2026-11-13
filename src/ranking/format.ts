export function formatScore(score: number): string {
  if (Number.isInteger(score)) {
    return String(score)
  }
  return score.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}
