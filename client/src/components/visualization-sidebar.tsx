
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Database, Users, Calendar } from "lucide-react";

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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

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

  const trendData = [
    { month: 'Jan', papers: 65 },
    { month: 'Feb', papers: 78 },
    { month: 'Mar', papers: 90 },
    { month: 'Apr', papers: 85 },
    { month: 'May', papers: 95 },
    { month: 'Jun', papers: 102 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalPapers || 1247}</p>
                <p className="text-xs text-muted-foreground">Total Papers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.recentStudies || 89}</p>
                <p className="text-xs text-muted-foreground">Recent Studies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeProjects || 23}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">2024</p>
                <p className="text-xs text-muted-foreground">Current Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Categories Chart */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm">Research Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

      {/* Publication Trends */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-sm">Publication Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="papers" fill="var(--color-papers)" radius={[2, 2, 0, 0]} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
