/** 演示用虚构账号。导入/回退数据里的真实账户名会映射到这里。 */
const MOCK_ACCOUNT_ALIASES: Record<string, string> = {
  "PAYPAL-HQY-44414@qq.com": "PayPal-A01",
  "PAYPAL-HQY-fleck@outlook.com": "PayPal-A02",
  "PAYPAL-HQY-nksea@163.com": "PayPal-A03",
  "PingPong-BESTTECH-B2C": "PingPong-A01",
  "Worldfirst-besttech": "Worldfirst-A01",
  "Worldfirst-muxuehk01": "Worldfirst-A02",
  "Worldfirst-muxue": "Worldfirst-A03",
  "Worldfirst-Besttech01": "Worldfirst-A04",
  "Worldfirst-BST": "Worldfirst-A05",
  "Worldfirst-BYWISE": "Worldfirst-A06",
  "Worldfirst-muxue02": "Worldfirst-A07",
  "WorldFirst-LUZHENNAN": "Worldfirst-A08",
  "Payoneer-HQY": "Payoneer-A01",
  "Airwallex-HQY": "Airwallex-A01",
  "DAHSING-HK": "DAHSING-A01",
  "HSBC-HK-001": "HSBC-A01",
  "HSBC-HK": "HSBC-A01",
};

export function mockAccount(account: string): string {
  return MOCK_ACCOUNT_ALIASES[account] ?? account;
}

const ENTITY_BY_ACCOUNT: Record<string, string> = {
  "PayPal-A01": "浩乾易有限公司",
  "PayPal-A02": "浩乾易有限公司",
  "PayPal-A03": "浩乾易有限公司",
  "Payoneer-A01": "浩乾易有限公司",
  "Airwallex-A01": "浩乾易有限公司",
  "DAHSING-A01": "浩乾易有限公司",
  "HSBC-A01": "浩乾易有限公司",
  "PingPong-A01": "星澜贸易有限公司",
  "Worldfirst-A01": "星澜贸易有限公司",
  "Worldfirst-A04": "星澜贸易有限公司",
  "Worldfirst-A05": "星澜贸易有限公司",
  "Worldfirst-A02": "北辰国际有限公司",
  "Worldfirst-A03": "北辰国际有限公司",
  "Worldfirst-A07": "北辰国际有限公司",
  "Worldfirst-A06": "云启电商有限公司",
  "Worldfirst-A08": "远航供应链有限公司",
};

export function mockEntityName(account: string, platform = ""): string {
  const mapped = ENTITY_BY_ACCOUNT[mockAccount(account)];
  if (mapped) return mapped;
  return platform.trim() ? "浩乾易有限公司" : "";
}
