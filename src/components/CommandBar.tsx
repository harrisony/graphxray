import {
  makeStyles,
  tokens,
  Button,
  Select,
  Switch,
  Tooltip,
  Text,
  Label,
} from "@fluentui/react-components";
import {
  ArrowDownloadRegular,
  DeleteRegular,
  InfoRegular,
} from "@fluentui/react-icons";

export const LANGUAGE_OPTIONS = [
  { key: "powershell", text: "PowerShell", fileExt: "ps1" },
  { key: "python", text: "Python", fileExt: "py" },
  { key: "c#", text: "C#", fileExt: "cs" },
  { key: "javascript", text: "JavaScript", fileExt: "js" },
  { key: "java", text: "Java", fileExt: "java" },
  { key: "objective-c", text: "Objective-C", fileExt: "c" },
  { key: "go", text: "Go", fileExt: "go" },
] as const;

export type SnippetLanguage = (typeof LANGUAGE_OPTIONS)[number]["key"];

interface CommandBarProps {
  snippetLanguage: SnippetLanguage;
  ultraXRayMode: boolean;
  hasEntries: boolean;
  onLanguageChange: (lang: SnippetLanguage) => void;
  onUltraXRayToggle: (checked: boolean) => void;
  onSaveScript: () => void;
  onClear: () => void;
}

const useStyles = makeStyles({
  bar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "8px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexWrap: "wrap",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  group: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  ultraInfo: {
    color: tokens.colorNeutralForeground3,
    fontSize: "18px",
  },
  spacer: {
    flex: 1,
  },
});

export const CommandBar = ({
  snippetLanguage,
  ultraXRayMode,
  hasEntries,
  onLanguageChange,
  onUltraXRayToggle,
  onSaveScript,
  onClear,
}: CommandBarProps) => {
  const styles = useStyles();

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <Label htmlFor="lang-select">Language</Label>
        <Select
          id="lang-select"
          value={snippetLanguage}
          onChange={(_, data) => onLanguageChange(data.value as SnippetLanguage)}
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.text}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.group}>
        <Switch
          checked={ultraXRayMode}
          onChange={(_, data) => onUltraXRayToggle(data.checked)}
          label="Ultra X-Ray"
        />
        <Tooltip
          content={
            <Text>
              Enables Ultra X-Ray mode which shows API calls to undocumented internal Microsoft
              endpoints. For educational purposes only — these endpoints are not supported for
              production use.
            </Text>
          }
          relationship="description"
        >
          <InfoRegular className={styles.ultraInfo} />
        </Tooltip>
      </div>

      <div className={styles.spacer} />

      <div className={styles.group}>
        <Button
          appearance="secondary"
          icon={<ArrowDownloadRegular />}
          disabled={!hasEntries}
          onClick={onSaveScript}
        >
          Save script
        </Button>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          disabled={!hasEntries}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
