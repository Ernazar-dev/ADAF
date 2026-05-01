import React, { useState } from "react";
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  Drawer,
  Descriptions,
  Popconfirm,
  Tag,
  Empty,
  App,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  StopOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useGetAttacks, useDeleteAttack, useGetBlockedIps, useBlockIp, useUnblockIp } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getGeoFromIp } from "../lib/geo";
import { useTheme } from "../lib/theme";

const DECISION_TAG: Record<string, { color: string; label: string }> = {
  allow: { color: "success", label: "Allow" },
  monitor: { color: "warning", label: "Monitor" },
  deception: { color: "error", label: "Deception" },
};

export default function Attacks() {
  const { dark } = useTheme();
  const { message } = App.useApp();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>();
  const [decision, setDecision] = useState<string | undefined>();
  const [selected, setSelected] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useGetAttacks(
    { page, limit: 20, search: search || undefined, type, decision },
    { query: { refetchInterval: 15_000 } },
  );
  const deleteMutation = useDeleteAttack();
  const { data: blockedIps, refetch: refetchBlocked } = useGetBlockedIps();
  const blockMutation = useBlockIp();
  const unblockMutation = useUnblockIp();

  const blockedSet = new Set<string>((blockedIps ?? []).map((b: any) => b.ipAddress));

  const handleBlock = (ip: string) => {
    blockMutation.mutate(
      { data: { ip } },
      {
        onSuccess: () => { message.success(`${ip} bloklandi`); refetchBlocked(); },
        onError: (err: any) => {
          if (err?.error === "already_blocked") message.warning("Bu IP allaqachon bloklangan");
          else message.error("Bloklashda xatolik");
        },
      },
    );
  };

  const handleUnblock = (ip: string) => {
    unblockMutation.mutate(
      { ip },
      {
        onSuccess: () => { message.success(`${ip} blokdan chiqarildi`); refetchBlocked(); },
        onError: () => message.error("Blokdan chiqarishda xatolik"),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          message.success("Log o'chirildi");
          queryClient.invalidateQueries({ queryKey: ["attacks"] });
        },
        onError: () => message.error("Óshiriwde qátelik")
      },
    );
  };

  const cardBg = dark ? "#0F172A" : "#FFFFFF";
  const cardBdr = dark ? "#1E293B" : "#E8EDF3";
  const txtMain = dark ? "#F1F5F9" : "#0F172A";
  const txtSub = dark ? "#64748B" : "#94A3B8";

  const columns = [
    {
      title: "Vaqt",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 145,
      render: (v: string) => (
        <span style={{ fontSize: 12, color: txtSub, fontFamily: "monospace" }}>
          {new Date(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: "IP Adress",
      dataIndex: "ipAddress",
      key: "ip",
      width: 155,
      render: (ip: string) => {
        const g = getGeoFromIp(ip);
        return (
          <span
            style={{ fontFamily: "monospace", fontSize: 12, color: txtMain }}
          >
            {g.flag} {ip}
          </span>
        );
      },
    },
    {
      title: "Hújim túri",
      dataIndex: "attackType",
      key: "type",
      width: 145,
      render: (t: string) => {
        const colors: Record<string, string> = {
          "SQL Injection": "#EF4444",
          XSS: "#F59E0B",
          "Path Traversal": "#8B5CF6",
          "Command Injection": "#F97316",
          Clean: "#10B981",
        };
        const c = colors[t] ?? "#64748B";
        return (
          <span
            style={{
              padding: "2px 9px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              background: `${c}18`,
              color: c,
            }}
          >
            {t}
          </span>
        );
      },
    },
    {
      title: "Risk",
      dataIndex: "riskScore",
      key: "risk",
      width: 80,
      sorter: (a: any, b: any) => a.riskScore - b.riskScore,
      render: (s: number) => (
        <span
          style={{
            fontWeight: 800,
            fontSize: 14,
            color: s >= 70 ? "#DC2626" : s >= 30 ? "#D97706" : "#16A34A",
          }}
        >
          {s}
        </span>
      ),
    },
    {
      title: "AI Score",
      dataIndex: "aiScore",
      key: "ai",
      width: 85,
      render: (v: number) => (
        <span style={{ color: txtSub, fontSize: 13 }}>{v}</span>
      ),
    },
    {
      title: "Qarar",
      dataIndex: "decision",
      key: "decision",
      width: 120,
      render: (d: string) => {
        const c = DECISION_TAG[d];
        return <Tag color={c?.color ?? "default"}>{c?.label ?? d}</Tag>;
      },
    },
    {
      title: "Ámel",
      key: "actions",
      width: 120,
      render: (_: any, r: any) => {
        const blocked = blockedSet.has(r.ipAddress);
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelected(r)}
            />
            <Tooltip title={blocked ? "Blokdan chiqarish" : "IP bloklash"}>
              <Popconfirm
                title={blocked ? `${r.ipAddress} blokdan chiqarilsinmi?` : `${r.ipAddress} saytga kirishi bloklansınmi?`}
                onConfirm={() => blocked ? handleUnblock(r.ipAddress) : handleBlock(r.ipAddress)}
                okText={blocked ? "Chiqar" : "Bloklash"}
                okButtonProps={{ danger: !blocked }}
              >
                <Button
                  size="small"
                  icon={blocked ? <UnlockOutlined /> : <StopOutlined />}
                  danger={!blocked}
                  style={blocked ? { color: "#10B981", borderColor: "#10B981" } : {}}
                  loading={blockMutation.isPending || unblockMutation.isPending}
                />
              </Popconfirm>
            </Tooltip>
            <Popconfirm
              title="Bul logtı óshiresiz be?"
              onConfirm={() => handleDelete(r.id)}
              okText="O'chir"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* Filterlar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "14px 16px",
          background: dark ? "#0F172A" : "#FFFFFF",
          borderRadius: 12,
          border: `1px solid ${cardBdr}`,
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
          placeholder="Payload qidiriw.."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ width: 220, borderRadius: 8 }}
          allowClear
        />
        <Select
          placeholder="Hújim túri"
          style={{ width: 160 }}
          allowClear
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        >
          {[
            "SQL Injection",
            "XSS",
            "Path Traversal",
            "Command Injection",
            "Clean",
          ].map((t) => (
            <Select.Option key={t} value={t}>
              {t}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Qarar"
          style={{ width: 130 }}
          allowClear
          onChange={(v) => {
            setDecision(v);
            setPage(1);
          }}
        >
          <Select.Option value="allow">Allow</Select.Option>
          <Select.Option value="monitor">Monitor</Select.Option>
          <Select.Option value="deception">Deception</Select.Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Jańalaw
        </Button>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10B981",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 13, color: txtSub, fontWeight: 600 }}>
            {data?.total ?? 0} dana jaziw
          </span>
        </div>
      </div>

      {/* Jadval */}
      <div
        style={{
          background: cardBg,
          borderRadius: 12,
          border: `1px solid ${cardBdr}`,
          overflow: "hidden",
        }}
      >
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          scroll={{ x: 820 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Hujumlar topilmadi"
              />
            ),
          }}
          // BUG FIX: rowClassName da Tailwind class ishlatasdi — CSS import qilinmagan bo'lsa ko'rinmaydi
          // Inline style bilan almashtirdik
          onRow={(record) => ({
            style:
              record.decision === "deception"
                ? { background: dark ? "rgba(239,68,68,0.06)" : "#FEF2F2" }
                : undefined,
          })}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (t) => `Jámi ${t} dana`,
          }}
        />
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={
          <span style={{ fontWeight: 700 }}>
            Hújim detalları #{selected?.id}
          </span>
        }
        open={!!selected}
        onClose={() => setSelected(null)}
        width={520}
      >
        {selected && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="ID">{selected.id}</Descriptions.Item>
            <Descriptions.Item label="IP Manzil">
              <code>{selected.ipAddress}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Jaylasıw">
              {(() => {
                const g = getGeoFromIp(selected.ipAddress);
                return `${g.flag} ${g.city}, ${g.country} · ${g.isp}`;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Hújim túri">
              {selected.attackType}
            </Descriptions.Item>
            <Descriptions.Item label="Qarar">
              {(() => {
                const c = DECISION_TAG[selected.decision];
                return (
                  <Tag color={c?.color}>{c?.label ?? selected.decision}</Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Risk Score">
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color:
                    selected.riskScore >= 70
                      ? "#DC2626"
                      : selected.riskScore >= 30
                        ? "#D97706"
                        : "#16A34A",
                }}
              >
                {selected.riskScore}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="AI Score">
              {selected.aiScore}
            </Descriptions.Item>
            <Descriptions.Item label="Behavior Score">
              {selected.behaviorScore}
            </Descriptions.Item>
            <Descriptions.Item label="Endpoint">
              <code>{selected.endpoint}</code>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent">
              <span style={{ wordBreak: "break-all", fontSize: 12 }}>
                {selected.userAgent}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Anıqlanǵan patternlar">
              {(selected.detectedPatterns ?? []).join(", ") || "Yo'q"}
            </Descriptions.Item>
            <Descriptions.Item label="Payload">
              <pre
                style={{
                  fontSize: 12,
                  background: dark ? "#1E293B" : "#F8FAFC",
                  padding: 10,
                  borderRadius: 8,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {selected.requestData}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="Waqit">
              {new Date(selected.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
