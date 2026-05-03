import React from "react";
import { Link } from "wouter";
import { Button } from "antd";
import { HomeOutlined, SafetyOutlined } from "@ant-design/icons";
import { useTheme } from "../lib/theme";

export default function NotFound() {
  const { dark } = useTheme();
  const bg = dark ? "#070B14" : "#F0F4FA";
  const txt = dark ? "#F1F5F9" : "#0F172A";
  const sub = dark ? "#64748B" : "#64748B";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 28px rgba(37,99,235,0.35)",
          }}
        >
          <SafetyOutlined style={{ fontSize: 28, color: "#FFFFFF" }} />
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: dark ? "#1E293B" : "#E2E8F0",
            lineHeight: 1,
            marginBottom: 8,
            letterSpacing: "-0.04em",
          }}
        >
          404
        </div>
        <div
          style={{ fontSize: 20, fontWeight: 700, color: txt, marginBottom: 8 }}
        >
          Bet tabılmadı
        </div>
        <div style={{ fontSize: 14, color: sub, marginBottom: 32 }}>
          Siz izlep atırgan resurs joq.
        </div>
        <Link href="/">
          <Button
            type="primary"
            icon={<HomeOutlined />}
            style={{
              borderRadius: 10,
              height: 42,
              fontWeight: 600,
              paddingInline: 24,
            }}
          >
            Bas betke qaytıw
          </Button>
        </Link>
      </div>
    </div>
  );
}
