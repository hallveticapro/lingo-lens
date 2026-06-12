export function isLocalMediaUrl(url: string) {
  return url.startsWith("/media/");
}

export function shouldBypassImageOptimization(url: string) {
  return !url.startsWith("/") || isLocalMediaUrl(url);
}
