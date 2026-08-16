import { buildChannelRuleLog } from "@/domain/channel/log";
import type { ChannelRuleLog, Rule, SubjectPath } from "@/domain/types";

const ACTORS = ["财务管理员", "张敏", "李晓雯", "王磊"] as const;

function withSubject(rule: Rule, subject: SubjectPath): Rule {
  return { ...rule, subject };
}

function previousSubject(rule: Rule): SubjectPath {
  const { level1, level2, level3 } = rule.subject;
  if (level3) return { level1, level2, level3: null };
  if (level2.includes("收款")) return { level1, level2: `${level1}-其他费用`, level3: null };
  if (level2.includes("付款")) return { level1, level2: `${level1}-收款`, level3: null };
  return { level1, level2: `${level1}-其他`, level3: null };
}

function touch(rule: Rule, time: string) {
  if (time > (rule.updatedAt || "")) rule.updatedAt = time;
}

function extraLog(
  rule: Rule,
  suffix: string,
  time: string,
  actor: string,
  action: "update" | "import",
  before: Rule,
  after: Rule = rule,
): ChannelRuleLog {
  touch(rule, time);
  return buildChannelRuleLog({
    id: `crlog-${rule.id}-${suffix}`,
    ruleId: rule.id,
    time,
    actor,
    action,
    before,
    after,
  });
}

/** 为平台规则补一批可演示的变更记录：每条都有新增，部分再叠加导入/编辑。 */
export function seedChannelRuleLogs(rules: Rule[]): ChannelRuleLog[] {
  const byId = new Map(rules.map((item) => [item.id, item]));
  const logs: ChannelRuleLog[] = rules.map((item) =>
    buildChannelRuleLog({
      id: `crlog-${item.id}-create`,
      ruleId: item.id,
      time: item.createdAt,
      actor: "系统",
      action: "create",
      after: item,
    }),
  );

  const shopify = byId.get("R003");
  const cardCharge = byId.get("R016");
  const salary = byId.get("R017");
  const reserve = byId.get("R023");
  const inbound = byId.get("R047");
  const alibaba = byId.get("R052");
  const conversion = byId.get("R057");
  const shopifyPay = byId.get("R070");
  const cardPay = byId.get("R073");
  const showcase = new Set(["R003", "R016", "R017", "R023", "R047", "R052", "R057", "R070", "R073"]);

  if (shopify) {
    logs.push(
      extraLog(shopify, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", shopify, shopify),
      extraLog(shopify, "update", "2026-08-10T09:20:00.000Z", "财务管理员", "update", withSubject(shopify, { level1: "电商业务", level2: "电商业务-其他费用", level3: null })),
    );
  }
  if (cardCharge) {
    logs.push(
      extraLog(cardCharge, "update", "2026-08-08T14:22:00.000Z", "王磊", "update", withSubject(cardCharge, { level1: "公司费用", level2: "公司费用-平台手续费", level3: null })),
    );
  }
  if (salary) {
    logs.push(
      extraLog(salary, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", salary, salary),
      extraLog(salary, "update", "2026-08-12T16:40:00.000Z", "财务管理员", "update", withSubject(salary, { level1: "公司费用", level2: "公司费用-职工薪酬", level3: null })),
    );
  }
  if (reserve) {
    logs.push(
      extraLog(reserve, "update", "2026-08-09T09:12:00.000Z", "张敏", "update", withSubject(reserve, { level1: "资金转账", level2: "资金转账-付款", level3: null })),
    );
  }
  if (inbound) {
    logs.push(
      extraLog(inbound, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", inbound, inbound),
      extraLog(inbound, "update", "2026-08-13T10:05:00.000Z", "王磊", "update", withSubject(inbound, { level1: "电商业务", level2: "电商业务-其他费用", level3: null })),
    );
  }
  if (alibaba) {
    logs.push(
      extraLog(alibaba, "update", "2026-08-11T15:28:00.000Z", "张敏", "update", withSubject(alibaba, { level1: "履约业务", level2: "履约业务-其他费用", level3: null })),
    );
  }
  if (conversion) {
    logs.push(
      extraLog(conversion, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", conversion, conversion),
      extraLog(conversion, "update", "2026-08-12T14:08:00.000Z", "财务管理员", "update", withSubject(conversion, { level1: "资金转账", level2: "资金转账-付款", level3: null })),
    );
  }
  if (shopifyPay) {
    logs.push(
      extraLog(shopifyPay, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", shopifyPay, shopifyPay),
      extraLog(shopifyPay, "update", "2026-08-14T17:18:00.000Z", "财务管理员", "update", withSubject(shopifyPay, { level1: "资金转账", level2: "资金转账-收款", level3: null })),
    );
  }
  if (cardPay) {
    logs.push(
      extraLog(cardPay, "update", "2026-08-16T09:40:00.000Z", "王磊", "update", withSubject(cardPay, { level1: "电商业务", level2: "电商业务-收款", level3: null })),
    );
  }

  for (const rule of rules) {
    if (showcase.has(rule.id)) continue;
    const older = withSubject(rule, previousSubject(rule));
    if (rule.excelRow % 4 === 0) {
      logs.push(extraLog(rule, "import", "2026-08-05T10:18:00.000Z", "李晓雯", "import", older));
    } else if (rule.excelRow % 5 === 0) {
      const actor = ACTORS[rule.excelRow % ACTORS.length];
      const day = 6 + (rule.excelRow % 10);
      logs.push(extraLog(rule, "update", `2026-08-${String(day).padStart(2, "0")}T13:20:00.000Z`, actor, "update", older));
    }
  }

  return logs;
}
