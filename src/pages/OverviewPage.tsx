import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";
import { AlertTriangle, CircleSlash, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { displayPlatform, SOURCE_LABEL } from "@/domain/constants";
import { formatPercent } from "@/lib/format";
import { useAppStore } from "@/store/AppStore";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";

const PIE_COLORS = {
  manual: "#7c3aed",
  feishu: "#0f9d8a",
  channel: "#2563eb",
  none: "#94a3b8",
};

export function OverviewPage() {
  const { loading, error, records, updatedAt } = useAppStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = records.length;
    const marked = records.filter((item) => item.final.subject).length;
    const auto = records.filter((item) => item.final.source === "channel" || item.final.source === "feishu").length;
    const unmatched = records.filter((item) => item.final.status === "unmatched").length;
    const conflict = records.filter((item) => item.final.status === "rule_conflict").length;
    const dataError = records.filter((item) => item.final.status === "data_error").length;
    const manual = records.filter((item) => item.final.source === "manual").length;
    const autoMarked = records.filter((item) => item.final.source === "channel" || item.final.source === "feishu" || item.final.source === "manual").length;
    return {
      total,
      marked,
      autoCoverage: total ? auto / total : 0,
      unmatched,
      conflict,
      dataError,
      manualRate: autoMarked ? manual / autoMarked : 0,
      source: [
        { name: SOURCE_LABEL.manual, key: "manual", value: records.filter((item) => item.final.source === "manual").length },
        { name: SOURCE_LABEL.feishu, key: "feishu", value: records.filter((item) => item.final.source === "feishu").length },
        { name: SOURCE_LABEL.channel, key: "channel", value: records.filter((item) => item.final.source === "channel").length },
        { name: SOURCE_LABEL.none, key: "none", value: records.filter((item) => item.final.source === "none").length },
      ],
    };
  }, [records]);

  const platformCoverage = useMemo(() => {
    const groups = new Map<string, { total: number; marked: number }>();
    for (const record of records) {
      const name = displayPlatform(record.transaction.platform) || "未知平台";
      const current = groups.get(name) ?? { total: 0, marked: 0 };
      current.total += 1;
      if (record.final.subject) current.marked += 1;
      groups.set(name, current);
    }
    const order = ["Payoneer", "PayPal", "Worldfirst", "PingPong", "Airwallex", "DAHSING", "HSBC"];
    return order
      .filter((name) => groups.has(name))
      .concat([...groups.keys()].filter((name) => !order.includes(name)))
      .map((name) => {
        const item = groups.get(name)!;
        return { name, coverage: item.total ? Number(((item.marked / item.total) * 100).toFixed(1)) : 0, marked: item.marked, total: item.total };
      });
  }, [records]);

  const trend = useMemo(() => {
    const days: { date: string; matched: number; pending: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date("2026-08-15T00:00:00+08:00");
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const ofDay = records.filter((item) => item.transaction.transactionTime.slice(0, 10) === key);
      days.push({
        date: key.slice(5),
        matched: ofDay.filter((item) => item.final.subject).length,
        pending: ofDay.filter((item) => !item.final.subject).length,
      });
    }
    return days;
  }, [records]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!records.length) return <EmptyState title="暂无流水" description="当前还没有可用于统计的模拟流水。" />;

  const kpis = [
    { label: "流水总数", value: stats.total.toLocaleString() },
    { label: "已标记流水数", value: stats.marked.toLocaleString() },
    { label: "自动匹配覆盖率", value: formatPercent(stats.autoCoverage) },
    { label: "未匹配数", value: String(stats.unmatched), tone: "slate" },
    { label: "规则冲突数", value: String(stats.conflict), tone: "orange" },
    { label: "人工修改率", value: formatPercent(stats.manualRate) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">数据概览</h1>
        <p className="mt-1 text-sm text-muted">统计周期 2026-08-09 至 2026-08-15 · 数据更新 {updatedAt ? updatedAt.slice(0, 16).replace("T", " ") : "—"}</p>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{
          key: "unmatched",
          label: "未匹配",
          count: stats.unmatched,
          icon: CircleSlash,
          desc: "没有任何规则命中，需人工确认科目",
        }, {
          key: "conflict",
          label: "规则冲突",
          count: stats.conflict,
          icon: AlertTriangle,
          desc: "最高优先级规则指向不同科目",
        }, {
          key: "error",
          label: "数据异常",
          count: stats.dataError,
          icon: ShieldAlert,
          desc: "缺少平台、账号或规则所需字段",
        }].map((item) => (
          <button
            key={item.key}
            className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-300"
            onClick={() => navigate(`/exceptions?tab=${item.key}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <item.icon className="h-4 w-4 text-brand-700" />
                {item.label}
              </div>
              <div className="text-xl font-semibold">{item.count}</div>
            </div>
            <p className="mt-2 text-xs text-muted">{item.desc} · 点击查看待处理列表</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>标记来源分布</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.source} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {stats.source.map((item) => (
                    <Cell key={item.key} fill={PIE_COLORS[item.key as keyof typeof PIE_COLORS]} />
                  ))}
                </Pie>
                <Legend />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>各平台匹配覆盖率</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformCoverage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="%" />
                <RechartsTooltip formatter={(value) => [`${value}%`, "覆盖率"]} />
                <Bar dataKey="coverage" fill="#2b5fc7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>最近 7 日流水匹配趋势</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="matched" name="已标记" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" name="待处理" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
