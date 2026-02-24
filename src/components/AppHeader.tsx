import {
  makeStyles,
  tokens,
  Text,
  Image,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: tokens.colorBrandBackground2Pressed,
    height: "50px",
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  title: {
    color: tokens.colorNeutralForegroundInverted,
    fontWeight: "600",
    fontSize: tokens.fontSizeBase400,
  },
});

export const AppHeader = () => {
  const styles = useStyles();
  return (
    <div className={styles.header}>
      <Image src="/graphxray/img/icon-16.svg" alt="logo" height={22} width={22} />
      <Text className={styles.title}>Microsoft Graph X-Ray</Text>
    </div>
  );
};
