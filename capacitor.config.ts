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
    // 0.9.178: svijetle ikone na tamnim trakama i kad je telefon u svijetloj temi
    SystemBars: {
      style: "DARK",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#2B1814",
      overlaysWebView: false,
    },
  },
};

export default config;
