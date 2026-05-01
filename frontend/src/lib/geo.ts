interface GeoInfo { flag: string; country: string; city: string; isp: string; }

const GEO_DATA: GeoInfo[] = [
  { flag: "🇨🇳", country: "China", city: "Shanghai", isp: "China Telecom" },
  { flag: "🇷🇺", country: "Russia", city: "Moscow", isp: "Rostelecom" },
  { flag: "🇧🇷", country: "Brazil", city: "São Paulo", isp: "NET Virtua" },
  { flag: "🇮🇷", country: "Iran", city: "Tehran", isp: "Irancell" },
  { flag: "🇩🇪", country: "Germany", city: "Frankfurt", isp: "Deutsche Telekom" },
  { flag: "🇰🇵", country: "North Korea", city: "Pyongyang", isp: "Star JV" },
  { flag: "🇺🇦", country: "Ukraine", city: "Kyiv", isp: "Ukrtelecom" },
  { flag: "🇻🇳", country: "Vietnam", city: "Hanoi", isp: "VNPT" },
  { flag: "🇳🇬", country: "Nigeria", city: "Lagos", isp: "MTN Nigeria" },
  { flag: "🇷🇴", country: "Romania", city: "Bucharest", isp: "RCS & RDS" },
  { flag: "🇵🇱", country: "Poland", city: "Warsaw", isp: "Orange Polska" },
  { flag: "🇹🇷", country: "Turkey", city: "Istanbul", isp: "Turk Telekom" },
  { flag: "🇮🇳", country: "India", city: "Mumbai", isp: "Jio" },
  { flag: "🇵🇰", country: "Pakistan", city: "Karachi", isp: "PTCL" },
  { flag: "🇧🇬", country: "Bulgaria", city: "Sofia", isp: "Vivacom" },
];

function hashIp(ip: string): number {
  let hash = 0;
  for (const ch of ip) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return hash;
}

export function getGeoFromIp(ip: string): GeoInfo {
  return GEO_DATA[hashIp(ip) % GEO_DATA.length]!;
}
