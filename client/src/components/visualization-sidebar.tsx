import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Database, Users, Calendar, Activity, Beaker, Rocket, Brain } from "lucide-react";
import { motion } from "framer-motion";

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

  const statCards = [
    { icon: Database, value: stats?.totalPapers || 2847, label: "Total Studies", color: "text-primary" },
    { icon: TrendingUp, value: stats?.recentStudies || 156, label: "2025 Studies", color: "text-green-500" },
    { icon: Rocket, value: stats?.activeProjects || 47, label: "Active Projects", color: "text-blue-500" },
    { icon: Activity, value: "Sept", label: "2025", color: "text-purple-500" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="glass border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>
    </div>
  );
}
