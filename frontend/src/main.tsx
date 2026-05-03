import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, App, theme as antdTheme } from "antd";
import AppRoot from "./App";

import { ThemeProvider, useTheme } from "./lib/theme";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ThemedApp() {
  const { dark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#2563EB",
          colorBgBase: dark ? "#0F172A" : "#FFFFFF",
          colorBgContainer: dark ? "#1E293B" : "#FFFFFF",
          colorBgElevated: dark ? "#1E293B" : "#F8FAFC",
          colorBgLayout: dark ? "#0A0F1E" : "#F1F5F9",
          colorText: dark ? "#F1F5F9" : "#0F172A",
          colorTextSecondary: dark ? "#94A3B8" : "#64748B",
          colorBorder: dark ? "#334155" : "#E2E8F0",
          colorBorderSecondary: dark ? "#1E293B" : "#F1F5F9",
          borderRadius: 8,
          borderRadiusLG: 10,
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontSize: 14,
          colorSuccess: "#10B981",
          colorWarning: "#F59E0B",
          colorError: "#EF4444",
          colorInfo: "#2563EB",
        },
        components: {
          Layout: {
            siderBg: dark ? "#0F172A" : "#FFFFFF",
            headerBg: dark ? "#0F172A" : "#FFFFFF",
            bodyBg: dark ? "#0A0F1E" : "#F1F5F9",
          },
          Menu: {
            itemBg: "transparent",
            itemColor: dark ? "#94A3B8" : "#64748B",
            itemHoverColor: "#2563EB",
            itemHoverBg: dark ? "#1E293B" : "#EFF6FF",
            itemSelectedColor: "#2563EB",
            itemSelectedBg: dark ? "#1E3A5F" : "#EFF6FF",
          },
          Table: {
            headerBg: dark ? "#1E293B" : "#F8FAFC",
            headerColor: dark ? "#94A3B8" : "#64748B",
            borderColor: dark ? "#334155" : "#E2E8F0",
            fontSize: 13,
          },
          Card: {
            colorBgContainer: dark ? "#0F172A" : "#FFFFFF",
            borderRadiusLG: 12,
          },
          Button: { borderRadius: 8, fontWeight: 500 },
          Input: { borderRadius: 10 },
          Select: { borderRadius: 10 },
          Modal: {
            contentBg: dark ? "#0F172A" : "#FFFFFF",
            headerBg: dark ? "#0F172A" : "#FFFFFF",
          },
        },
      }}
    >
      <App>
        <AppRoot />
      </App>
    </ConfigProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
