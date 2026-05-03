import React from "react";
import { StopOutlined } from "@ant-design/icons";
import { useTheme } from "../lib/theme";

export default function Blocked() {
  const { dark } = useTheme();

  const bg   = dark ? "#070B14" : "#F0F4FA";
  const card = dark ? "#0F172A" : "#FFFFFF";
  const bdr  = dark ? "#1E293B" : "#E8EDF3";
  const txt  = dark ? "#F1F5F9" : "#0F172A";
  const sub  = dark ? "#64748B" : "#64748B";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>

        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
            boxShadow: "0 12px 40px rgba(220,38,38,0.4)",
          }}
        >
          <StopOutlined style={{ fontSize: 36, color: "#fff" }} />
        </div>

        {/* Card */}
        <div
          style={{
            background: card,
            borderRadius: 20,
            border: `1px solid ${bdr}`,
            boxShadow: dark
              ? "0 8px 48px rgba(0,0,0,0.5)"
              : "0 8px 48px rgba(220,38,38,0.08)",
            padding: "36px 32px 32px",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#DC2626",
              marginBottom: 12,
              letterSpacing: "-0.03em",
            }}
          >
            Kirisiw qadaǵan etildi
          </div>

          <div
            style={{
              fontSize: 15,
              color: txt,
              marginBottom: 8,
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Siziń IP mánzilińiz qáwipsizlik sisteması tárepinen bloklanǵan.
          </div>

          <div
            style={{
              fontSize: 13,
              color: sub,
              marginBottom: 28,
              lineHeight: 1.6,
            }}
          >
            Bul saytqa kiriwge ruxsatıńız joq.
          </div>

          {/* Status badge */}
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: dark ? "rgba(220,38,38,0.08)" : "#FEF2F2",
              border: `1px solid ${dark ? "rgba(220,38,38,0.2)" : "#FECACA"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#DC2626",
                display: "inline-block",
                flexShrink: 0,
                boxShadow: "0 0 6px rgba(220,38,38,0.6)",
              }}
            />
            <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>
              IP mánzil bloklangan · Kirish rad etildi
            </span>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: dark ? "#334155" : "#CBD5E1" }}>
          ADAF Security System · 2026
        </div>
      </div>
    </div>
  );
}
