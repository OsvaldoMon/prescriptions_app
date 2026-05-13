export function resolveCorsOrigins(frontendUrl?: string): string[] | true {
  if (!frontendUrl) {
    return true;
  }

  const origins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}
