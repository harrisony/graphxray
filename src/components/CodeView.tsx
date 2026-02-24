import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import {
  ChevronRightRegular,
  ChevronDownRegular,
  CopyRegular,
} from "@fluentui/react-icons";
import type { CodeViewData } from "../common/client";

interface CodeViewProps {
  request: CodeViewData;
  snippetLanguage: string;
}

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  urlRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "4px",
  },
  syntaxWrap: {
    position: "relative",
    flex: 1,
  },
  copyBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    minWidth: "32px",
  },
  expandSection: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: "12px",
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionLabel: {
    fontWeight: "600",
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginBottom: "4px",
    display: "block",
  },
  batchPair: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  batchPairLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: "600",
  },
});

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
};

const formatJson = (content: string): string => {
  try {
    return JSON.stringify(JSON.parse(content.trim()), null, 2);
  } catch {
    return content;
  }
};

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const styles = useStyles();
  return (
    <Tooltip content={label} relationship="label">
      <Button
        className={styles.copyBtn}
        appearance="subtle"
        size="small"
        icon={<CopyRegular />}
        onClick={() => copyToClipboard(text)}
      />
    </Tooltip>
  );
};

const CodeBlock = ({
  code,
  language,
  label,
}: {
  code: string;
  language: string;
  label: string;
}) => {
  const styles = useStyles();
  return (
    <div className={styles.syntaxWrap}>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        wrapLongLines
        customStyle={{ borderRadius: "8px", padding: "12px", paddingRight: "50px", margin: 0 }}
      >
        {code}
      </SyntaxHighlighter>
      <CopyButton text={code} label={label} />
    </div>
  );
};

export const CodeView = ({ request, snippetLanguage }: CodeViewProps) => {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  const hasBody =
    (request.requestBody && request.requestBody.length > 0) ||
    (request.responseContent && request.responseContent.length > 0);

  const isBatch =
    request.displayRequestUrl.includes("/$batch") &&
    (() => {
      try {
        const req = JSON.parse(request.requestBody);
        const resp = request.responseContent ? JSON.parse(request.responseContent) : null;
        return !!(req?.requests && resp?.responses);
      } catch {
        return false;
      }
    })();

  const batchPairs = isBatch
    ? (() => {
        try {
          const req = JSON.parse(request.requestBody);
          const resp = JSON.parse(request.responseContent);
          const responseMap = new Map(
            (resp.responses as Array<{ id: string; status: number; body?: unknown }>).map(
              (r) => [r.id, r]
            )
          );
          return (
            req.requests as Array<{ id: string; method: string; url: string; body?: unknown }>
          ).map((r) => ({
            id: r.id,
            request: r,
            response: responseMap.get(r.id),
          }));
        } catch {
          return [];
        }
      })()
    : [];

  return (
    <div className={styles.root}>
      {/* URL row */}
      <div className={styles.urlRow}>
        {hasBody && (
          <Button
            appearance="subtle"
            size="small"
            icon={expanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
            onClick={() => setExpanded(!expanded)}
          />
        )}
        <div className={styles.syntaxWrap}>
          <SyntaxHighlighter
            language="jboss-cli"
            style={atomOneDark}
            wrapLongLines
            customStyle={{ borderRadius: "8px", padding: "12px", paddingRight: "50px", margin: 0 }}
          >
            {request.displayRequestUrl}
          </SyntaxHighlighter>
          <CopyButton text={request.displayRequestUrl} label="Copy URL" />
        </div>
      </div>

      {/* Expanded request/response */}
      {expanded && hasBody && (
        <div className={styles.expandSection}>
          {isBatch ? (
            <>
              <Text weight="semibold">Batch Request/Response Pairs</Text>
              {batchPairs.map((pair) => (
                <div key={pair.id} className={styles.batchPair}>
                  <Text className={styles.batchPairLabel}>
                    ID: {pair.id} — {pair.request.method} {pair.request.url}
                  </Text>
                  <div>
                    <Text as="span" className={styles.sectionLabel}>
                      Request
                    </Text>
                    <CodeBlock
                      code={JSON.stringify(pair.request, null, 2)}
                      language="json"
                      label="Copy request"
                    />
                  </div>
                  {pair.response && (
                    <div>
                      <Text as="span" className={styles.sectionLabel}>
                        Response (Status: {pair.response.status})
                      </Text>
                      <CodeBlock
                        code={JSON.stringify(pair.response.body ?? pair.response, null, 2)}
                        language="json"
                        label="Copy response"
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              {request.requestBody && request.requestBody.length > 0 && (
                <div>
                  <Text as="span" className={styles.sectionLabel}>
                    Request
                  </Text>
                  <CodeBlock
                    code={formatJson(request.requestBody)}
                    language="json"
                    label="Copy request body"
                  />
                </div>
              )}
              {request.responseContent && request.responseContent.length > 0 && (
                <div>
                  <Text as="span" className={styles.sectionLabel}>
                    Response
                  </Text>
                  <CodeBlock
                    code={formatJson(request.responseContent)}
                    language="json"
                    label="Copy response"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Main code snippet */}
      {request.code && request.code.length > 0 && (
        <CodeBlock code={request.code} language={snippetLanguage} label="Copy code snippet" />
      )}

      {/* Batch individual snippets */}
      {request.batchCodeSnippets && request.batchCodeSnippets.length > 0 && (
        <div className={styles.expandSection}>
          <Text weight="semibold">Individual Request Code Snippets</Text>
          {request.batchCodeSnippets.map((snippet) => (
            <div key={snippet.id}>
              <Text as="span" className={styles.sectionLabel}>
                {snippet.id} — {snippet.method} {snippet.url}
              </Text>
              <CodeBlock code={snippet.code} language={snippetLanguage} label="Copy snippet" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
