import { useState, useCallback } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  mergeClasses,
} from "@fluentui/react-components";
import { ArrowUploadRegular, DocumentRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import type { HarFile } from "../types/har";
import { validateHar } from "../common/har-parser";

interface HarDropZoneProps {
  onHarLoaded: (har: HarFile) => void;
}

const useStyles = makeStyles({
  zone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    padding: "48px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    backgroundColor: tokens.colorNeutralBackground2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  zoneDragOver: {
    border: `2px dashed ${tokens.colorBrandForeground1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  zoneError: {
    border: `2px dashed ${tokens.colorStatusDangerBorder1}`,
    backgroundColor: tokens.colorStatusDangerBackground1,
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground3,
  },
  errorIcon: {
    fontSize: "48px",
    color: tokens.colorStatusDangerForeground1,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
});

export const HarDropZone = ({ onHarLoaded }: HarDropZoneProps) => {
  const styles = useStyles();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".har") && !file.name.endsWith(".json")) {
        setError("Please drop a .har or .json file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (!validateHar(data)) {
            setError("Invalid HAR file: missing log.entries.");
            return;
          }
          onHarLoaded(data);
        } catch {
          setError("Failed to parse file as JSON.");
        }
      };
      reader.readAsText(file);
    },
    [onHarLoaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [processFile]
  );

  const zoneClass = mergeClasses(
    styles.zone,
    isDragOver && styles.zoneDragOver,
    error ? styles.zoneError : undefined
  );

  return (
    <div
      className={zoneClass}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      {error ? (
        <>
          <ErrorCircleRegular className={styles.errorIcon} />
          <Text className={styles.errorText}>{error}</Text>
          <Text className={styles.hint}>Try again with a valid HAR file.</Text>
        </>
      ) : (
        <>
          {isDragOver ? (
            <DocumentRegular className={styles.icon} />
          ) : (
            <ArrowUploadRegular className={styles.icon} />
          )}
          <Text weight="semibold">Drop your HAR file here</Text>
          <Text className={styles.hint}>
            Export from browser DevTools → Network → Save all as HAR
          </Text>
        </>
      )}
      <label>
        <Button appearance="primary" icon={<ArrowUploadRegular />}>
          Browse file
        </Button>
        <input
          type="file"
          accept=".har,.json"
          style={{ display: "none" }}
          onChange={onFileInput}
        />
      </label>
    </div>
  );
};
