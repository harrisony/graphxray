// HAR 1.2 type definitions
// https://w3c.github.io/web-performance/specs/HAR/Overview.html

export interface HarFile {
  log: HarLog;
}

export interface HarLog {
  version: string;
  creator: HarCreator;
  entries: HarEntry[];
}

export interface HarCreator {
  name: string;
  version: string;
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  timings: HarTimings;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarHeader[];
  queryString: HarQueryParam[];
  postData?: HarPostData;
  bodySize: number;
  headersSize: number;
}

export interface HarPostData {
  mimeType: string;
  text: string;
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarHeader[];
  content: HarContent;
  bodySize: number;
  headersSize: number;
}

export interface HarContent {
  size: number;
  mimeType: string;
  text?: string;
  encoding?: string;
}

export interface HarHeader {
  name: string;
  value: string;
}

export interface HarQueryParam {
  name: string;
  value: string;
}

export interface HarTimings {
  send: number;
  wait: number;
  receive: number;
}
