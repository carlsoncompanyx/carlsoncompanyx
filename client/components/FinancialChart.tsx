import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3))",
  },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type FinancialChartPoint = {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export default function FinancialChart({
  title = "Chart",
  data,
}: {
  title?: string;
  data: FinancialChartPoint[];
}) {
  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>

      <div className="w-full overflow-hidden">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart data={data} margin={{ left: 16, right: 16, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) =>
                  typeof value === "number" ? currencyFormatter.format(value) : value
                }
                width={80}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (typeof value === "number") {
                        return [currencyFormatter.format(value), name];
                      }
                      return [value, name];
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot />
              <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot />
              <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} dot />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">
            Financial data will appear here once records are available.
          </div>
        )}
      </div>
    </div>
  );
}
