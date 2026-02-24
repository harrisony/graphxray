// Centralized domain configuration for Graph X-Ray

export const GRAPH_DOMAINS = {
  STANDARD: [
    "https://graph.microsoft.com",
    "https://graph.microsoft.us",
    "https://dod-graph.microsoft.us",
    "https://microsoftgraph.chinacloudapi.cn",
  ],
  ULTRA_XRAY: [
    "https://main.iam.ad.ext.azure.com",
    "https://elm.iga.azure.com",
    "https://pds.iga.azure.com",
    "https://api.accessreviews.identitygovernance.azure.com",
    "https://management.azure.com",
    "https://admin.microsoft.com",
    "https://portal.office.com",
    "https://security.microsoft.com",
    "https://graph.windows.net",
    "https://api.azrbac.mspim.azure.com",
  ],
};

export const getAllowedDomains = (ultraXRayMode = false): string[] => {
  if (ultraXRayMode) {
    return [...GRAPH_DOMAINS.STANDARD, ...GRAPH_DOMAINS.ULTRA_XRAY];
  }
  return GRAPH_DOMAINS.STANDARD;
};

export const isAllowedDomain = (url: string, ultraXRayMode = false): boolean => {
  const allowedDomains = getAllowedDomains(ultraXRayMode);
  return allowedDomains.some((domain) => url.includes(domain));
};

export const isUltraXRayDomain = (url: string): boolean => {
  return GRAPH_DOMAINS.ULTRA_XRAY.some((domain) => url.includes(domain));
};

export const getAllDomainUrls = (): string[] => {
  const allDomains = [...GRAPH_DOMAINS.STANDARD, ...GRAPH_DOMAINS.ULTRA_XRAY];
  return allDomains.map((domain) => `${domain}/*`);
};

export const parseGraphUrl = (url: string): { path: string; host: string } => {
  let path = url;
  let host = "graph.microsoft.com";

  const allDomains = [...GRAPH_DOMAINS.STANDARD, ...GRAPH_DOMAINS.ULTRA_XRAY];
  for (const domain of allDomains) {
    if (url.includes(domain)) {
      path = url.split(domain)[1];
      host = domain.replace("https://", "");
      break;
    }
  }

  return { path, host };
};
