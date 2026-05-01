import React from "react";
import { Row, Col, Card, Table, Skeleton, Empty } from "antd";
import {
  SafetyOutlined,
  WarningOutlined,
  StopOutlined,
  BugOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  useGetStatsSummary,
  useGetStatsByType,
  useGetStatsByHour,
  useGetAttacks,
} from "../lib/api";
import { getGeoFromIp } from "../lib/geo";
import { useTheme } from "../lib/theme";
import { Link } from "wouter";

const TYPE_COLORS: Record<string, string> = {
  "SQL Injection": "#EF4444",
  XSS: "#F59E0B",
  "Path Traversal": "#8B5CF6",
  "Command Injection": "#F97316",
  Clean: "#10B981",
};
const CHART_COLORS = ["#2563EB", "#EF4444", "#F59E0B", "#10B981", "#8B5CF6"];

const DECISION_CFG: Record<
  string,
  { color: string; bg: string; darkBg: string; label: string }
> = {
  allow: {
    color: "#16A34A",
    bg: "#F0FDF4",
    darkBg: "rgba(16,185,129,0.12)",
    label: "Allow",
  },
  monitor: {
    color: "#D97706",
    bg: "#FFFBEB",
    darkBg: "rgba(245,158,11,0.12)",
    label: "Monitor",
  },
  deception: {
    color: "#DC2626",
    bg: "#FEF2F2",
    darkBg: "rgba(239,68,68,0.12)",
    label: "Deception",
  },
};

