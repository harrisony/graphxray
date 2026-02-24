import { parseGraphUrl, isUltraXRayDomain } from "./domains";
import type { HarEntry } from "../types/har";

const devxEndPoint =
  "https://devxapi-func-prod-eastus.azurewebsites.net/api/graphexplorersnippets";

export interface BatchCodeSnippet {
  id: string;
  method: string;
  url: string;
  code: string;
}

export interface CodeViewData {
  displayRequestUrl: string;
  requestBody: string;
  responseContent: string;
  code: string | null;
  batchCodeSnippets: BatchCodeSnippet[];
}

const getPowershellCmd = async (
  snippetLanguage: string,
  method: string,
  url: string,
  body: string
): Promise<string | null> => {
  if (isUltraXRayDomain(url)) {
    return null;
  }

  const bodyText = body ?? "";
  const { path: parsedPath, host } = parseGraphUrl(url);
  const path = encodeURI(parsedPath);
  const payload = `${method} ${path} HTTP/1.1\r\nHost: ${host}\r\nContent-Type: application/json\r\n\r\n${bodyText}`;

  const snippetParam = `?lang=${snippetLanguage}`;
  const openApiParam = "&generation=openapi";

  let devxSnippetUri = devxEndPoint;
  if (["javascript", "java", "objective-c"].includes(snippetLanguage)) {
    devxSnippetUri = devxEndPoint + snippetParam;
  } else if (["go", "powershell", "python"].includes(snippetLanguage)) {
    devxSnippetUri = devxEndPoint + snippetParam + openApiParam;
  }

  try {
    const response = await fetch(devxSnippetUri, {
      headers: { "content-type": "application/http" },
      method: "POST",
      body: payload,
    });
    if (response.ok) {
      return response.text();
    } else {
      const errorText = await response.text();
      console.error(
        `DevXError: ${response.status} ${response.statusText} for ${method} ${url} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error(`DevXError: Network error for ${method} ${url}`, error);
    return null;
  }
};

const getRequestBodyFromEntry = (entry: HarEntry): string => {
  return entry.request.postData?.text ?? "";
};

const getResponseContentFromEntry = (entry: HarEntry): string => {
  const content = entry.response.content;
  if (!content?.text) return "";

  if (content.encoding === "base64") {
    try {
      return atob(content.text);
    } catch {
      return content.text;
    }
  }
  return content.text;
};

const getBatchCodeSnippets = async (
  snippetLanguage: string,
  requestBody: string,
  baseUrl: string
): Promise<BatchCodeSnippet[]> => {
  if (!requestBody) return [];

  let batchData: { requests?: Array<{ id: string; method: string; url: string; body?: unknown }> };
  try {
    batchData = JSON.parse(requestBody);
  } catch {
    return [];
  }

  if (!batchData.requests) return [];

  const results: BatchCodeSnippet[] = [];
  for (const req of batchData.requests) {
    const fullUrl = `${baseUrl}${req.url}`;
    const reqBody = req.body ? JSON.stringify(req.body) : "";
    const code = await getPowershellCmd(snippetLanguage, req.method, fullUrl, reqBody);
    if (code) {
      results.push({ id: req.id, method: req.method, url: req.url, code });
    }
  }
  return results;
};

export const getCodeViewFromEntry = async (
  snippetLanguage: string,
  entry: HarEntry
): Promise<CodeViewData | null> => {
  if (entry.request.method === "OPTIONS") return null;

  const requestBody = getRequestBodyFromEntry(entry);
  const responseContent = getResponseContentFromEntry(entry);
  const { url, method } = entry.request;

  let code: string | null = null;
  let batchCodeSnippets: BatchCodeSnippet[] = [];

  if (url.includes("/$batch")) {
    const baseUrl = url.split("/$batch")[0];
    batchCodeSnippets = await getBatchCodeSnippets(snippetLanguage, requestBody, baseUrl);
    code = await getPowershellCmd(snippetLanguage, method, url, requestBody);
  } else {
    code = await getPowershellCmd(snippetLanguage, method, url, requestBody);
  }

  return {
    displayRequestUrl: `${method} ${url}`,
    requestBody,
    responseContent,
    code,
    batchCodeSnippets,
  };
};
