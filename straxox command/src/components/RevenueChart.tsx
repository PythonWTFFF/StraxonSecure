import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 38000 },
  { month: "Mar", revenue: 55000 },
  { month: "Apr", revenue: 47000 },
  { month: "May", revenue: 62000 },
  { month: "Jun", revenue: 58000 },
  { month: "Jul", revenue: 71000 },
  { month: "Aug", revenue: 68000 },
  { month: "Sep", revenue: 74000 },
  { month: "Oct", revenue: 82000 },
  { month: "Nov", revenue: 79000 },
  { month: "Dec", revenue: 91000 },
];

export function RevenueChart() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">FY 2025-26 · 12M Rolling</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-2 h-2 rounded-full bg-primary" />
          INR
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185 100% 50%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(185 100% 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" />
          <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
          <YAxis stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222 47% 5%)",
              border: "1px solid hsl(215 25% 18%)",
              borderRadius: "8px",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
              color: "hsl(210 40% 92%)",
            }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(185 100% 50%)" strokeWidth={2} fill="url(#revenueGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
