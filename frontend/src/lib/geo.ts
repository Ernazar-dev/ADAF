export interface GeoInfo {
  flag: string;
  country: string;
  city: string;
  isp: string;
}

// Shaxsiy tarmoq IP lari — geolokatsiya ishlamaydi
const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|fc|fd)/i;

// Kesh: bir xil IP ni qayta so'ramaslik uchun
const cache = new Map<string, GeoInfo>();

const FALLBACK: GeoInfo = {
  flag: "🌐",
  country: "Unknown",
  city: "Unknown",
  isp: "Unknown",
};

const LOCAL: GeoInfo = {
  flag: "🏠",
  country: "Local Network",
  city: "Private",
  isp: "Internal",
};

export async function getGeoFromIp(ip: string): Promise<GeoInfo> {
  const cleanIp = ip.replace(/^::ffff:/, "");

  if (PRIVATE_IP_RE.test(cleanIp)) return LOCAL;

  if (cache.has(cleanIp)) return cache.get(cleanIp)!;

  try {
    const res = await fetch(`https://ipwho.is/${cleanIp}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    if (!data.success) throw new Error("Lookup failed");

    const info: GeoInfo = {
      flag:    data.flag?.emoji  ?? "🌐",
      country: data.country      ?? "Unknown",
      city:    data.city         ?? "Unknown",
      isp:     data.connection?.isp ?? data.connection?.org ?? "Unknown",
    };

    cache.set(cleanIp, info);
    return info;
  } catch {
    return FALLBACK;
  }
}
