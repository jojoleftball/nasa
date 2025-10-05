import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar, Legend } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Database, Users, Calendar, Activity, Beaker, Rocket, Brain, Building2, CheckCircle2, BarChart3 } from "lucide-react";
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
  nasa: {
    label: "NASA Studies",
    color: "#8884d8",
  },
  admin: {
    label: "Admin Studies",
    color: "#82ca9d",
  },
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];
const RADIAL_COLORS = ['#10b981', '#f59e0b'];

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

  const topResearchAreas = stats?.topResearchAreas || [];

  const publicationData = stats?.publicationStatus ? [
    { name: 'Published', value: stats.publicationStatus.published, fill: RADIAL_COLORS[0] },
    { name: 'Unpublished', value: stats.publicationStatus.unpublished, fill: RADIAL_COLORS[1] }
  ] : [];

  const institutionData = stats?.institutionStats ? 
    Object.entries(stats.institutionStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, value]) => ({ name, value })) : [];

  const statCards = [
    { icon: Database, value: stats?.totalPapers || 483, label: "Total Studies", color: "text-primary" },
    { icon: TrendingUp, value: stats?.recentStudies || 5, label: "2025 Studies", color: "text-green-500" },
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
              2025 Monthly Activity (NASA vs Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Area
                  type="monotone"
                  dataKey="nasa"
                  stackId="1"
                  stroke="var(--color-nasa)"
                  fill="var(--color-nasa)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="admin"
                  stackId="1"
                  stroke="var(--color-admin)"
                  fill="var(--color-admin)"
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

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Research Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px]">
              <BarChart data={topResearchAreas} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {publicationData.length > 0 && publicationData.some(d => d.value > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Publication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={publicationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {publicationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {institutionData.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Top Institutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[180px]">
                <BarChart data={institutionData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 9 }} />
                  <YAxis />
                  <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
