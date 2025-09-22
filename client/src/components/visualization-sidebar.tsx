import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/use-auth";

const COLORS = ['hsl(263, 70%, 60%)', 'hsl(204, 100%, 50%)', 'hsl(159, 100%, 36%)', 'hsl(42, 93%, 56%)'];

export function VisualizationSidebar() {
  const { user } = useAuth();
  
  const { data: stats } = useQuery<{
    totalPapers: number;
    recentStudies: number;
    activeProjects: number;
    categoryStats: Record<string, number>;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const categoryData = stats?.categoryStats ? Object.entries(stats.categoryStats).map(([name, value]) => ({
    name,
    value
  })) : [];

  const timelineData = [
    { year: "2020", studies: 45 },
    { year: "2021", studies: 67 },
    { year: "2022", studies: 89 },
    { year: "2023", studies: 78 },
    { year: "2024", studies: 56 },
  ];

  const recommendedStudies = [
    {
      title: "Protein Crystallization in Microgravity",
      reason: "Based on your interest in Plant Biology"
    },
    {
      title: "Neural Adaptation to Space Environment", 
      reason: "Based on your interest in Human Health"
    }
  ];

  return (
    <div className="sticky top-24 space-y-6">
      <Card className="glass rounded-xl border-0">
        <CardHeader>
          <CardTitle className="text-lg">Research Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 chart-container rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }}
                />
                <YAxis hide />
                <Bar dataKey="studies" fill="hsl(263, 70%, 60%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="glass rounded-xl border-0">
        <CardHeader>
          <CardTitle className="text-lg">Study Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((category, index) => {
              const percentage = stats ? (category.value / stats.totalPapers) * 100 : 0;
              return (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{category.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass rounded-xl border-0">
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Papers:</span>
              <span className="font-mono font-medium" data-testid="stat-total-papers">
                {stats?.totalPapers.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recent Studies:</span>
              <span className="font-mono font-medium" data-testid="stat-recent-studies">
                {stats?.recentStudies || "0"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Projects:</span>
              <span className="font-mono font-medium" data-testid="stat-active-projects">
                {stats?.activeProjects || "0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.interests && user.interests.length > 0 && (
        <Card className="glass rounded-xl border-0">
          <CardHeader>
            <CardTitle className="text-lg">Recommended Studies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendedStudies.map((study, index) => (
                <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">{study.title}</h4>
                  <p className="text-xs text-muted-foreground">{study.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
