/**
 * NexaCore Financial — Minimal Dashboard
 *
 * Yangi minimalistik dizayn:
 * - Tinch oq fon, yumshoq kulrang chegaralar
 * - Linear / Vercel / Stripe uslubidagi real dashboard ko'rinishi
 * - Funksionallik va fake ma'lumotlar saqlangan
 * - Jonli tranzaksiyalar, log, sessiyalar — barchasi ishlaydi
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Menu,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Badge,
  Typography,
  Tooltip,
  Modal,
  Descriptions,
  Progress,
  App,
} from "antd";
import {
  CreditCardOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SafetyOutlined,
  DollarOutlined,
  TeamOutlined,
  EyeOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  SyncOutlined,
  MonitorOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuth } from "../lib/auth";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import fakeData from "../data/fake-data.json";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

const { Sider, Content, Header } = Layout;
const { Text, Title } = Typography;

// ─── Theme tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FAFAFA",
  panel: "#FFFFFF",
  border: "#EAEAEA",
  borderSoft: "#F1F1F1",
  text: "#0A0A0A",
  textMuted: "#6B7280",
  textSubtle: "#9CA3AF",
  accent: "#0A0A0A",
  green: "#16A34A",
  red: "#DC2626",
  amber: "#D97706",
  blue: "#2563EB",
};

// ─── Live transaction generator ──────────────────────────────────────────────
const LIVE_TXN_TEMPLATES = [
  {
    from: "Hartwell M.",
    to: "JPMorgan Chase",
    min: 50000,
    max: 500000,
    cat: "Wire Transfer",
    flag: false,
  },
  {
    from: "NexaCore Treasury",
    to: "Federal Reserve",
    min: 1000000,
    max: 5000000,
    cat: "Settlement",
    flag: false,
  },
  {
    from: "Okonkwo T.",
    to: "Goldman Sachs",
    min: 200000,
    max: 800000,
    cat: "Investment",
    flag: false,
  },
  {
    from: "Moreau D.",
    to: "Unverified Offshore LLC",
    min: 80000,
    max: 420000,
    cat: "Wire Transfer",
    flag: true,
  },
  {
    from: "NexaCore Payroll",
    to: "Employee Direct Deposit",
    min: 3000,
    max: 15000,
    cat: "Payroll",
    flag: false,
  },
  {
    from: "IT Operations",
    to: "Azure Cloud Services",
    min: 8000,
    max: 45000,
    cat: "Infrastructure",
    flag: false,
  },
  {
    from: "Steinberg R.",
    to: "Anonymous BVI Entity",
    min: 150000,
    max: 950000,
    cat: "Wire Transfer",
    flag: true,
  },
  {
    from: "Legal Dept.",
    to: "Kirkland & Ellis LLP",
    min: 25000,
    max: 180000,
    cat: "Legal",
    flag: false,
  },
];

const LOG_TEMPLATES = [
  "User m.hartwell accessed SWIFT transfer module",
  "Scheduled backup completed: db_nexacore_prod (847 GB)",
  "MFA challenge issued to r.steinberg from 104.28.92.11",
  "API rate limit warning: /api/v3/accounts (890 req/min)",
  "Compliance report generated: Q1-2026-FINRA-001.pdf",
  "Database connection pool: 127/200 connections active",
  "SWIFT MT103 message queued: REF TXN-47823",
  "Bloomberg feed reconnected: latency 12ms",
  "User a.vasquez exported 2,847 records (audit logged)",
  "SSL certificate renewed: *.nexacore-fin.com (90 days)",
  "Automated reconciliation: 12,847 accounts checked",
  "Firewall rule updated: blocked IP 185.220.101.x/24",
];

function genTxnId() {
  return "TXN-" + (47822 + Math.floor(Math.random() * 100));
}

function fmtAmount(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function fmtNow() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function genLiveTxn() {
  const t =
    LIVE_TXN_TEMPLATES[Math.floor(Math.random() * LIVE_TXN_TEMPLATES.length)];
  const amount = t.min + Math.floor(Math.random() * (t.max - t.min));
  return {
    id: genTxnId(),
    from: t.from,
    to: t.to,
    amount,
    currency: "USD",
    date: fmtNow(),
    status: Math.random() > 0.15 ? "completed" : "pending",
    flag: t.flag,
    category: t.cat,
    ref: "LIVE-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
  };
}

// ─── Tiny inline sparkline (no external deps) ────────────────────────────────
function Sparkline({
  data,
  color = T.text,
  height = 36,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  const last = data[data.length - 1];
  const lastX = (data.length - 1) * step;
  const lastY = height - ((last - min) / range) * height;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

// ─── Minimal stat card ───────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  delta,
  deltaPositive = true,
  spark,
  sparkColor,
  live,
}: {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  spark?: number[];
  sparkColor?: string;
  live?: boolean;
}) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        height: "100%",
        transition: "border-color 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: T.textMuted,
            fontWeight: 500,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </span>
        {live && (
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: T.green,
                boxShadow: `0 0 0 3px ${T.green}22`,
              }}
            />
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
              LIVE
            </span>
          </span>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: T.text,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            {value}
          </div>
          {delta && (
            <div
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: deltaPositive ? T.green : T.red,
                fontWeight: 500,
              }}
            >
              {deltaPositive ? (
                <ArrowUpOutlined style={{ fontSize: 10 }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: 10 }} />
              )}
              {delta}
            </div>
          )}
        </div>
        {spark && <Sparkline data={spark} color={sparkColor || T.text} />}
      </div>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function FakeDashboard() {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { modal } = App.useApp();

  const [activeKey, setActiveKey] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(3);

  const [liveTxns, setLiveTxns] = useState<any[]>(
    [...fakeData.transactions].reverse(),
  );
  const [liveLog, setLiveLog] = useState<string[]>(
    LOG_TEMPLATES.slice(0, 8).map(
      (l, i) =>
        `${new Date(Date.now() - i * 47000).toISOString().slice(11, 19)}  ${l}`,
    ),
  );
  const [serverLoad, setServerLoad] = useState(34);
  const [activeSessions, setActiveSessions] = useState(127);
  const [aumSpark, setAumSpark] = useState<number[]>(
    Array.from(
      { length: 24 },
      (_, i) => 8200 + Math.sin(i / 3) * 90 + Math.random() * 60,
    ),
  );
  const [txnVolSpark, setTxnVolSpark] = useState<number[]>(
    Array.from({ length: 24 }, () => 40 + Math.random() * 60),
  );
  const [sessionSpark, setSessionSpark] = useState<number[]>(
    Array.from(
      { length: 24 },
      (_, i) => 110 + Math.cos(i / 4) * 18 + Math.random() * 8,
    ),
  );
  const txnCounter = useRef(47822);

  // AUM trend — 12 oylik area chart uchun
  const aumChartData = (() => {
    const months = [
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
    ];
    let val = 6820;
    return months.map((m) => {
      val = Math.round(val + (Math.random() * 260 - 70));
      return { month: m, aum: val, target: Math.round(val * 0.965 + 130) };
    });
  })();

  useEffect(() => {
    const interval = setInterval(
      () => {
        const newTxn = genLiveTxn();
        txnCounter.current++;

        setLiveTxns((prev) => [newTxn, ...prev.slice(0, 19)]);
        setServerLoad((prev) =>
          Math.max(20, Math.min(85, prev + (Math.random() * 10 - 5))),
        );
        setActiveSessions((prev) =>
          Math.max(90, Math.min(180, prev + Math.floor(Math.random() * 6 - 3))),
        );

        setAumSpark((prev) => [
          ...prev.slice(1),
          prev[prev.length - 1] + (Math.random() * 40 - 18),
        ]);
        setTxnVolSpark((prev) => [...prev.slice(1), 40 + Math.random() * 60]);
        setSessionSpark((prev) => [
          ...prev.slice(1),
          prev[prev.length - 1] + (Math.random() * 8 - 4),
        ]);

        if (Math.random() > 0.3) {
          const logLine =
            LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
          setLiveLog((prev) => [
            `${new Date().toISOString().slice(11, 19)}  ${logLine}`,
            ...prev.slice(0, 14),
          ]);
        }

        if (newTxn.flag) {
          setNotifications((n) => n + 1);
        }
      },
      8000 + Math.random() * 7000,
    );

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    modal.confirm({
      title: "Sign out",
      icon: <ExclamationCircleOutlined style={{ color: T.red }} />,
      content: "Are you sure you want to sign out of NexaCore Financial?",
      okText: "Sign out",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk() {
        logout();
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: fmtNow(),
            exportedBy: "m.hartwell",
            users: fakeData.users,
            cards: fakeData.cards,
            transactions: liveTxns,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexacore-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const NAV = [
    { key: "dashboard", icon: <BarChartOutlined />, label: "Overview" },
    { key: "users", icon: <TeamOutlined />, label: "Members" },
    { key: "finance", icon: <CreditCardOutlined />, label: "Transactions" },
    { key: "database", icon: <DatabaseOutlined />, label: "Database" },
    { key: "monitor", icon: <MonitorOutlined />, label: "Monitor" },
    { key: "settings", icon: <SettingOutlined />, label: "Settings" },
  ];

  // ─── DASHBOARD (page 1) ──────────────────────────────────────────────────
  const renderDashboard = () => {
    const txnLast24h = liveTxns.length;
    const flaggedCount = liveTxns.filter((t) => t.flag).length;

    return (
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        {/* Page heading */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: T.text,
              letterSpacing: -0.4,
            }}
          >
            Overview
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
            Real-time view of accounts, transactions and infrastructure.
          </div>
        </div>

        {/* Metric row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              label="Assets under management"
              value="$8.42B"
              delta="2.3% MoM"
              deltaPositive
              spark={aumSpark}
              sparkColor={T.text}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              label="Active accounts"
              value="12,847"
              delta="34 today"
              deltaPositive
              spark={txnVolSpark}
              sparkColor={T.green}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              label="Active sessions"
              value={activeSessions}
              delta="live users"
              deltaPositive
              spark={sessionSpark}
              sparkColor={T.blue}
              live
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              label="Pending alerts"
              value={notifications}
              delta={`${flaggedCount} flagged`}
              deltaPositive={flaggedCount === 0}
            />
          </Col>
        </Row>

        {/* Main grid */}
        <Row gutter={[16, 16]}>
          {/* Live Transactions */}
          <Col xs={24} lg={16}>
            <div
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <SectionHeader
                title="Recent transactions"
                subtitle={`${txnLast24h} transactions in the last 24 hours`}
                action={
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      size="small"
                      type="text"
                      icon={<SearchOutlined />}
                      style={{ color: T.textMuted }}
                    />
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      style={{
                        borderColor: T.border,
                        color: T.text,
                        fontSize: 12,
                        height: 28,
                      }}
                    >
                      Export
                    </Button>
                  </div>
                }
              />
              <Table
                dataSource={liveTxns.slice(0, 8)}
                rowKey="id"
                size="small"
                pagination={false}
                showHeader
                style={{ background: T.panel }}
                columns={[
                  {
                    title: "ID",
                    dataIndex: "id",
                    width: 110,
                    render: (v) => (
                      <span
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: 11,
                          color: T.textMuted,
                        }}
                      >
                        {v}
                      </span>
                    ),
                  },
                  {
                    title: "From",
                    dataIndex: "from",
                    ellipsis: true,
                    render: (v) => (
                      <span
                        style={{
                          fontSize: 12.5,
                          color: T.text,
                          fontWeight: 500,
                        }}
                      >
                        {v}
                      </span>
                    ),
                  },
                  {
                    title: "To",
                    dataIndex: "to",
                    ellipsis: true,
                    render: (v) => (
                      <span style={{ fontSize: 12.5, color: T.textMuted }}>
                        {v}
                      </span>
                    ),
                  },
                  {
                    title: "Amount",
                    dataIndex: "amount",
                    width: 130,
                    align: "right" as const,
                    render: (v) => (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontVariantNumeric: "tabular-nums",
                          color: T.text,
                          fontWeight: 500,
                        }}
                      >
                        {fmtAmount(v)}
                      </span>
                    ),
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    width: 110,
                    render: (s, r: any) => {
                      if (r.flag) {
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              color: T.red,
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: T.red,
                              }}
                            />
                            Flagged
                          </span>
                        );
                      }
                      const color = s === "completed" ? T.green : T.amber;
                      return (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color,
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: color,
                            }}
                          />
                          {s === "completed" ? "Settled" : "Pending"}
                        </span>
                      );
                    },
                  },
                ]}
              />
            </div>
          </Col>

          {/* Activity & system */}
          <Col xs={24} lg={8}>
            <div
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <SectionHeader
                title="System activity"
                action={
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: T.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: T.green,
                        boxShadow: `0 0 0 3px ${T.green}22`,
                      }}
                    />
                    Streaming
                  </span>
                }
              />
              <div
                style={{
                  height: 268,
                  overflowY: "auto",
                  padding: "8px 4px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {liveLog.map((line, i) => {
                  const isWarn = /warning|Warning/.test(line);
                  const isAlert = /blocked|MFA/.test(line);
                  const dotColor = isAlert
                    ? T.red
                    : isWarn
                      ? T.amber
                      : T.textSubtle;
                  const ts = line.slice(0, 8);
                  const msg = line.slice(10);
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "6px 14px",
                        fontSize: 11,
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: dotColor,
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          color: T.textSubtle,
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {ts}
                      </span>
                      <span
                        style={{
                          color: isAlert ? T.red : isWarn ? T.amber : T.text,
                          wordBreak: "break-word",
                        }}
                      >
                        {msg}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CPU / Server load */}
            <div
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}
                >
                  Server load
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: serverLoad > 70 ? T.red : T.text,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {Math.round(serverLoad)}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: T.borderSoft,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${serverLoad}%`,
                    background: serverLoad > 70 ? T.red : T.text,
                    borderRadius: 3,
                    transition: "width 0.6s ease, background 0.3s ease",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  fontSize: 11,
                }}
              >
                <div>
                  <div style={{ color: T.textMuted, marginBottom: 2 }}>
                    Uptime
                  </div>
                  <div style={{ color: T.text, fontWeight: 500 }}>
                    {fakeData.systemStats?.uptime || "47d 12h"}
                  </div>
                </div>
                <div>
                  <div style={{ color: T.textMuted, marginBottom: 2 }}>
                    DB pool
                  </div>
                  <div style={{ color: T.text, fontWeight: 500 }}>
                    127 / 200
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Bottom row: quick stats / who's online */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <div
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <SectionHeader
                title="Who's online"
                subtitle="Members active in the last 5 minutes"
              />
              <div style={{ padding: "8px 0" }}>
                {(fakeData.users || []).slice(0, 5).map((u: any, i: number) => (
                  <div
                    key={u.id || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 18px",
                      borderBottom:
                        i < 4 ? `1px solid ${T.borderSoft}` : "none",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Avatar
                        size={32}
                        style={{
                          background: T.bg,
                          color: T.text,
                          border: `1px solid ${T.border}`,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {u.fullName
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </Avatar>
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: T.green,
                          border: `2px solid ${T.panel}`,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: T.text,
                          fontWeight: 500,
                        }}
                      >
                        {u.fullName}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {u.role} · {u.department}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: T.textSubtle,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {u.lastLogin?.split(" ")[1] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: "hidden",
                height: "100%",
              }}
            >
              <SectionHeader
                title="AUM trend"
                subtitle="Assets under management — last 12 months"
              />
              <div style={{ padding: "16px 18px 8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 600,
                      color: T.text,
                      letterSpacing: -0.5,
                    }}
                  >
                    $8.42B
                  </div>
                  <div
                    style={{ fontSize: 12, color: T.green, fontWeight: 500 }}
                  >
                    <ArrowUpOutlined style={{ fontSize: 10 }} /> 23.5% YoY
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart
                    data={aumChartData}
                    margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#0A0A0A"
                          stopOpacity={0.08}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0A0A0A"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F1F1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        `$${(v / 1000).toFixed(1)}B`
                      }
                    />
                    <ReTooltip
                      formatter={(v: number) => [
                        `$${(v / 1000).toFixed(2)}B`,
                        "AUM",
                      ]}
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #EAEAEA",
                        borderRadius: 8,
                        fontSize: 11,
                        color: "#0A0A0A",
                        boxShadow: "none",
                      }}
                      cursor={{ stroke: "#E5E5E5", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="aum"
                      stroke="#0A0A0A"
                      strokeWidth={1.5}
                      fill="url(#aumGrad)"
                      dot={false}
                      activeDot={{ r: 3, fill: "#0A0A0A", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  // ─── Other tabs (kept simple, same minimal style) ────────────────────────
  const renderUsers = () => (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: "hidden",
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <SectionHeader
        title="Members"
        subtitle="NexaCore Financial Group · all departments"
        action={
          <Button
            size="small"
            icon={<PlusOutlined />}
            style={{ borderColor: T.border, fontSize: 12, height: 28 }}
          >
            Invite
          </Button>
        }
      />
      <Table
        dataSource={fakeData.users}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          {
            title: "Member",
            key: "user",
            render: (_, r: any) => (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar
                  size={28}
                  style={{
                    background: T.bg,
                    color: T.text,
                    border: `1px solid ${T.border}`,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {r.fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </Avatar>
                <div>
                  <div
                    style={{ fontWeight: 500, fontSize: 12.5, color: T.text }}
                  >
                    {r.fullName}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {r.email}
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: "Role",
            dataIndex: "role",
            render: (v) => (
              <span style={{ fontSize: 12, color: T.text }}>{v}</span>
            ),
          },
          {
            title: "Department",
            dataIndex: "department",
            render: (v) => (
              <span style={{ fontSize: 12, color: T.textMuted }}>{v}</span>
            ),
          },
          {
            title: "MFA",
            dataIndex: "mfa",
            render: (v) => (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: v ? T.green : T.red,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: v ? T.green : T.red,
                  }}
                />
                {v ? "Enabled" : "Disabled"}
              </span>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (v) => (
              <span
                style={{
                  fontSize: 11,
                  color: v === "active" ? T.green : T.textSubtle,
                  fontWeight: 500,
                }}
              >
                {v === "active" ? "Active" : v}
              </span>
            ),
          },
          {
            title: "Last login",
            dataIndex: "lastLogin",
            render: (v) => (
              <span
                style={{
                  fontSize: 11,
                  color: T.textMuted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {v}
              </span>
            ),
          },
          {
            title: "",
            key: "actions",
            render: (_, r: any) => (
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setSelectedUser(r)}
                style={{ color: T.textMuted }}
              >
                View
              </Button>
            ),
          },
        ]}
      />
    </div>
  );

  const renderFinance = () => (
    <div style={{ maxWidth: 1320, margin: "0 auto" }}>
      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <SectionHeader
          title="Corporate cards"
          subtitle={`${fakeData.cards?.length || 0} active cards`}
        />
        <Table
          dataSource={fakeData.cards}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: "Holder",
              dataIndex: "holder",
              render: (v) => (
                <span
                  style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}
                >
                  {v}
                </span>
              ),
            },
            {
              title: "Card",
              dataIndex: "number",
              render: (v) => (
                <span
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11.5,
                    color: T.textMuted,
                  }}
                >
                  {v.replace(/\d(?=\d{4})/g, "•")}
                </span>
              ),
            },
            {
              title: "Type",
              dataIndex: "type",
              render: (v) => (
                <span style={{ fontSize: 11, color: T.textMuted }}>{v}</span>
              ),
            },
            {
              title: "Balance",
              dataIndex: "balance",
              align: "right" as const,
              render: (v) => (
                <span
                  style={{
                    fontSize: 12.5,
                    color: T.text,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtAmount(v)}
                </span>
              ),
            },
            {
              title: "Limit",
              dataIndex: "limit",
              align: "right" as const,
              render: (v) => (
                <span
                  style={{
                    fontSize: 12,
                    color: T.textMuted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtAmount(v)}
                </span>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (v) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: v === "active" ? T.green : T.red,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: v === "active" ? T.green : T.red,
                    }}
                  />
                  {v === "active" ? "Active" : "Blocked"}
                </span>
              ),
            },
            {
              title: "CVV",
              dataIndex: "cvv",
              render: (v) => (
                <Tooltip title={v}>
                  <Button
                    size="small"
                    type="text"
                    icon={<EyeOutlined />}
                    style={{ color: T.textMuted, fontSize: 11 }}
                  >
                    Show
                  </Button>
                </Tooltip>
              ),
            },
          ]}
        />
      </div>

      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <SectionHeader
          title="All transactions"
          subtitle={`${liveTxns.length} records · live`}
          action={
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ borderColor: T.border, fontSize: 12, height: 28 }}
            >
              Export
            </Button>
          }
        />
        <Table
          dataSource={liveTxns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              render: (v) => (
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: T.textMuted,
                  }}
                >
                  {v}
                </span>
              ),
            },
            {
              title: "From",
              dataIndex: "from",
              ellipsis: true,
              render: (v) => (
                <span style={{ fontSize: 12.5, color: T.text }}>{v}</span>
              ),
            },
            {
              title: "To",
              dataIndex: "to",
              ellipsis: true,
              render: (v) => (
                <span style={{ fontSize: 12.5, color: T.textMuted }}>{v}</span>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              align: "right" as const,
              render: (v) => (
                <span
                  style={{
                    fontSize: 12.5,
                    color: T.text,
                    fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtAmount(v)}
                </span>
              ),
            },
            {
              title: "Category",
              dataIndex: "category",
              render: (v) =>
                v && (
                  <span
                    style={{
                      fontSize: 11,
                      color: T.textMuted,
                      padding: "2px 8px",
                      border: `1px solid ${T.border}`,
                      borderRadius: 4,
                    }}
                  >
                    {v}
                  </span>
                ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (s, r: any) => {
                if (r.flag)
                  return (
                    <span
                      style={{ fontSize: 11, color: T.red, fontWeight: 500 }}
                    >
                      Flagged
                    </span>
                  );
                const c = s === "completed" ? T.green : T.amber;
                return (
                  <span style={{ fontSize: 11, color: c, fontWeight: 500 }}>
                    {s === "completed" ? "Settled" : "Pending"}
                  </span>
                );
              },
            },
            {
              title: "Date",
              dataIndex: "date",
              render: (v) => (
                <span
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {v}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: "hidden",
        maxWidth: 1320,
        margin: "0 auto",
      }}
    >
      <SectionHeader
        title="Database"
        subtitle="PostgreSQL 16.2 · nexacore_prod"
      />
      <div style={{ padding: 18 }}>
        <div
          style={{
            background: "#0A0A0A",
            borderRadius: 8,
            padding: 18,
            marginBottom: 16,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: "#7DD3FC" }}>nexacore_prod=# \dt</div>
          <div style={{ color: "#D4D4D4", marginTop: 8 }}>
            {[
              "public | accounts          | table | dba_role",
              "public | audit_log         | table | dba_role",
              "public | cards             | table | dba_role",
              "public | compliance_flags  | table | dba_role",
              "public | swift_messages    | table | dba_role",
              "public | transactions      | table | dba_role",
              "public | users             | table | dba_role",
            ].map((line, i) => (
              <div key={i} style={{ padding: "1px 0", color: "#A3A3A3" }}>
                {line}
              </div>
            ))}
          </div>
          <div style={{ color: "#737373", marginTop: 8 }}>(7 rows)</div>
          <div style={{ marginTop: 14, color: "#7DD3FC" }}>
            nexacore_prod=# SELECT count(*) FROM transactions;
          </div>
          <div style={{ color: "#D4D4D4", marginTop: 4 }}>
            count
            <br />
            -------
            <br />
            {`${String(liveTxns.length).padStart(6)}`}
            <br />
            (1 row)
          </div>
          <div style={{ color: "#737373", marginTop: 14 }}>
            -- Connected as dba_role · SSL ON · UTF8
          </div>
        </div>
        <Descriptions
          size="small"
          column={2}
          bordered={false}
          style={{ marginTop: 4 }}
        >
          <Descriptions.Item
            label={
              <span style={{ fontSize: 11, color: T.textMuted }}>Server</span>
            }
          >
            <span style={{ fontSize: 12, color: T.text }}>
              {fakeData.systemStats?.dbVersion || "PostgreSQL 16.2"}
            </span>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ fontSize: 11, color: T.textMuted }}>
                Active connections
              </span>
            }
          >
            <span
              style={{
                fontSize: 12,
                color: T.text,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fakeData.systemStats?.activeSessions || 127}/200
            </span>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ fontSize: 11, color: T.textMuted }}>
                Last backup
              </span>
            }
          >
            <span style={{ fontSize: 12, color: T.text }}>
              {fakeData.systemStats?.lastBackup || "—"}
            </span>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <span style={{ fontSize: 11, color: T.textMuted }}>Uptime</span>
            }
          >
            <span style={{ fontSize: 12, color: T.text }}>
              {fakeData.systemStats?.uptime || "—"}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );

  const contentMap: Record<string, React.ReactNode> = {
    dashboard: renderDashboard(),
    users: renderUsers(),
    finance: renderFinance(),
    database: renderDatabase(),
    monitor: (
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Metric cards */}
        <Row gutter={[16, 16]}>
          {[
            {
              label: "CPU load",
              value: `${Math.round(serverLoad)}%`,
              status: serverLoad > 70 ? T.red : T.green,
              bar: serverLoad,
            },
            { label: "Memory usage", value: "61%", status: T.green, bar: 61 },
            { label: "Disk I/O", value: "12 MB/s", status: T.green, bar: 24 },
            {
              label: "Network out",
              value: "847 KB/s",
              status: T.green,
              bar: 34,
            },
          ].map((m) => (
            <Col xs={12} lg={6} key={m.label}>
              <div
                style={{
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                    fontWeight: 500,
                    marginBottom: 10,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.text,
                    letterSpacing: -0.4,
                    marginBottom: 10,
                  }}
                >
                  {m.value}
                </div>
                <div
                  style={{
                    height: 4,
                    background: T.borderSoft,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${m.bar}%`,
                      background: m.status,
                      borderRadius: 2,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* Services table */}
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${T.borderSoft}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              Services
            </div>
            <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2 }}>
              NexaCore infrastructure · 9 services
            </div>
          </div>
          <div>
            {[
              {
                name: "nexacore-api",
                port: 8443,
                status: "running",
                uptime: "47d 14h",
                pid: 1247,
              },
              {
                name: "postgres-primary",
                port: 5432,
                status: "running",
                uptime: "47d 14h",
                pid: 892,
              },
              {
                name: "redis-cache",
                port: 6379,
                status: "running",
                uptime: "12d 3h",
                pid: 1103,
              },
              {
                name: "swift-gateway",
                port: 9001,
                status: "running",
                uptime: "47d 14h",
                pid: 2041,
              },
              {
                name: "compliance-worker",
                port: 9010,
                status: "running",
                uptime: "3d 22h",
                pid: 3182,
              },
              {
                name: "bloomberg-feed",
                port: 9443,
                status: "degraded",
                uptime: "0d 2h",
                pid: 4417,
              },
              {
                name: "audit-logger",
                port: 9020,
                status: "running",
                uptime: "47d 14h",
                pid: 1844,
              },
              {
                name: "backup-scheduler",
                port: 0,
                status: "idle",
                uptime: "47d 14h",
                pid: 2290,
              },
              {
                name: "mfa-service",
                port: 8080,
                status: "running",
                uptime: "47d 14h",
                pid: 1562,
              },
            ].map((svc, i) => {
              const color =
                svc.status === "running"
                  ? T.green
                  : svc.status === "degraded"
                    ? T.amber
                    : T.textSubtle;
              return (
                <div
                  key={svc.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 90px 110px 70px",
                    gap: 12,
                    padding: "11px 18px",
                    alignItems: "center",
                    borderBottom: i < 8 ? `1px solid ${T.borderSoft}` : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      color: T.text,
                      fontWeight: 500,
                    }}
                  >
                    {svc.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 11,
                      color: T.textMuted,
                    }}
                  >
                    {svc.port || "—"}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    <span style={{ fontSize: 11, color, fontWeight: 500 }}>
                      {svc.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textMuted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {svc.uptime}
                  </div>
                  <div
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 11,
                      color: T.textSubtle,
                    }}
                  >
                    {svc.pid}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    settings: (
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* General */}
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${T.borderSoft}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              General
            </div>
            <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2 }}>
              Organization and environment settings
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              {
                label: "Organization",
                value: "NexaCore Financial Group",
                editable: false,
              },
              { label: "Environment", value: "Production", editable: false },
              {
                label: "Version",
                value: "v3.2.1 (build 20260411)",
                editable: false,
              },
              {
                label: "Region",
                value: "us-east-1 · Chicago",
                editable: false,
              },
              {
                label: "Timezone",
                value: "America/Chicago (UTC−6)",
                editable: true,
              },
            ].map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 18px",
                  borderBottom: i < 4 ? `1px solid ${T.borderSoft}` : "none",
                }}
              >
                <span
                  style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}
                >
                  {row.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: T.text,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.value}
                  </span>
                  {row.editable && (
                    <span
                      style={{
                        fontSize: 11,
                        color: T.blue,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${T.borderSoft}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                API keys
              </div>
              <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 2 }}>
                Service-to-service authentication tokens
              </div>
            </div>
            <button
              style={{
                fontSize: 12,
                color: T.text,
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "5px 12px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + New key
            </button>
          </div>
          <div>
            {[
              {
                name: "bloomberg-feed-prod",
                key: "nxc_live_bf9d2a1c4e8f3b7a...c9d1",
                created: "2025-11-14",
                last: "2 min ago",
                scope: "read:market-data",
              },
              {
                name: "swift-gateway-v3",
                key: "nxc_live_a3e7f2b8d1c5094e...7f2a",
                created: "2025-09-02",
                last: "14 min ago",
                scope: "write:transfers",
              },
              {
                name: "compliance-reporter",
                key: "nxc_live_7b1d4e9c2f6a083b...1d4e",
                created: "2026-01-20",
                last: "1 h ago",
                scope: "read:audit",
              },
              {
                name: "backup-service",
                key: "nxc_live_5c3a8f2d1e7b094c...8f2d",
                created: "2024-03-15",
                last: "6 h ago",
                scope: "read:all",
              },
            ].map((k, i) => (
              <div
                key={k.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr 80px 90px",
                  gap: 12,
                  padding: "12px 18px",
                  alignItems: "center",
                  borderBottom: i < 3 ? `1px solid ${T.borderSoft}` : "none",
                }}
              >
                <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>
                  {k.name}
                </div>
                <div
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    color: T.textMuted,
                  }}
                >
                  {k.key}
                </div>
                <div style={{ fontSize: 11, color: T.textSubtle }}>
                  {k.last}
                </div>
                <div style={{ fontSize: 11, color: T.textSubtle }}>
                  {k.scope}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${T.borderSoft}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              Notifications
            </div>
          </div>
          <div>
            {[
              {
                label: "Flagged transaction alerts",
                desc: "Email when a transaction is flagged by compliance",
                on: true,
              },
              {
                label: "MFA failure alerts",
                desc: "Alert on 3+ consecutive MFA failures from same IP",
                on: true,
              },
              {
                label: "Daily summary digest",
                desc: "End-of-day report to m.hartwell@nexacore-fin.com",
                on: true,
              },
              {
                label: "Audit log exports",
                desc: "Notify when a bulk export is performed",
                on: false,
              },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: i < 3 ? `1px solid ${T.borderSoft}` : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>
                    {item.label}
                  </div>
                  <div
                    style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}
                  >
                    {item.desc}
                  </div>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: item.on ? T.text : T.borderSoft,
                    cursor: "pointer",
                    flexShrink: 0,
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      width: 14,
                      height: 14,
                      left: item.on ? 19 : 3,
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <App>
      <style>{`
        .nx-menu .ant-menu-item {
          margin: 2px 8px !important;
          width: calc(100% - 16px) !important;
          height: 34px !important;
          line-height: 34px !important;
          border-radius: 6px !important;
          color: ${T.textMuted} !important;
          font-size: 13px !important;
        }
        .nx-menu .ant-menu-item-selected {
          background: ${T.bg} !important;
          color: ${T.text} !important;
          font-weight: 500 !important;
        }
        .nx-menu .ant-menu-item:hover {
          background: ${T.borderSoft} !important;
          color: ${T.text} !important;
        }
        .ant-table-thead > tr > th {
          background: transparent !important;
          color: ${T.textMuted} !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          letter-spacing: 0.3px !important;
          text-transform: uppercase !important;
          border-bottom: 1px solid ${T.borderSoft} !important;
          padding: 10px 14px !important;
        }
        .ant-table-thead > tr > th::before { display: none !important; }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${T.borderSoft} !important;
          padding: 12px 14px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: ${T.bg} !important;
        }
        .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
      `}</style>

      <Layout style={{ height: "100vh", overflow: "hidden", background: T.bg }}>
        <Sider
          width={232}
          style={{
            background: T.panel,
            borderRight: `1px solid ${T.border}`,
          }}
          theme="light"
        >
          {/* Brand */}
          <div style={{ padding: "20px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: T.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                }}
              >
                N
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.text,
                    lineHeight: 1.1,
                  }}
                >
                 Super admin
                </div>
                <div style={{ fontSize: 10, color: T.textSubtle }}>
                  Production
                </div>
              </div>
            </div>
          </div>

          {/* Section label */}
          <div
            style={{
              padding: "12px 20px 6px",
              fontSize: 10,
              color: T.textSubtle,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Workspace
          </div>

          <Menu
            className="nx-menu"
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => setActiveKey(key)}
            items={NAV}
            style={{ background: "transparent", border: "none" }}
          />

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              padding: 14,
              borderTop: `1px solid ${T.borderSoft}`,
              background: T.panel,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 8px",
                borderRadius: 8,
              }}
            >
              <Avatar
                size={30}
                style={{
                  background: T.text,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                MH
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: T.text,
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  M. Hartwell
                </div>
                <div style={{ color: T.textMuted, fontSize: 10.5 }}>
                  CIO · m.hartwell
                </div>
              </div>
              <Tooltip title="Sign out">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <LogoutOutlined
                      style={{ fontSize: 14, color: T.textMuted }}
                    />
                  }
                  onClick={handleLogout}
                />
              </Tooltip>
            </div>
          </div>
        </Sider>

        <Layout style={{ background: T.bg, overflow: "hidden" }}>
          <Header
            style={{
              background: T.panel,
              padding: "0 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${T.border}`,
              height: 56,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                {NAV.find((n) => n.key === activeKey)?.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: T.textSubtle,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtTime()} UTC
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 11,
                  color: T.textMuted,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.green,
                    boxShadow: `0 0 0 3px ${T.green}22`,
                  }}
                />
                All systems operational
              </span>
              <Badge count={notifications} size="small" color={T.red}>
                <Button
                  type="text"
                  icon={
                    <BellOutlined
                      style={{ fontSize: 15, color: T.textMuted }}
                    />
                  }
                  size="small"
                />
              </Badge>
            </div>
          </Header>

          <Content
            style={{ padding: "28px", background: T.bg, overflowY: "auto" }}
          >
            {contentMap[activeKey]}
          </Content>
        </Layout>
      </Layout>

      {/* User detail modal */}
      <Modal
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        footer={null}
        title={
          selectedUser ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
                {selectedUser.fullName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.textMuted,
                  fontWeight: 400,
                  marginTop: 2,
                }}
              >
                {selectedUser.email}
              </div>
            </div>
          ) : (
            ""
          )
        }
        width={520}
      >
        {selectedUser && (
          <Descriptions column={1} size="small" bordered={false}>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  Username
                </span>
              }
            >
              <Text code style={{ fontSize: 11 }}>
                {selectedUser.username}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>Role</span>
              }
            >
              <span style={{ fontSize: 12 }}>{selectedUser.role}</span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  Department
                </span>
              }
            >
              <span style={{ fontSize: 12 }}>{selectedUser.department}</span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>SSN</span>
              }
            >
              <Text code style={{ fontSize: 11, color: T.red }}>
                {selectedUser.ssn}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>Phone</span>
              }
            >
              <span style={{ fontSize: 12 }}>{selectedUser.phone}</span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>MFA</span>
              }
            >
              {selectedUser.mfa ? (
                <Tag color="green" style={{ fontSize: 10 }}>
                  Enabled
                </Tag>
              ) : (
                <Tag color="red" style={{ fontSize: 10 }}>
                  Disabled
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  Permissions
                </span>
              }
            >
              {selectedUser.permissions?.map((p: string) => (
                <Tag
                  key={p}
                  style={{
                    marginBottom: 2,
                    fontSize: 10,
                    background: T.bg,
                    borderColor: T.border,
                    color: T.text,
                  }}
                >
                  {p}
                </Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  Created
                </span>
              }
            >
              <span
                style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
              >
                {selectedUser.created}
              </span>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span style={{ fontSize: 11, color: T.textMuted }}>
                  Last login
                </span>
              }
            >
              <span
                style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}
              >
                {selectedUser.lastLogin}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </App>
  );
}
