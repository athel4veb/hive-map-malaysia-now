
import { Brain, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

interface DashboardProps {
  dashboardData: {
    totalStartups: number;
    totalVCs: number;
    sectorDistribution: { name: string; value: number; color: string }[];
    yearlyTrends: { year: string; startups: number; vcs: number }[];
    aiInsights: string;
  };
  urlsCount: number;
}

export const Dashboard = ({ dashboardData, urlsCount }: DashboardProps) => {
  const chartConfig = {
    startups: {
      label: "Startups",
      color: "#8884d8",
    },
    vcs: {
      label: "VCs", 
      color: "#82ca9d",
    },
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
        Data Analytics Dashboard
      </h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-700">{dashboardData.totalStartups}</div>
            <div className="text-sm text-blue-600">Total Startups</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-700">{dashboardData.totalVCs}</div>
            <div className="text-sm text-green-600">VC Programs</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-700">{dashboardData.sectorDistribution.length}</div>
            <div className="text-sm text-purple-600">Top Sectors</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-700">{urlsCount}</div>
            <div className="text-sm text-orange-600">Managed URLs</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sector Distribution Pie Chart */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-900">
              <PieChart className="h-5 w-5 mr-2 text-purple-600" />
              Startup Sector Distribution (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dashboardData.sectorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.sectorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Yearly Trends Line Chart */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-900">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Growth Trends (Last 10 Years)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.yearlyTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="startups" stroke="#8884d8" strokeWidth={3} name="Startups" />
                  <Line type="monotone" dataKey="vcs" stroke="#82ca9d" strokeWidth={3} name="VCs" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-xl text-gray-900">
            <Brain className="h-5 w-5 mr-2 text-indigo-600" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white/70 rounded-lg p-4 border border-indigo-100">
            <p className="text-gray-700 leading-relaxed">{dashboardData.aiInsights}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
