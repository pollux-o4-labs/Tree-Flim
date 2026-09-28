export const portfolioViewports = [
  { id: "V-001", width: 320, height: 700 },
  { id: "V-002", width: 342, height: 462 },
  { id: "V-003", width: 390, height: 844 },
  { id: "V-004", width: 430, height: 932 },
  { id: "V-005", width: 471, height: 631 },
  { id: "V-006", width: 613, height: 446 },
  { id: "V-007", width: 768, height: 1024 },
  { id: "V-008", width: 1024, height: 768 },
  { id: "V-009", width: 1280, height: 800 },
  { id: "V-010", width: 1536, height: 864 },
] as const;

export type PortfolioViewport = (typeof portfolioViewports)[number];
export const portfolioMobileMaxWidth = portfolioViewports[4].width;

export function isPortfolioMobileViewport(width = window.innerWidth) {
  return width <= portfolioMobileMaxWidth;
}
