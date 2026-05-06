import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import {
  TrendingUp, IndianRupee, FileText, AlertCircle, Loader2,
  ArrowUpRight, ArrowDownRight, Package, // ✅ added
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, ReferenceLine,
} from "recharts";
import {
  format, startOfDay, startOfMonth, startOfYear,
  subDays, subMonths, subYears,
  eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval,
} from "date-fns";
import { inr } from "@/lib/format";

interface Row {
  created_at: string;
  final_amount: number;
  paid_amount: number;
  due_amount: number;
  profit: number;
}

/* ✅ NEW */
interface Product {
  stock_qty: number;
  cost_price: number;
}

type Range = "daily" | "monthly" | "yearly";

/* ── custom tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background shadow-lg p-3 text-sm min-w-[140px]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-semibold text-foreground">{inr(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [range, setRange] = useState<Range>("monthly");

  /* ── invoices ── */
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("created_at, final_amount, paid_amount, due_amount, profit")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  /* ✅ NEW: products query */
  const { data: products = [] } = useQuery({
    queryKey: ["products-dashboard", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("stock_qty, cost_price");
      if (error) throw error;
      return data ?? [];
    },
  });

  /* ── totals ── */
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.sales  += Number(r.final_amount) || 0;
        acc.profit += Number(r.profit)       || 0;
        acc.due    += Number(r.due_amount)   || 0;
        acc.paid   += Number(r.paid_amount)  || 0;
        acc.count  += 1;
        return acc;
      },
      { sales: 0, profit: 0, due: 0, paid: 0, count: 0 },
    );
  }, [rows]);

  /* ✅ NEW: inventory calculation */
  const inventoryValue = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + Number(p.stock_qty) * Number(p.cost_price),
      0
    );
  }, [products]);

  const marginPct = totals.sales > 0
    ? ((totals.profit / totals.sales) * 100).toFixed(1)
    : "0.0";

  const buildSeries = (r: Range) => {
    const now = new Date();
    let buckets: { key: string; label: string }[] = [];
    let bucketize: (d: Date) => string;

    if (r === "daily") {
      const start = subDays(startOfDay(now), 29);
      buckets = eachDayOfInterval({ start, end: now }).map((d) => ({
        key: format(d, "yyyy-MM-dd"), label: format(d, "dd MMM"),
      }));
      bucketize = (d) => format(startOfDay(d), "yyyy-MM-dd");
    } else if (r === "monthly") {
      const start = subMonths(startOfMonth(now), 11);
      buckets = eachMonthOfInterval({ start, end: now }).map((d) => ({
        key: format(d, "yyyy-MM"), label: format(d, "MMM yy"),
      }));
      bucketize = (d) => format(startOfMonth(d), "yyyy-MM");
    } else {
      const start = subYears(startOfYear(now), 4);
      buckets = eachYearOfInterval({ start, end: now }).map((d) => ({
        key: format(d, "yyyy"), label: format(d, "yyyy"),
      }));
      bucketize = (d) => format(startOfYear(d), "yyyy");
    }

    const map = new Map(buckets.map((b) => [b.key, { label: b.label, sales: 0, profit: 0 }]));
    for (const row of rows) {
      const k = bucketize(new Date(row.created_at));
      const e = map.get(k);
      if (e) {
        e.sales  += Number(row.final_amount) || 0;
        e.profit += Number(row.profit)       || 0;
      }
    }
    return Array.from(map.values());
  };

  const chartData = useMemo(() => buildSeries(range), [rows, range]);

  const collectionRate = totals.sales > 0
    ? Math.round((totals.paid / totals.sales) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your sales, profit &amp; outstanding payments
          </p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 border border-border/50 px-3 py-1.5 rounded-lg font-medium">
          {format(new Date(), "dd MMMM yyyy")}
        </span>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Sales"
          value={inr(totals.sales)}
          icon={<IndianRupee className="h-4 w-4" />}
          iconClass="bg-blue-50 text-blue-600"
          accentClass="bg-blue-500"
          sub={`${totals.count} invoices`}
          positive
        />
        <StatCard
          label="Total Profit"
          value={inr(totals.profit)}
          icon={<TrendingUp className="h-4 w-4" />}
          iconClass="bg-emerald-50 text-emerald-600"
          accentClass="bg-emerald-500"
          sub={`${marginPct}% margin`}
          positive
        />
        <StatCard
          label="Amount Due"
          value={inr(totals.due)}
          icon={<AlertCircle className="h-4 w-4" />}
          iconClass="bg-amber-50 text-amber-600"
          accentClass="bg-amber-500"
          sub={`${100 - collectionRate}% uncollected`}
          positive={false}
        />
        <StatCard
          label="Total Invoices"
          value={String(totals.count)}
          icon={<FileText className="h-4 w-4" />}
          iconClass="bg-violet-50 text-violet-600"
          accentClass="bg-violet-500"
          sub={`₹${totals.count > 0 ? Math.round(totals.sales / totals.count).toLocaleString("en-IN") : 0} avg`}
          positive
        />

        {/* ✅ NEW INVENTORY CARD */}
        <StatCard
          label="Inventory Value"
          value={inr(inventoryValue)}
          icon={<Package className="h-4 w-4" />}
          iconClass="bg-cyan-50 text-cyan-600"
          accentClass="bg-cyan-500"
          sub="Cost based stock value"
          positive
        />
      </div>

    {/* ── Collection progress bar ── */}
<div className="bg-background rounded-xl border border-border/60 px-5 py-4">
  <div className="flex items-center justify-between mb-2.5">
    <span className="text-sm font-medium text-foreground">Collection rate</span>
    <span className="text-sm font-semibold font-mono text-foreground">{collectionRate}%</span>
  </div>
  <div className="h-2 rounded-full bg-muted overflow-hidden">
    <div
      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
      style={{ width: `${collectionRate}%` }}
    />
  </div>
</div>
      {/* ── Charts ── */}
<div className="bg-background rounded-xl border border-border/60 overflow-hidden">

  {/* Toolbar */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
    <div>
      <h2 className="text-sm font-semibold text-foreground">Sales & Profit</h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        {range === "daily" ? "Last 30 days" : range === "monthly" ? "Last 12 months" : "Last 5 years"}
      </p>
    </div>

    <div className="flex gap-1 bg-muted/50 rounded-lg p-1 border border-border/40">
      {(["daily", "monthly", "yearly"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`px-3 py-1.5 rounded-md text-xs ${
            range === r ? "bg-background border" : "text-muted-foreground"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  </div>

  <div className="p-5 space-y-6">

    {/* Line chart */}
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />

          <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Sales" />
          <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Bar chart */}
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} />

          <Bar dataKey="profit" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>

  </div>
</div>

    </div>
  );
}

/* ── StatCard ── */
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  accentClass: string;
  sub: string;
  positive: boolean;
}



function StatCard({ label, value, icon, iconClass, accentClass, sub, positive }: StatCardProps) {
  return (
    <div className="relative bg-background rounded-xl border border-border/60 p-4 overflow-hidden shadow-none">
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${iconClass}`}>
          {icon}
        </div>
        {positive
          ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          : <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
        }
      </div>
      <div className="text-xl font-semibold font-mono tracking-tight leading-none">{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground mt-1.5">{label}</div>
      <div className="text-[11px] text-muted-foreground/70 font-mono mt-0.5">{sub}</div>
    </div>
  );
}