import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, Badge, Tooltip, App, Typography } from "antd";
import { Link, useLocation } from "wouter";
import {
  DashboardOutlined,
  SecurityScanOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
  ExclamationCircleOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { useAuth, parseTokenPayload } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { useLive } from "../../lib/live-context";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    key: "/attacks",
    icon: <SecurityScanOutlined />,
    label: "Threat Logs",
    href: "/attacks",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
    href: "/settings",
  },
];

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { logout, token } = useAuth();
  const { dark, toggle } = useTheme();
  const { liveCount } = useLive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);
  const { modal } = App.useApp();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // BUG FIX: token ni to'g'ri parse qilish — oldin butun token ni base64 decode qilardi
  // Yangi format: payloadBase64url.signature → faqat birinchi qismni decode qilamiz
  const username = token
    ? (parseTokenPayload(token)?.username ?? "Admin")
    : "Admin";

  const handleLogoutClick = () => {
    modal.confirm({
      title: "Shıǵıw",
      icon: <ExclamationCircleOutlined style={{ color: "#EF4444" }} />,
      content: "Sistemadan shıqpaqshısız ba?",
      okText: "Shıǵıw",
      cancelText: "Bekor qiliw",
      okButtonProps: { danger: true },
      onOk() {
        logout();
        setLocation("/");
      },
    });
  };

  const activeKey =
    NAV_ITEMS.find((i) => location.startsWith(i.key))?.key ?? "/dashboard";

  // Rang o'zgaruvchilari
  const siderBg = dark ? "#0F172A" : "#FFFFFF";
  const siderBorder = dark ? "#1E293B" : "#E8EDF3";
  const labelColor = dark ? "#F1F5F9" : "#0F172A";
  const subColor = dark ? "#64748B" : "#94A3B8";
  const layoutBg = dark ? "#070B14" : "#F0F4FA";
  const headerBg = dark ? "#0F172A" : "#FFFFFF";
  const hoverBg = dark ? "#1E293B" : "#F5F7FA";

  const siderContent = (onClose?: () => void) => (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <div
        style={{
          padding: "18px 16px 12px",
          borderBottom: `1px solid ${siderBorder}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              flexShrink: 0,
              background: "linear-gradient(135deg,#2563EB 0%,#1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
            }}
          >
            <SafetyOutlined style={{ color: "#fff", fontSize: 18 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: labelColor,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              ADAF
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#2563EB",
                fontWeight: 700,
                letterSpacing: "0.14em",
              }}
            >
              AI FIREWALL
            </div>
          </div>
          <Tooltip title={dark ? "Light mode" : "Dark mode"}>
            <div
              onClick={toggle}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: `1px solid ${siderBorder}`,
                background: dark ? "#1E293B" : "#F0F4FA",
                color: dark ? "#F59E0B" : "#64748B",
                fontSize: 14,
                transition: "all 0.2s",
              }}
            >
              {dark ? <SunOutlined /> : <MoonOutlined />}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Live indicator */}
      {liveCount > 0 && (
        <div
          style={{
            margin: "10px 12px 0",
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#EF4444",
              display: "inline-block",
              boxShadow: "0 0 6px #EF4444",
              animation: "pulse 1s infinite",
            }}
          />
          <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}>
            {liveCount} jańa hújim
          </span>
        </div>
      )}

      {/* Nav label */}
      <div style={{ padding: "14px 20px 6px", flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#475569",
            letterSpacing: "0.12em",
          }}
        >
          MONITORING
        </span>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          inlineIndent={14}
          style={{ border: "none", background: "transparent" }}
          items={NAV_ITEMS.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: (
              <Link href={item.href} onClick={() => onClose?.()}>
                {item.label}
              </Link>
            ),
          }))}
        />
      </div>

      {/* User + Logout */}
      <div
        style={{
          padding: "12px",
          borderTop: `1px solid ${siderBorder}`,
          flexShrink: 0,
        }}
      >
        <div
          onClick={handleLogoutClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.background = hoverBg)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.background =
              "transparent")
          }
        >
          <Avatar
            size={34}
            style={{
              background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: labelColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {username}
            </div>
            <div style={{ fontSize: 11, color: subColor }}>
              Security Analyst
            </div>
          </div>
          <Tooltip title="Chiqish">
            <LogoutOutlined style={{ color: "#EF4444", fontSize: 14 }} />
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: layoutBg }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sider
          width={220}
          style={{
            background: siderBg,
            borderRight: `1px solid ${siderBorder}`,
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {siderContent()}
        </Sider>
      )}

      {/* Mobile overlay */}
      {isMobile && drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 200,
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              width: 220,
              background: siderBg,
              borderRight: `1px solid ${siderBorder}`,
              zIndex: 201,
              overflow: "hidden",
            }}
          >
            {siderContent(() => setDrawerOpen(false))}
          </div>
        </>
      )}

      {/* Main */}
      <Layout style={{ marginLeft: isMobile ? 0 : 220, background: layoutBg }}>
        <Header
          style={{
            background: headerBg,
            borderBottom: `1px solid ${siderBorder}`,
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 58,
            lineHeight: "58px",
            position: "sticky",
            top: 0,
            zIndex: 99,
            boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <div
                onClick={() => setDrawerOpen(true)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: dark ? "#1E293B" : "#F0F4FA",
                  border: `1px solid ${siderBorder}`,
                  color: labelColor,
                  fontSize: 15,
                }}
              >
                <MenuOutlined />
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 15, color: labelColor }}>
              {NAV_ITEMS.find((i) => i.key === activeKey)?.label ?? "Dashboard"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live badge */}
            {liveCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  background: "rgba(239,68,68,0.08)",
                  borderRadius: 20,
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#EF4444",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}
                >
                  {liveCount} LIVE
                </span>
              </div>
            )}
            {/* Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: "30px",
                padding: "4px 12px",
                background: dark ? "rgba(16,185,129,0.08)" : "#F0FDF4",
                borderRadius: 20,
                border: `1px solid ${dark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`,
              }}
            >
              <Badge status="success" />
              <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
                Operational
              </span>
            </div>
          </div>
        </Header>

        <Content
          style={{
            padding: isMobile ? 14 : 22,
            minHeight: "calc(100vh - 58px)",
          }}
        >
          {children}
        </Content>
      </Layout>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </Layout>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <App>
      <AppLayoutInner>{children}</AppLayoutInner>
    </App>
  );
}
