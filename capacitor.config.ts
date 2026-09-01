import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "hr.blago.game",
  appName: "BLAGO",
  webDir: "apk-www",
  backgroundColor: "#1A4A46",
  android: {
    allowMixedContent: true,
    backgroundColor: "#1A4A46",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#1A4A46",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1A4A46",
    },
  },
};

export default config;
