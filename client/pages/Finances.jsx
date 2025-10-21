
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseForm from "../components/finances/ExpenseForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { format, startOfQuarter, endOfQuarter, addQuarters, startOfMonth, endOfMonth, addMonths, startOfYear, endOfYear, addYears, subMonths, subYears } from "date-fns";
import { DollarSign, TrendingUp, AlertCircle, Repeat, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Finances() {
  const queryClient = useQueryClient();

  // Reporting filters
  const [timeframe, setTimeframe] = useState("monthly"); // monthly, quarterly, yearly
  const [dataType, setDataType] = useState("all"); // all, revenue, expense, profit
  const [toolFilter, setToolFilter] = useState("all"); // all, or specific tool
  const [timelineRange, setTimelineRange] = useState([-12, 0]); // Months from now (negative = past, positive = future)

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list("-date"),
  });

  const { data: revenues = [] } = useQuery({
    queryKey: ['revenues'],
    queryFn: () => base44.entities.Revenue.list("-date"),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const createRevenueMutation = useMutation({
    mutationFn: (data) => base44.entities.Revenue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenues'] });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const categoryColors = {
    operations: "bg-blue-100 text-blue-800",
    marketing: "bg-purple-100 text-purple-800",
    software: "bg-green-100 text-green-800",
    payroll: "bg-orange-100 text-orange-800",
    equipment: "bg-red-100 text-red-800",
    travel: "bg-cyan-100 text-cyan-800",
    product_sales: "bg-green-100 text-green-800",
    services: "bg-blue-100 text-blue-800",
    subscriptions: "bg-purple-100 text-purple-800",
    consulting: "bg-amber-100 text-amber-800",
    other: "bg-gray-100 text-gray-800"
  };

  // Generate reporting data
  const reportingData = useMemo(() => {
    const data = [];
    const today = new Date();
    const [startRangeMonths, endRangeMonths] = timelineRange; // in months

    let periods = [];
    if (timeframe === "monthly") {
      for (let i = startRangeMonths; i <= endRangeMonths; i++) {
        const date = addMonths(today, i);
        periods.push({
          date,
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM yyyy'),
          isFuture: i > 0
        });
      }
    } else if (timeframe === "quarterly") {
      const startQuarterOffset = Math.floor(startRangeMonths / 3);
      const endQuarterOffset = Math.ceil(endRangeMonths / 3);
      for (let i = startQuarterOffset; i <= endQuarterOffset; i++) {
        const date = addQuarters(today, i);
        periods.push({
          date,
          start: startOfQuarter(date),
          end: endOfQuarter(date),
          label: `Q${Math.floor(date.getMonth() / 3) + 1} ${format(date, 'yyyy')}`,
          isFuture: i > 0
        });
      }
    } else if (timeframe === "yearly") {
      const startYearOffset = Math.floor(startRangeMonths / 12);
      const endYearOffset = Math.ceil(endRangeMonths / 12);
      for (let i = startYearOffset; i <= endYearOffset; i++) {
        const date = addYears(today, i);
        periods.push({
          date,
          start: startOfYear(date),
          end: endOfYear(date),
          label: format(date, 'yyyy'),
          isFuture: i > 0
        });
      }
    }

    let filteredRevenues = revenues;
    let filteredExpenses = expenses;

    if (toolFilter !== "all") {
      const lowerCaseToolFilter = toolFilter.toLowerCase();
      filteredRevenues = revenues.filter(r =>
        r.source?.toLowerCase() === lowerCaseToolFilter || r.category?.toLowerCase() === lowerCaseToolFilter
      );
      filteredExpenses = expenses.filter(e =>
        e.category?.toLowerCase() === lowerCaseToolFilter
      );
    }

    // Calculate historical averages for projections (only from past data)
    const historicalRevenue = filteredRevenues.filter(r => new Date(r.date) <= today);
    const historicalExpenses = filteredExpenses.filter(e => new Date(e.date) <= today);

    const sumHistoricalRevenue = historicalRevenue.reduce((sum, r) => sum + r.amount, 0);
    const sumHistoricalExpenses = historicalExpenses.reduce((sum, e) => sum + e.amount, 0);

    const firstHistoricalRevenueDate = historicalRevenue.length > 0 ? new Date(Math.min(...historicalRevenue.map(r => new Date(r.date).getTime()))) : today;
    const firstHistoricalExpenseDate = historicalExpenses.length > 0 ? new Date(Math.min(...historicalExpenses.map(e => new Date(e.date).getTime()))) : today;

    const earliestDate = new Date(Math.min(firstHistoricalRevenueDate.getTime(), firstHistoricalExpenseDate.getTime()));
    const monthsOfHistory = (today.getFullYear() - earliestDate.getFullYear()) * 12 + (today.getMonth() - earliestDate.getMonth());

    const avgMonthlyRevenue = monthsOfHistory > 0 ? sumHistoricalRevenue / monthsOfHistory : 0;
    const avgMonthlyExpense = monthsOfHistory > 0 ? sumHistoricalExpenses / monthsOfHistory : 0;

    // Process each period
    periods.forEach(period => {
      let periodRevenue, periodExpenses;

      if (period.isFuture) {
        // Project based on historical averages
        const monthsInPeriod = timeframe === "monthly" ? 1 : timeframe === "quarterly" ? 3 : 12;
        periodRevenue = avgMonthlyRevenue * monthsInPeriod;
        periodExpenses = avgMonthlyExpense * monthsInPeriod;
      } else {
        // Use actual data
        periodRevenue = filteredRevenues
          .filter(r => {
            const date = new Date(r.date);
            return date >= period.start && date <= period.end;
          })
          .reduce((sum, r) => sum + r.amount, 0);

        periodExpenses = filteredExpenses
          .filter(e => {
            const date = new Date(e.date);
            return date >= period.start && date <= period.end;
          })
          .reduce((sum, e) => sum + e.amount, 0);
      }

      data.push({
        period: period.label,
        revenue: periodRevenue,
        expenses: periodExpenses,
        profit: periodRevenue - periodExpenses,
        isFuture: period.isFuture
      });
    });

    return data;
  }, [revenues, expenses, timeframe, timelineRange, toolFilter]);

  // Tax Calculation Logic
  const currentQuarter = new Date();
  const quarterStart = startOfQuarter(currentQuarter);
  const quarterEnd = endOfQuarter(currentQuarter);

  const quarterRevenue = revenues
    .filter(r => {
      const date = new Date(r.date);
      return date >= quarterStart && date <= quarterEnd;
    })
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const quarterExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date >= quarterStart && date <= quarterEnd;
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const quarterProfit = quarterRevenue - quarterExpenses;

  // Estimated tax rates (adjust based on your business structure)
  const federalTaxRate = 0.21; // 21% corporate tax
  const stateTaxRate = 0.05; // Example 5% state tax
  const selfEmploymentRate = 0.153; // 15.3% if self-employed

  const estimatedFederalTax = quarterProfit > 0 ? quarterProfit * federalTaxRate : 0;
  const estimatedStateTax = quarterProfit > 0 ? quarterProfit * stateTaxRate : 0;
  const estimatedSelfEmploymentTax = quarterProfit > 0 ? quarterProfit * selfEmploymentRate : 0;
  const totalEstimatedTax = estimatedFederalTax + estimatedStateTax + estimatedSelfEmploymentTax;

  // Recurring expenses
  const recurringExpenses = expenses.filter(e => e.is_recurring);

  const toggleExpenseActive = (expense) => {
    updateExpenseMutation.mutate({
      id: expense.id,
      data: { ...expense, is_active: !expense.is_active }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Financial Management
        </h1>
        <p className="text-slate-600">Track finances, manage expenses, and estimate taxes.</p>
      </div>

      <Tabs defaultValue="reporting" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="taxes">Tax Estimate</TabsTrigger>
        </TabsList>

        <TabsContent value="reporting" className="space-y-6">
          {/* Filters */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="timeframe" className="text-sm font-medium text-slate-700">Timeframe</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="dataType" className="text-sm font-medium text-slate-700">Data Type</label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger id="dataType">
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Revenue, Expenses, Profit)</SelectItem>
                      <SelectItem value="revenue">Revenue Only</SelectItem>
                      <SelectItem value="expenses">Expenses Only</SelectItem>
                      <SelectItem value="profit">Profit Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="toolFilter" className="text-sm font-medium text-slate-700">Tool Filter</label>
                  <Select value={toolFilter} onValueChange={setToolFilter}>
                    <SelectTrigger id="toolFilter">
                      <SelectValue placeholder="Filter by tool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tools</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="etsy">Etsy</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="software">Software (Expense)</SelectItem>
                      <SelectItem value="marketing">Marketing (Expense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Timeline Range (Months)</label>
                  <span className="text-xs text-slate-500">
                    {timelineRange[0]} to {timelineRange[1]} months relative to today
                  </span>
                </div>
                <Slider
                  value={timelineRange}
                  onValueChange={setTimelineRange}
                  min={-24}
                  max={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>2 years ago</span>
                  <span>Today</span>
                  <span>1 year future</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Financial Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="period"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    itemStyle={{ padding: '0', margin: '0' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />

                  {(dataType === "all" || dataType === "revenue") && (
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, index } = props;
                        const payload = reportingData[index];
                        return (
                          <circle
                            key={`dot-revenue-${index}`}
                            cx={cx}
                            cy={cy}
                            r={payload?.isFuture ? 5 : 4}
                            fill={payload?.isFuture ? "white" : "#10b981"}
                            stroke={payload?.isFuture ? "#10b981" : "none"}
                            strokeWidth={payload?.isFuture ? 2 : 0}
                          />
                        );
                      }}
                      strokeDasharray={reportingData.some(d => d.isFuture) ? "5 5" : "0"}
                    />
                  )}

                  {(dataType === "all" || dataType === "expenses") && (
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, index } = props;
                        const payload = reportingData[index];
                        return (
                          <circle
                            key={`dot-expenses-${index}`}
                            cx={cx}
                            cy={cy}
                            r={payload?.isFuture ? 5 : 4}
                            fill={payload?.isFuture ? "white" : "#ef4444"}
                            stroke={payload?.isFuture ? "#ef4444" : "none"}
                            strokeWidth={payload?.isFuture ? 2 : 0}
                          />
                        );
                      }}
                      strokeDasharray={reportingData.some(d => d.isFuture) ? "5 5" : "0"}
                    />
                  )}

                  {(dataType === "all" || dataType === "profit") && (
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, index } = props;
                        const payload = reportingData[index];
                        return (
                          <circle
                            key={`dot-profit-${index}`}
                            cx={cx}
                            cy={cy}
                            r={payload?.isFuture ? 5 : 4}
                            fill={payload?.isFuture ? "white" : "#3b82f6"}
                            stroke={payload?.isFuture ? "#3b82f6" : "none"}
                            strokeWidth={payload?.isFuture ? 2 : 0}
                          />
                        );
                      }}
                      strokeDasharray={reportingData.some(d => d.isFuture) ? "5 5" : "0"}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Dashed lines indicate that the data range includes projected future values. Hollow dots indicate projected values.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Detailed Data</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      {(dataType === "all" || dataType === "revenue") && <TableHead className="text-right">Revenue</TableHead>}
                      {(dataType === "all" || dataType === "expenses") && <TableHead className="text-right">Expenses</TableHead>}
                      {(dataType === "all" || dataType === "profit") && <TableHead className="text-right">Profit</TableHead>}
                      <TableHead className="text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportingData.map((row, idx) => (
                      <TableRow key={idx} className={row.isFuture ? 'bg-blue-50/50' : ''}>
                        <TableCell className="font-medium">
                          {row.period}
                          {row.isFuture && (
                            <Badge variant="outline" className="ml-2 text-xs">Projected</Badge>
                          )}
                        </TableCell>
                        {(dataType === "all" || dataType === "revenue") && (
                          <TableCell className="text-right font-semibold text-green-600">
                            ${row.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                        )}
                        {(dataType === "all" || dataType === "expenses") && (
                          <TableCell className="text-right font-semibold text-red-600">
                            ${row.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                        )}
                        {(dataType === "all" || dataType === "profit") && (
                          <TableCell className={`text-right font-semibold ${row.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ${row.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          {row.isFuture ? (
                            <Badge variant="secondary" className="text-xs">Forecast</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Actual</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportingData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                          No data available for selected filters and timeframe.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseForm
            onSubmit={(data) => createExpenseMutation.mutate(data)}
            isSubmitting={createExpenseMutation.isPending}
          />

          {/* Recurring Expenses Section */}
          {recurringExpenses.length > 0 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Recurring Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recurringExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{expense.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={categoryColors[expense.category]}>
                            {expense.category}
                          </Badge>
                          <span className="text-sm text-slate-500">{expense.frequency}</span>
                          <span className="text-sm font-semibold text-slate-700">
                            ${expense.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">
                          {expense.is_active !== false ? 'Active' : 'Paused'}
                        </span>
                        <Switch
                          checked={expense.is_active !== false}
                          onCheckedChange={() => toggleExpenseActive(expense)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Expense History</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell>
                        <Badge className={categoryColors[expense.category]}>
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-red-600">
                        ${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {expense.is_recurring && (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="w-3 h-3" />
                            {expense.frequency}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No expenses recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          {/* Quarter Overview */}
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl">
                Q{Math.floor((currentQuarter.getMonth() / 3) + 1)} {currentQuarter.getFullYear()} Tax Estimate
              </CardTitle>
              <p className="text-sm text-slate-600">
                {format(quarterStart, 'MMM d')} - {format(quarterEnd, 'MMM d, yyyy')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${quarterRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${quarterExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <p className="text-sm text-slate-600 mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${quarterProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Breakdown */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Estimated Tax Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Federal Income Tax</p>
                    <p className="text-sm text-slate-500">21% of net profit</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    ${estimatedFederalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">State Income Tax</p>
                    <p className="text-sm text-slate-500">5% of net profit (estimated)</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    ${estimatedStateTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Self-Employment Tax</p>
                    <p className="text-sm text-slate-500">15.3% (Social Security & Medicare)</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900">
                    ${estimatedSelfEmploymentTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg border-2 border-amber-300">
                  <div>
                    <p className="font-bold text-slate-900 text-lg">Total Estimated Tax</p>
                    <p className="text-sm text-slate-600">Due for this quarter</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    ${totalEstimatedTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Important Tax Information</p>
                    <p className="text-sm text-blue-700">
                      These are estimates based on your current financial data. Actual tax liability may vary based on deductions, credits, and your specific tax situation. Consult with a tax professional for accurate filing.
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      <strong>Quarterly payment deadline:</strong> {format(addQuarters(quarterEnd, 0), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Planning Tips */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tax Planning Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-slate-700">Track all business expenses throughout the year to maximize deductions</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-slate-700">Make quarterly estimated tax payments to avoid penalties</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-slate-700">Consider tax-advantaged retirement contributions (SEP-IRA, Solo 401k)</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-slate-700">Keep digital records of all receipts and invoices</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
