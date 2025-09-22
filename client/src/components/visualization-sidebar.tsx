
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Database, Users, Calendar, Activity, Beaker, Rocket, Brain } from "lucide-react";

const chartConfig = {
  papers: {
    label: "Papers",
    color: "hsl(var(--primary))",
  },
  studies: {
    label: "Studies", 
    color: "hsl(var(--secondary))",
  },
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

export function VisualizationSidebar() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/stats");
      return await res.json();
    },
  });

  const categoryData = stats?.categoryStats ? Object.entries(stats.categoryStats).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const monthlyData = stats?.monthlyData || [];
  
  const researchTrendsData = stats?.researchTrends ? Object.entries(stats.researchTrends).map(([year, count]) => ({
    year,
    studies: count,
  })) : [];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalPapers || 2847}</p>
                <p className="text-xs text-muted-foreground">Total Studies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.recentStudies || 156}</p>
                <p className="text-xs text-muted-foreground">2025 Studies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Rocket className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeProjects || 47}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">Sept</p>
                <p className="text-xs text-muted-foreground">2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Categories Chart */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Research Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Activity */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            2025 Monthly Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <AreaChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Area
                type="monotone"
                dataKey="papers"
                stackId="1"
                stroke="var(--color-papers)"
                fill="var(--color-papers)"
                fillOpacity={0.6}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Research Trends by Year */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Research Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[180px]">
            <LineChart data={researchTrendsData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Line
                type="monotone"
                dataKey="studies"
                stroke="var(--color-studies)"
                strokeWidth={3}
                dot={{ fill: "var(--color-studies)", strokeWidth: 2, r: 4 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
