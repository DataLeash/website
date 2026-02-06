// Utility to get the base path for assets
// Works both locally (no prefix) and on GitHub Pages (/website prefix)
export function getBasePath(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname.startsWith('/website') ? '/website' : ''
}

export function assetPath(path: string): string {
  return `${getBasePath()}${path}`
}
