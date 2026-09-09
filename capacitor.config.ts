import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "hr.blago.game",
  appName: "BLAGO",
  webDir: "apk-www",
  backgroundColor: "#2B1814",
  android: {
    allowMixedContent: true,
    backgroundColor: "#2B1814",
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#2B1814",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#2B1814",
    },
  },
};

export default config;
