import React from "react";
import {
  Card,
  Form,
  Switch,
  Button,
  Slider,
  Row,
  Col,
  Divider,
  Spin,
  Empty,
  App,
} from "antd";
import { useGetSettings, useUpdateSettings } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../lib/theme";
import { SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";

export default function Settings() {
  const { dark } = useTheme();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (settings) form.setFieldsValue(settings);
  }, [settings, form]);

  const onSave = (values: any) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          message.success("Saylamalar saqlandı");
          queryClient.invalidateQueries({ queryKey: ["settings"] });
        },
        onError: () => message.error("Saqlawda qáte"),
      },
    );
  };

  const cardBg = dark ? "#0F172A" : "#FFFFFF";
  const cardBdr = dark ? "#1E293B" : "#E8EDF3";
  const txtMain = dark ? "#F1F5F9" : "#0F172A";
  const txtSub = dark ? "#64748B" : "#94A3B8";

  if (isLoading)
    return (
      <div
        style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}
      >
        <Spin size="large" tip="Júklenip atır..." />
      </div>
    );

  if (!settings) return <Empty description="Sazlamalar tabılmadı" />;

  const Label = ({ text }: { text: string }) => (
    <span style={{ fontWeight: 600, fontSize: 13, color: txtMain }}>
      {text}
    </span>
  );

  return (
    <Row gutter={[16, 16]}>
      {/* Konfiguratsiya formasi */}
      <Col xs={24} lg={15}>
        <Card
          title={
            <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
              Firewall konfiguratsiyasi
            </span>
          }
          style={{
            borderRadius: 14,
            border: `1px solid ${cardBdr}`,
            background: cardBg,
          }}
        >
          <Form form={form} onFinish={onSave} layout="vertical">
            {/* BUG FIX: monitorThreshold ham formaga qo'shildi — oldin yo'q edi */}
            <Form.Item
              name="allowThreshold"
              label={<Label text="Ruxsat shegarası (0–100)" />}
              help="Bul mánisten tómen bahalı sorawlar tikkeley ótkeriledi"
            >
              <Slider
                min={0}
                max={100}
                marks={{ 0: "0", 30: "30", 50: "50", 70: "70", 100: "100" }}
                trackStyle={{ background: "#10B981" }}
                handleStyle={{ borderColor: "#10B981" }}
              />
            </Form.Item>

            <Form.Item
              name="monitorThreshold"
              label={<Label text="Monitoring shegarası (0–100)" />}
              help="Bul mánis aralıǵındaǵı sorawlar baqlaw astında ótkeriledi"
            >
              <Slider
                min={0}
                max={100}
                marks={{ 0: "0", 30: "30", 50: "50", 70: "70", 100: "100" }}
                trackStyle={{ background: "#F59E0B" }}
                handleStyle={{ borderColor: "#F59E0B" }}
              />
            </Form.Item>

            <Form.Item
              name="deceptionThreshold"
              label={<Label text="Aldaw shegarası (0–100)" />}
              help="Bul mánisten joqarı bahalı sorawlar aldawshı sistema ga jiberiledi."
            >
              <Slider
                min={0}
                max={100}
                marks={{ 0: "0", 30: "30", 50: "50", 70: "70", 100: "100" }}
                trackStyle={{ background: "#EF4444" }}
                handleStyle={{ borderColor: "#EF4444" }}
              />
            </Form.Item>

            <Divider style={{ margin: "16px 0", borderColor: cardBdr }} />

            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="enableDeception"
                  label={<Label text="Aldaw rejimi" />}
                  valuePropName="checked"
                  help="Joqarı qáwipli sorawlardı aldawshı sistema ga baǵdarlaw"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="enableLearning"
                  label={<Label text="AI úyreniw" />}
                  valuePropName="checked"
                  help="Minez-qulıq tariyxına tiykarlanǵan beyimlesiwsheń bahalaw"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="logAllRequests"
                  label={<Label text="Barlıǵın loglaw" />}
                  valuePropName="checked"
                  help="Taza (ruqsat etilgen) sorawlardı da jurnallaw"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
              icon={<SaveOutlined />}
              style={{
                marginTop: 8,
                borderRadius: 8,
                fontWeight: 600,
                height: 40,
              }}
            >
              Saqlaw
            </Button>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={9}>
        {/* Joriy qiymatlar */}
        <Card
          title={
            <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
              Joriy sozlamalar
            </span>
          }
          style={{
            borderRadius: 14,
            border: `1px solid ${cardBdr}`,
            background: cardBg,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Ruxsat shegarası",
              value: `${settings.allowThreshold}/100`,
              color: "#16A34A",
            },
            {
              label: "Monitor shegarası",
              value: `${settings.monitorThreshold}/100`,
              color: "#D97706",
            },
            {
              label: "Aldaw shegarasi",
              value: `${settings.deceptionThreshold}/100`,
              color: "#DC2626",
            },
            {
              label: "Aldaw rejimi",
              value: settings.enableDeception ? "Yoqilgan" : "O'chirilgan",
              color: settings.enableDeception ? "#16A34A" : "#94A3B8",
            },
            {
              label: "AI uyreniw",
              value: settings.enableLearning ? "Yoqilgan" : "O'chirilgan",
              color: settings.enableLearning ? "#16A34A" : "#94A3B8",
            },
            {
              label: "Hammesini log",
              value: settings.logAllRequests ? "Ha" : "Yo'q",
              color: settings.logAllRequests ? "#2563EB" : "#94A3B8",
            },
            {
              label: "Jańalanǵan",
              value: new Date(settings.updatedAt).toLocaleString(),
              color: txtSub,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: `1px solid ${cardBdr}`,
              }}
            >
              <span style={{ color: txtSub, fontSize: 13 }}>{item.label}</span>
              <span
                style={{ fontWeight: 700, color: item.color, fontSize: 13 }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </Card>

        {/* Mantiq tushuntirish */}
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InfoCircleOutlined style={{ color: "#2563EB" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: txtMain }}>
                Anıqlaw logikası
              </span>
            </div>
          }
          style={{
            borderRadius: 14,
            border: `1px solid ${cardBdr}`,
            background: cardBg,
          }}
        >
          {[
            {
              title: "Ruxsat zonası",
              desc: "Soraw taza. Tikkeley ótkeriledi.",
              color: "#16A34A",
              range: "0 → ruxsat shegarası",
            },
            {
              title: "Baqlaw zonası",
              desc: "Gúmanlı, biraq anıq emes. Loglanǵan hám baqlanadı.",
              color: "#D97706",
              range: "ruxsat → aldaw shegarası",
            },
            {
              title: "Aldaw zonası",
              desc: "Qáwipli hújim anıqlandı. Aldawshı sistema qa baǵdarlanadı.",
              color: "#DC2626",
              range: "aldaw shegarasınan joqarı",
            },
          ].map((z) => (
            <div
              key={z.title}
              style={{
                marginBottom: 14,
                padding: "12px",
                borderRadius: 10,
                background: dark ? "#1E293B" : "#F8FAFC",
                border: `1px solid ${cardBdr}`,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: z.color,
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                {z.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: txtSub,
                  fontFamily: "monospace",
                  marginBottom: 4,
                }}
              >
                {z.range}
              </div>
              <div style={{ fontSize: 12, color: txtSub, lineHeight: 1.5 }}>
                {z.desc}
              </div>
            </div>
          ))}
        </Card>
      </Col>
    </Row>
  );
}