function StatCard({
  title,
  value,
  icon,
  color,
  sub,
  loading,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  loading?: boolean;
}) {
  const { dark } = useTheme();
  return (
    <Card
      style={{
        borderRadius: 14,
        height: "100%",
        border: `1px solid ${dark ? "#1E293B" : "#E8EDF3"}`,
        background: dark ? "#0F172A" : "#FFFFFF",
      }}
      styles={{ body: { padding: 20 } }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748B",
                letterSpacing: "0.08em",
                marginBottom: 10,
                textTransform: "uppercase",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: dark ? "#F1F5F9" : "#0F172A",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {value ?? "—"}
            </div>
            {sub && (
              <div
                style={{
                  fontSize: 12,
                  color: dark ? "#475569" : "#94A3B8",
                  marginTop: 8,
                }}
              >
                {sub}
              </div>
            )}
          </div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: `${color}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { dark } = useTheme();
  const { data: summary, isLoading: loadingSummary } = useGetStatsSummary();
  const { data: statsByType } = useGetStatsByType();
  const { data: statsByHour } = useGetStatsByHour();
  const { data: recent } = useGetAttacks({ limit: 8 });

  const cardBg = dark ? "#0F172A" : "#FFFFFF";
  const cardBdr = dark ? "#1E293B" : "#E8EDF3";
  const txtMain = dark ? "#F1F5F9" : "#0F172A";
  const txtSub = dark ? "#64748B" : "#94A3B8";
  const gridClr = dark ? "#1E293B" : "#F1F5F9";

  const columns = [
    {
      title: "Waqit",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 80,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: txtSub, fontFamily: "monospace" }}>
          {new Date(v).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      title: "IP Adres",
      dataIndex: "ipAddress",
      key: "ip",
      render: (ip: string) => {
        const g = getGeoFromIp(ip);
        return (
          <span
            style={{ fontFamily: "monospace", fontSize: 12, color: txtMain }}
          >
            <span style={{ marginRight: 5 }}>{g.flag}</span>
            {ip}
          </span>
        );
      },
    },
    {
      title: "Hujum túri",
      dataIndex: "attackType",
      key: "type",
      render: (t: string) => (
        <span
          style={{
            padding: "2px 9px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: `${TYPE_COLORS[t] ?? "#64748B"}18`,
            color: TYPE_COLORS[t] ?? "#64748B",
          }}
        >
          {t}
        </span>
      ),
    },
    {
      title: "Risk",
      dataIndex: "riskScore",
      key: "risk",
      width: 65,
      render: (s: number) => (
        <span
          style={{
            fontWeight: 800,
            fontSize: 15,
            color: s >= 70 ? "#DC2626" : s >= 30 ? "#D97706" : "#16A34A",
          }}
        >
          {s}
        </span>
      ),
    },
    {
      title: "Qarar",
      dataIndex: "decision",
      key: "decision",
      width: 110,
      render: (d: string) => {
        const c = DECISION_CFG[d] ?? {
          color: "#64748B",
          bg: "#F8FAFC",
          darkBg: "#1E293B",
          label: d,
        };
        return (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              background: dark ? c.darkBg : c.bg,
              color: c.color,
            }}
          >
            {c.label}
          </span>
        );
      },
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      render: (v: string) => (
        <span style={{ fontFamily: "monospace", fontSize: 11, color: txtSub }}>
          {v}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Stat cards */}
      <Row gutter={[14, 14]}>
        {[
          {
            title: "Jámi hújimler",
            value: summary?.totalAttacks,
            icon: <SafetyOutlined />,
            color: "#2563EB",
            sub: "Barlıq waqıt",
          },
          {
            title: "Bugin",
            value: summary?.todayAttacks,
            icon: <WarningOutlined />,
            color: "#F59E0B",
            sub: "Sońǵı 24 saat",
          },
          {
            title: "Bloklanǵan",
            value: summary?.blockedAttacks,
            icon: <StopOutlined />,
            color: "#EF4444",
            sub: "Deception + Monitor",
          },
          {
            title: "Honeypot (aldawshı sistema)",
            value: summary?.deceived,
            icon: <BugOutlined />,
            color: "#8B5CF6",
            sub: "Aldanǵan hújimshiler",
          },
        ].map((s) => (
          <Col xs={24} sm={12} lg={6} key={s.title}>
            <StatCard {...s} loading={loadingSummary} />
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[14, 14]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
                Hújim intensivligi - 24 saat.
              </span>
            }
            style={{
              border: `1px solid ${cardBdr}`,
              borderRadius: 14,
              background: cardBg,
            }}
            styles={{ body: { padding: "8px 16px 16px" } }}
          >
            <div style={{ height: 220 }}>
              {!statsByHour?.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Ma'lumot yo'q"
                  style={{ paddingTop: 60 }}
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={statsByHour}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#2563EB"
                          stopOpacity={dark ? 0.3 : 0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563EB"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridClr}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: cardBg,
                        border: `1px solid ${cardBdr}`,
                        borderRadius: 10,
                        fontSize: 12,
                        color: txtMain,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#blueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
                Hújim bólistiriw
              </span>
            }
            style={{
              border: `1px solid ${cardBdr}`,
              borderRadius: 14,
              background: cardBg,
              height: "100%",
            }}
            styles={{ body: { padding: "8px 16px 16px" } }}
          >
            <div style={{ height: 160 }}>
              {!statsByType?.length ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Ma'lumot yo'q"
                  style={{ paddingTop: 40 }}
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="type"
                    >
                      {(statsByType ?? []).map((entry: any, i: number) => (
                        <Cell
                          key={i}
                          fill={
                            TYPE_COLORS[entry.type] ??
                            CHART_COLORS[i % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: cardBg,
                        border: `1px solid ${cardBdr}`,
                        borderRadius: 10,
                        fontSize: 12,
                        color: txtMain,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 8,
              }}
            >
              {(statsByType ?? []).slice(0, 4).map((item: any, i: number) => (
                <div
                  key={item.type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background:
                          TYPE_COLORS[item.type] ??
                          CHART_COLORS[i % CHART_COLORS.length],
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: 12, color: txtSub }}>
                      {item.type}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: txtMain }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent activity */}
      <Card
        title={
          <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
            Sońǵı iskerlik
          </span>
        }
        extra={
          // BUG FIX: <a href> o'rniga <Link> — to'liq sahifa yangilanmasdan o'tadi
          <Link
            href="/attacks"
            style={{
              fontSize: 12,
              color: "#2563EB",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Barlıǵın kóriw <ArrowRightOutlined />
          </Link>
        }
        style={{
          border: `1px solid ${cardBdr}`,
          borderRadius: 14,
          background: cardBg,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={recent?.data ?? []}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          style={{ borderRadius: 14, overflow: "hidden" }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Hujumlar yo'q"
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
