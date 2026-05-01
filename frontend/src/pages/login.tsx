import React from "react";
import { Form, Input, Button, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { useLogin } from "../lib/api";
import { useTheme } from "../lib/theme";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const { dark, toggle } = useTheme();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data: any) => {
          login(data.token, data.deception);
          setLocation(data.deception ? "/fake-dashboard" : "/dashboard");
        },
        onError: () => {
          form.setFields([
            { name: "password", errors: ["Username yaki parol naduris."] },
          ]);
        },
      },
    );
  };

  const bg = dark ? "#070B14" : "#F0F4FA";
  const card = dark ? "#0F172A" : "#FFFFFF";
  const bdr = dark ? "#1E293B" : "#E8EDF3";
  const txt = dark ? "#F1F5F9" : "#0F172A";
  const sub = dark ? "#64748B" : "#94A3B8";

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
        transition: "background 0.3s",
      }}
    >
      {/* Theme toggle */}
      <div
        onClick={toggle}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: card,
          border: `1px solid ${bdr}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          color: dark ? "#F59E0B" : "#64748B",
          fontSize: 16,
          transition: "all 0.2s",
          zIndex: 10,
        }}
      >
        {dark ? <SunOutlined /> : <MoonOutlined />}
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo blok */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 40px rgba(37,99,235,0.35)",
            }}
          >
            <SafetyOutlined style={{ fontSize: 30, color: "#fff" }} />
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: txt,
              margin: "0 0 6px",
              letterSpacing: "-0.03em",
            }}
          >
            ADAF Console
          </h1>
        </div>

        {/* Karta */}
        <div
          style={{
            background: card,
            borderRadius: 20,
            border: `1px solid ${bdr}`,
            boxShadow: dark
              ? "0 8px 48px rgba(0,0,0,0.5)"
              : "0 8px 48px rgba(37,99,235,0.08)",
            padding: "32px 32px 28px",
            transition: "background 0.3s, border-color 0.3s",
          }}
        >
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label={
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: dark ? "#CBD5E1" : "#374151",
                  }}
                >
                  Username
                </span>
              }
              rules={[{ required: true, message: "Username kiritish shart" }]}
              style={{ marginBottom: 16 }}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                placeholder="username"
                style={{ borderRadius: 10, height: 46 }}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: dark ? "#CBD5E1" : "#374151",
                  }}
                >
                  Password
                </span>
              }
              rules={[{ required: true, message: "Parol kiritish shart" }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                placeholder="••••••••"
                style={{ borderRadius: 10, height: 46 }}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loginMutation.isPending}
              style={{
                height: 48,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                border: "none",
                boxShadow: "0 6px 20px rgba(37,99,235,0.4)",
              }}
            >
              Konsolģa kiriw
            </Button>
          </Form>

          {/* AI status */}
          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              borderRadius: 10,
              background: dark ? "rgba(16,185,129,0.08)" : "#F0FDF4",
              border: `1px solid ${dark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                display: "inline-block",
                flexShrink: 0,
                boxShadow: "0 0 6px rgba(16,185,129,0.6)",
              }}
            />
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              AI qáwip anıqlaw aktiv - barlıq kiriw qadaǵalanadı
            </span>
          </div>
        </div>

        {/* Badges */}

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <span
            style={{
              fontSize: 11,
              color: dark ? "#334155" : "#CBD5E1",
              fontWeight: 500,
            }}
          >
            ADAF Project · 2026
          </span>
        </div>
      </div>
    </div>
  );
}
