import { useState, useCallback, useRef } from "react";
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  Spinner,
} from "@fluentui/react-components";
import { AppHeader } from "./components/AppHeader";
import { HarDropZone } from "./components/HarDropZone";
import { CodeView } from "./components/CodeView";
import { CommandBar, LANGUAGE_OPTIONS } from "./components/CommandBar";
import type { SnippetLanguage } from "./components/CommandBar";
import { parseHarFile } from "./common/har-parser";
import { getCodeViewFromEntry } from "./common/client";
import type { CodeViewData } from "./common/client";
import type { HarFile, HarEntry } from "./types/har";

const CONCURRENCY = 5;

const useStyles = makeStyles({
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground3,
  },
  main: {
    flex: 1,
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  intro: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: "24px",
    boxShadow: tokens.shadow4,
  },
  introTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: "700",
    marginBottom: "8px",
    display: "block",
  },
  introDesc: {
    color: tokens.colorNeutralForeground2,
    marginBottom: "20px",
    display: "block",
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: "16px",
    boxShadow: tokens.shadow4,
  },
  progressWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  entryCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: "16px",
    boxShadow: tokens.shadow4,
  },
  emptyState: {
    textAlign: "center",
    padding: "48px",
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
  },
});

interface ProcessingState {
  total: number;
  done: number;
}

export default function App() {
  const styles = useStyles();
  const [snippetLanguage, setSnippetLanguage] = useState<SnippetLanguage>("powershell");
  const [ultraXRayMode, setUltraXRayMode] = useState<boolean>(
    () => JSON.parse(localStorage.getItem("graphxray-ultraXRayMode") ?? "false") as boolean
  );
  const [harData, setHarData] = useState<HarFile | null>(null);
  const [entries, setEntries] = useState<HarEntry[]>([]);
  const [stack, setStack] = useState<CodeViewData[]>([]);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const processEntries = useCallback(
    async (harEntries: HarEntry[], lang: SnippetLanguage) => {
      if (harEntries.length === 0) {
        setStack([]);
        setProcessing(null);
        return;
      }

      abortRef.current = false;
      setStack([]);
      setProcessing({ total: harEntries.length, done: 0 });

      const results: (CodeViewData | null)[] = new Array(harEntries.length).fill(null);
      let idx = 0;

      const worker = async () => {
        while (idx < harEntries.length && !abortRef.current) {
          const myIdx = idx++;
          const entry = harEntries[myIdx];
          try {
            const view = await getCodeViewFromEntry(lang, entry);
            results[myIdx] = view;
          } catch {
            results[myIdx] = null;
          }
          setProcessing((prev) =>
            prev ? { ...prev, done: prev.done + 1 } : prev
          );
          setStack(results.filter((r): r is CodeViewData => r !== null));
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);
      setProcessing(null);
    },
    []
  );

  const handleHarLoaded = useCallback(
    async (har: HarFile) => {
      setError(null);
      setHarData(har);
      const filtered = parseHarFile(har, ultraXRayMode);
      setEntries(filtered);

      if (filtered.length === 0) {
        setError(
          "No Microsoft Graph API calls found in this HAR file. Try enabling Ultra X-Ray mode to see more API calls."
        );
        setStack([]);
        return;
      }

      await processEntries(filtered, snippetLanguage);
    },
    [ultraXRayMode, snippetLanguage, processEntries]
  );

  const handleLanguageChange = useCallback(
    async (lang: SnippetLanguage) => {
      setSnippetLanguage(lang);
      if (entries.length > 0) {
        await processEntries(entries, lang);
      }
    },
    [entries, processEntries]
  );

  const handleUltraXRayToggle = useCallback(
    async (checked: boolean) => {
      setUltraXRayMode(checked);
      localStorage.setItem("graphxray-ultraXRayMode", JSON.stringify(checked));
      if (harData) {
        const filtered = parseHarFile(harData, checked);
        setEntries(filtered);
        setError(null);
        if (filtered.length === 0) {
          setError("No matching API calls found in this HAR file.");
          setStack([]);
          return;
        }
        await processEntries(filtered, snippetLanguage);
      }
    },
    [harData, snippetLanguage, processEntries]
  );

  const handleSaveScript = useCallback(() => {
    const langOpt = LANGUAGE_OPTIONS.find((o) => o.key === snippetLanguage);
    const ext = langOpt?.fileExt ?? "txt";
    const content = stack
      .filter((r) => r.code)
      .map((r) => r.code)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GraphXRaySession.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [stack, snippetLanguage]);

  const handleClear = useCallback(() => {
    abortRef.current = true;
    setStack([]);
    setEntries([]);
    setHarData(null);
    setProcessing(null);
    setError(null);
  }, []);

  const progressPercent =
    processing ? processing.done / processing.total : 0;

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.layout}>
        <AppHeader />
        <CommandBar
          snippetLanguage={snippetLanguage}
          ultraXRayMode={ultraXRayMode}
          hasEntries={stack.length > 0}
          onLanguageChange={handleLanguageChange}
          onUltraXRayToggle={handleUltraXRayToggle}
          onSaveScript={handleSaveScript}
          onClear={handleClear}
        />

        <main className={styles.main}>
          {/* Intro / drop zone */}
          {!harData && (
            <div className={styles.intro}>
              <Text className={styles.introTitle}>Microsoft Graph X-Ray</Text>
              <Text className={styles.introDesc}>
                Drop a HAR file exported from browser DevTools to generate code snippets for
                every Microsoft Graph API call it contains.
              </Text>
              <HarDropZone onHarLoaded={handleHarLoaded} />
            </div>
          )}

          {/* Error */}
          {error && (
            <MessageBar intent="warning">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}

          {/* Progress */}
          {processing && (
            <div className={mergeClasses(styles.card, styles.progressWrap)}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Spinner size="tiny" />
                <Text>
                  Generating snippets… {processing.done} / {processing.total}
                </Text>
              </div>
              <ProgressBar value={progressPercent} />
            </div>
          )}

          {/* Replace HAR */}
          {harData && !processing && (
            <div className={styles.card}>
              <HarDropZone onHarLoaded={handleHarLoaded} />
            </div>
          )}

          {/* Results */}
          {stack.length > 0 && (
            <div className={styles.stack}>
              {stack.map((request, i) => (
                <div key={i} className={styles.entryCard}>
                  <CodeView request={request} snippetLanguage={snippetLanguage} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state after load */}
          {harData && !processing && stack.length === 0 && !error && (
            <div className={styles.emptyState}>
              <Text>No code snippets to display.</Text>
            </div>
          )}
        </main>
      </div>
    </FluentProvider>
  );
}

