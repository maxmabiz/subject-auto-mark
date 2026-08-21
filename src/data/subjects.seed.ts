import { CURRENT_USER } from "@/domain/constants";
import { buildSubjectLog } from "@/domain/subject/log";
import type { LedgerSubject, SubjectLog } from "@/domain/types";

const INIT = "2026-08-01T02:00:00.000Z";

type Node = { code: string; name: string; children?: Node[] };

const TREE: Node[] = [
  {
    code: "1001",
    name: "资金转账",
    children: [
      { code: "100101", name: "资金转账-货币兑换" },
      { code: "100102", name: "资金转账-付款" },
      { code: "100103", name: "资金转账-收款" },
    ],
  },
  {
    code: "1002",
    name: "电商业务",
    children: [
      { code: "100201", name: "电商业务-收款" },
      { code: "100202", name: "电商业务-其他费用" },
    ],
  },
  {
    code: "1003",
    name: "个人收支",
    children: [{ code: "100301", name: "个人收支" }],
  },
  {
    code: "1004",
    name: "公司费用",
    children: [
      { code: "100401", name: "公司费用-信息化费用" },
      {
        code: "100402",
        name: "公司费用-职工薪酬",
        children: [{ code: "10040201", name: "公司费用-职工薪酬-工资奖金" }],
      },
      { code: "100403", name: "公司费用-平台手续费" },
      { code: "100404", name: "公司费用-办公费" },
      { code: "100405", name: "公司费用-职工福利" },
    ],
  },
  {
    code: "1005",
    name: "公司收入",
    children: [
      { code: "100501", name: "公司收入-利息收入" },
      { code: "100502", name: "公司收入-其他收入" },
    ],
  },
  {
    code: "1006",
    name: "受限资金",
    children: [{ code: "100601", name: "受限资金" }],
  },
  {
    code: "1007",
    name: "广告业务",
    children: [
      {
        code: "100701",
        name: "广告业务-付款",
        children: [
          { code: "10070101", name: "广告业务-付款-客户退款" },
          { code: "10070102", name: "广告业务-付款-支付佣金" },
          { code: "10070103", name: "广告业务-付款-付代理商" },
        ],
      },
    ],
  },
  {
    code: "1008",
    name: "垫资业务",
    children: [
      { code: "100801", name: "垫资业务-收款" },
      {
        code: "100802",
        name: "垫资业务-付款",
        children: [{ code: "10080201", name: "垫资业务-付款-垫资结算" }],
      },
    ],
  },
  {
    code: "1009",
    name: "履约业务",
    children: [
      { code: "100901", name: "履约业务-采购付款" },
      {
        code: "100902",
        name: "履约业务-物流",
        children: [{ code: "10090201", name: "履约业务-付物流商" }],
      },
      {
        code: "100903",
        name: "履约业务-代发业务",
        children: [{ code: "10090301", name: "履约业务-代发业务-支付佣金" }],
      },
    ],
  },
];

function flatten(nodes: Node[], parentId: string | null, level: 1 | 2 | 3): LedgerSubject[] {
  return nodes.flatMap((node, index) => {
    const id = `SUB-${node.code}`;
    const current: LedgerSubject = {
      id,
      code: node.code,
      name: node.name,
      level,
      parentId,
      createdBy: index % 5 === 0 ? "系统" : CURRENT_USER,
      createdAt: INIT,
      updatedAt: INIT,
    };
    const nextLevel = (level + 1) as 2 | 3;
    const children = node.children?.length ? flatten(node.children, id, nextLevel) : [];
    return [current, ...children];
  });
}

export const FALLBACK_SUBJECTS: LedgerSubject[] = flatten(TREE, null, 1);
export const FALLBACK_SUBJECT_LOGS: SubjectLog[] = seedSubjectLogs(FALLBACK_SUBJECTS);

export function seedSubjectLogs(subjects: LedgerSubject[]): SubjectLog[] {
  const creates = subjects.map((item) =>
    buildSubjectLog({
      id: `slog-${item.id}-create`,
      subjectId: item.id,
      time: item.createdAt,
      actor: item.createdBy,
      action: "create",
      after: item,
    }),
  );

  const payroll = subjects.find((item) => item.code === "10040201");
  const refund = subjects.find((item) => item.code === "10070101");
  const extras: SubjectLog[] = [];

  if (payroll) {
    const before = { ...payroll, name: "公司费用-职工薪酬-工资" };
    payroll.updatedAt = "2026-08-10T11:20:00.000Z";
    extras.push(
      buildSubjectLog({
        id: "slog-SUB-10040201-update",
        subjectId: payroll.id,
        time: payroll.updatedAt,
        actor: "张敏",
        action: "update",
        before,
        after: payroll,
      }),
    );
  }
  if (refund) {
    const before = { ...refund, code: "10070109" };
    refund.updatedAt = "2026-08-12T15:40:00.000Z";
    extras.push(
      buildSubjectLog({
        id: "slog-SUB-10070101-update",
        subjectId: refund.id,
        time: refund.updatedAt,
        actor: CURRENT_USER,
        action: "update",
        before,
        after: refund,
      }),
    );
  }

  return [...extras, ...creates];
}
