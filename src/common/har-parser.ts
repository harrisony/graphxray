import type { HarEntry, HarFile } from "../types/har";
import { isAllowedDomain } from "./domains";

export const parseHarFile = (har: HarFile, ultraXRayMode: boolean): HarEntry[] => {
  const entries = har.log?.entries ?? [];

  return entries
    .filter(
      (entry) =>
        entry.request?.url &&
        isAllowedDomain(entry.request.url, ultraXRayMode) &&
        entry.request.method !== "OPTIONS"
    )
    .sort(
      (a, b) =>
        new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime()
    );
};

export const validateHar = (data: unknown): data is HarFile => {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.log !== "object" || d.log === null) return false;
  const log = d.log as Record<string, unknown>;
  return Array.isArray(log.entries);
};
