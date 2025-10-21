import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, ShoppingBag, Eye, Heart, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function Metrics() {
  const { data: youtubeMetrics = [] } = useQuery({
    queryKey: ['youtube_metrics'],
    queryFn: () => base44.entities.YouTubeMetric.list("-date"),
  });

  const { data: etsyMetrics = [] } = useQuery({
    queryKey: ['etsy_metrics'],
    queryFn: () => base44.entities.EtsyMetric.list("-date"),
  });

  const latestYouTube = youtubeMetrics[0] || {};
  const latestEtsy = etsyMetrics[0] || {};

  const youtubeChartData = youtubeMetrics.slice(0, 30).reverse().map(m => ({
    date: format(new Date(m.date), 'MMM d'),
    views: m.views,
    subscribers: m.subscribers
  }));

  const etsyChartData = etsyMetrics.slice(0, 30).reverse().map(m => ({
    date: format(new Date(m.date), 'MMM d'),
    views: m.views,
    orders: m.orders
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          Performance Metrics
        </h1>
        <p className="text-slate-600">Track your YouTube and Etsy performance.</p>
      </div>

      <Tabs defaultValue="youtube">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="youtube" className="gap-2">
            <Youtube className="w-4 h-4" />
            YouTube
          </TabsTrigger>
          <TabsTrigger value="etsy" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            Etsy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="youtube" className="space-y-6 mt-6">
          {/* YouTube KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-red-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Total Views</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestYouTube.views?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-red-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Subscribers</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestYouTube.subscribers?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heart className="w-8 h-8 text-red-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Likes</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestYouTube.likes?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Youtube className="w-8 h-8 text-red-600" />
                  <span className="text-sm text-slate-500">Comments</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">Engagement</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestYouTube.comments?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* YouTube Chart */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Views & Subscribers Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={youtubeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Additional YouTube Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle>Watch Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 mb-2">
                  {latestYouTube.watch_time_hours?.toLocaleString() || "0"}
                  <span className="text-lg text-slate-500 ml-2">hours</span>
                </p>
                <p className="text-sm text-slate-600">Total watch time this period</p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle>Videos Published</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 mb-2">
                  {latestYouTube.videos_published || "0"}
                </p>
                <p className="text-sm text-slate-600">Videos added this period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="etsy" className="space-y-6 mt-6">
          {/* Etsy KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-orange-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Shop Views</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestEtsy.views?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="w-8 h-8 text-orange-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Orders</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestEtsy.orders?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heart className="w-8 h-8 text-orange-600" />
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-slate-600 mb-1">Favorites</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestEtsy.favorites?.toLocaleString() || "0"}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <span className="text-sm text-slate-500">Conv. Rate</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">Conversion</p>
                <p className="text-3xl font-bold text-slate-900">
                  {latestEtsy.conversion_rate || "0"}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Etsy Chart */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Views & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={etsyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Additional Etsy Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 mb-2">
                  ${latestEtsy.revenue?.toLocaleString() || "0"}
                </p>
                <p className="text-sm text-slate-600">Sales revenue this period</p>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 mb-2">
                  {latestEtsy.active_listings || "0"}
                </p>
                <p className="text-sm text-slate-600">Products currently listed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
