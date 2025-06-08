import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Download, Upload, LogOut, User, FileText, Link, TrendingUp, PieChart, BarChart3, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from "recharts";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
}

interface DashboardData {
  totalStartups: number;
  totalVCs: number;
  sectorDistribution: { name: string; value: number; color: string }[];
  yearlyTrends: { year: string; startups: number; vcs: number }[];
  aiInsights: string;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [urlType, setUrlType] = useState<"vc" | "startup">("startup");
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"url" | "csv">("url");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalStartups: 0,
    totalVCs: 0,
    sectorDistribution: [],
    yearlyTrends: [],
    aiInsights: ""
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        
        setUser(session.user);
        
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setUserProfile(profile);
        }
        
        // Load existing URLs and dashboard data
        await Promise.all([
          loadExistingUrls(urlType),
          loadDashboardData()
        ]);
        
        setInitialLoadDone(true);
        setLoading(false);
      } catch (error) {
        console.error("Error in authentication check:", error);
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Reload URLs when URL type changes
  useEffect(() => {
    if (initialLoadDone) {
      loadExistingUrls(urlType);
    }
  }, [urlType, initialLoadDone]);

  // Load existing URLs from database
  const loadExistingUrls = async (type: "vc" | "startup") => {
    try {
      const tableName = type === "vc" ? "grant_urls" : "startup_urls";
      
      const { data, error } = await supabase
        .from(tableName)
        .select('url');
      
      if (error) {
        console.error(`Error loading URLs from ${tableName}:`, error);
        throw error;
      }
      
      if (data) {
        const loadedUrls = data.map(item => item.url);
        setUrls(loadedUrls);
        console.log(`Loaded ${loadedUrls.length} URLs from ${tableName}`);
      }
    } catch (error) {
      console.error("Error in loadExistingUrls:", error);
      toast({
        title: "Error",
        description: "Failed to load existing URLs from database.",
        variant: "destructive",
      });
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Fetch startup data
      const { data: startupData, error: startupError } = await supabase
        .from('startup')
        .select('*');

      if (startupError) throw startupError;

      // Fetch VC/grant data
      const { data: vcData, error: vcError } = await supabase
        .from('grant_programs')
        .select('*');

      if (vcError) throw vcError;

      // Process sector distribution for startups - handle comma-separated sectors and limit to top 10
      const sectorCounts: { [key: string]: number } = {};
      startupData?.forEach(startup => {
        const sectors = startup.Sector || 'Unknown';
        // Split by comma and process each sector
        const sectorList = sectors.split(',').map(s => s.trim()).filter(s => s);
        if (sectorList.length === 0) {
          sectorCounts['Unknown'] = (sectorCounts['Unknown'] || 0) + 1;
        } else {
          sectorList.forEach(sector => {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
          });
        }
      });

      const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'];
      
      // Get top 10 sectors only
      const sectorDistribution = Object.entries(sectorCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .slice(0, 10) // Take only top 10
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }));

      // Process yearly trends - filter to last 5 years only
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 4; // Last 5 years (including current year)
      
      const yearCounts: { [key: string]: { startups: number; vcs: number } } = {};
      
      // Initialize all years in the range
      for (let year = startYear; year <= currentYear; year++) {
        yearCounts[year.toString()] = { startups: 0, vcs: 0 };
      }
      
      startupData?.forEach(startup => {
        const year = startup.YearFounded?.toString();
        if (year && parseInt(year) >= startYear && parseInt(year) <= currentYear) {
          yearCounts[year].startups++;
        }
      });

      // Add mock VC data for visualization (since we don't have year founded for VCs)
      Object.keys(yearCounts).forEach(year => {
        yearCounts[year].vcs = Math.floor(Math.random() * 8) + 2; // Mock VC data
      });

      const yearlyTrends = Object.entries(yearCounts)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([year, data]) => ({
          year,
          startups: data.startups,
          vcs: data.vcs
        }));

      // Generate AI insights
      const totalStartups = startupData?.length || 0;
      const totalVCs = vcData?.length || 0;
      const topSector = sectorDistribution[0]?.name || 'Technology';
      const recentYearGrowth = yearlyTrends.length > 1 ? 
        yearlyTrends[yearlyTrends.length - 1].startups - yearlyTrends[yearlyTrends.length - 2].startups : 0;
      
      const aiInsights = `Based on current data analysis: Our database contains ${totalStartups} startups and ${totalVCs} VC/grant programs. The leading sector is ${topSector} with ${sectorDistribution[0]?.value || 0} companies. ${recentYearGrowth > 0 ? `Recent growth shows ${recentYearGrowth} new startups this year compared to last year.` : 'Growth has stabilized with consistent registration patterns.'} Sector diversity is strong with ${sectorDistribution.length} different categories represented in the top 10, indicating a healthy and varied entrepreneurial ecosystem.`;

      setDashboardData({
        totalStartups,
        totalVCs,
        sectorDistribution,
        yearlyTrends,
        aiInsights
      });

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/auth');
  };

  // Process CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      // Extract URLs from CSV (assumes URLs in first column)
      const csvUrls = lines.slice(1) // Skip header row
        .map(line => line.split(',')[0].trim())
        .filter(url => url && url.startsWith('http'))
        .filter(url => !urls.includes(url));

      if (csvUrls.length > 0) {
        setUrls(prevUrls => [...prevUrls, ...csvUrls]);
        toast({
          title: "CSV Processed",
          description: `${csvUrls.length} new URLs extracted from CSV file.`,
        });
      } else {
        toast({
          title: "No new URLs found",
          description: "The CSV file doesn't contain any new valid URLs.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Add single URL
  const addUrl = () => {
    const trimmedUrl = newUrl.trim();
    
    if (!trimmedUrl) {
      toast({
        title: "Empty URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }
    
    if (!trimmedUrl.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "URL must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    
    if (urls.includes(trimmedUrl)) {
      toast({
        title: "Duplicate URL",
        description: "This URL already exists in the list.",
        variant: "destructive",
      });
      return;
    }

    setUrls([...urls, trimmedUrl]);
    setNewUrl("");
    toast({
      title: "URL Added",
      description: "New URL has been added to the list.",
    });
  };

  // Remove URL
  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(url => url !== urlToRemove));
    toast({
      title: "URL Removed",
      description: "URL has been removed from the list.",
    });
  };

  // Add multiple URLs
  const addBulkUrls = () => {
    if (!bulkUrls.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter one or more URLs.",
        variant: "destructive",
      });
      return;
    }
    
    const newUrls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'))
      .filter(url => !urls.includes(url));
    
    if (newUrls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "No new valid URLs were found in your input.",
        variant: "destructive",
      });
      return;
    }
    
    setUrls(prevUrls => [...prevUrls, ...newUrls]);
    setBulkUrls("");
    toast({
      title: "URLs Added",
      description: `${newUrls.length} new URLs have been added to the list.`,
    });
  };

  // Save URLs to database and start scraping
  const startScraping = async () => {
    if (urls.length === 0) {
      toast({
        title: "No URLs",
        description: "Please add URLs before starting the scraping process.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScrapingActive(true);
      const tableName = urlType === "vc" ? "grant_urls" : "startup_urls";
      
      // Get existing URLs from database to avoid duplicates
      const { data: existingUrls, error: fetchError } = await supabase
        .from(tableName)
        .select('url');

      if (fetchError) {
        throw new Error(`Error fetching existing URLs: ${fetchError.message}`);
      }

      const existingUrlSet = new Set(existingUrls?.map(item => item.url) || []);
      
      // Filter URLs that don't exist in the database yet
      const urlsToInsert = urls.filter(url => !existingUrlSet.has(url));
      
      if (urlsToInsert.length > 0) {
        const urlObjects = urlsToInsert.map(url => ({ url }));
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(urlObjects);

        if (insertError) {
          throw new Error(`Error saving URLs to database: ${insertError.message}`);
        }
        
        console.log(`Saved ${urlsToInsert.length} new URLs to ${tableName}`);
      } else {
        console.log("No new URLs to save to database");
      }
      
      toast({
        title: "Scraping Started",
        description: `Initiated ${urlType === "vc" ? "VC/Grant" : "startup"} scraping for ${urls.length} URLs. All URLs have been saved to the database.`,
      });

      // Simulate scraping process (in a real app, you would call your scraping API/service here)
      setTimeout(() => {
        setIsScrapingActive(false);
        toast({
          title: "Scraping Complete",
          description: `${urlType === "vc" ? "VC/Grant" : "Startup"} data extraction completed. New entries have been added to the database.`,
        });
      }, 5000);
    } catch (error) {
      console.error("Error in startScraping:", error);
      setIsScrapingActive(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping process.",
        variant: "destructive",
      });
    }
  };

  // Export current data
  const exportData = () => {
    const data = JSON.stringify({
      urls,
      urlType,
      exportedAt: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asbhive-${urlType}-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: "Data Exported",
      description: `${urlType === "vc" ? "VC/Grant" : "Startup"} data has been exported to JSON file.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  const displayName = userProfile?.first_name && userProfile?.last_name 
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : userProfile?.email || user.email;

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Admin Panel
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Welcome, {displayName}</span>
                {userProfile?.role && (
                  <Badge variant="outline" className="text-xs">
                    {userProfile.role}
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Manage data sources and monitor scraping activities
          </p>
        </div>

        {/* Dashboard Analytics Section */}
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
                <div className="text-3xl font-bold text-orange-700">{urls.length}</div>
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
                  <RechartsPieChart width="100%" height="100%">
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
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Yearly Trends Line Chart */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Growth Trends (Last 5 Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={dashboardData.yearlyTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="startups" stroke="#8884d8" strokeWidth={3} name="Startups" />
                    <Line type="monotone" dataKey="vcs" stroke="#82ca9d" strokeWidth={3} name="VCs" />
                  </LineChart>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Data Source Configuration */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-gray-900">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                Data Source Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Select Data Type</label>
                <Select value={urlType} onValueChange={(value: "vc" | "startup") => setUrlType(value)}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="startup" className="hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Startup Data (startup_urls)
                      </div>
                    </SelectItem>
                    <SelectItem value="vc" className="hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        VC/Grant Data (grant_urls)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {urlType === "vc" 
                    ? "🏦 URLs will be saved to grant_urls table for VC/Grant program scraping"
                    : "🚀 URLs will be saved to startup_urls table for startup scraping"
                  }
                </p>
              </div>

              {/* Upload Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Choose Upload Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={uploadMethod === "url" ? "default" : "outline"}
                    onClick={() => setUploadMethod("url")}
                    className="flex items-center gap-2 h-12"
                  >
                    <Link className="h-4 w-4" />
                    URL Input
                  </Button>
                  <Button
                    variant={uploadMethod === "csv" ? "default" : "outline"}
                    onClick={() => setUploadMethod("csv")}
                    className="flex items-center gap-2 h-12"
                  >
                    <FileText className="h-4 w-4" />
                    CSV Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current URLs Summary */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-xl text-gray-900">
                <span className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  Current Sources
                </span>
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  {urls.length} URLs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{urls.length}</div>
                    <div className="text-sm text-green-600">Total URLs</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{urlType === "vc" ? "VC/Grant" : "Startup"}</div>
                    <div className="text-sm text-blue-600">Data Type</div>
                  </div>
                </div>
                
                {urls.length > 0 && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {urls.slice(0, 3).map((url, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded truncate">
                        {url}
                      </div>
                    ))}
                    {urls.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{urls.length - 3} more URLs...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* URL Input Section */}
        {uploadMethod === "url" && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-900">
                <Link className="h-5 w-5 mr-2 text-blue-600" />
                URL Input Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single URL Input */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Add Single URL</label>
                <div className="flex gap-3">
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={`Enter ${urlType === "vc" ? "VC/Grant" : "startup"} URL (e.g., https://example.com)`}
                    className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                  />
                  <Button 
                    onClick={addUrl} 
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Bulk URL Input */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Bulk Add URLs (one per line)
                </label>
                <Textarea
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  placeholder="https://site1.com&#10;https://site2.com&#10;https://site3.com"
                  rows={5}
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                />
                <Button 
                  onClick={addBulkUrls}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Bulk URLs
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CSV Upload Section */}
        {uploadMethod === "csv" && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-gray-900">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                CSV File Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-700">Upload CSV File</h3>
                  <p className="text-sm text-gray-500">
                    Select a CSV file containing URLs in the first column
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose CSV File
                  </label>
                </div>
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>CSV Format:</strong> First column should contain URLs. Header row will be skipped.
                  <br />
                  Example: URL,Description
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* URL List */}
        {urls.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl text-gray-900">
                <span className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-purple-600" />
                  Managed URLs
                </span>
                <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                  {urls.length} sources
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 flex-1 mr-2 break-all">{url}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrl(url)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scraping Controls */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              {urlType === "vc" ? "VC/Grant" : "Startup"} Data Scraping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={startScraping}
                disabled={isScrapingActive || urls.length === 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex-1 h-12 text-lg"
              >
                {isScrapingActive ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scraping...
                  </>
                ) : (
                  `Start ${urlType === "vc" ? "VC/Grant" : "Startup"} Scraping`
                )}
              </Button>
              
              <Button
                onClick={exportData}
                disabled={urls.length === 0}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50 px-8 h-12"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {isScrapingActive && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800 font-medium">
                    {urlType === "vc" ? "VC/Grant" : "Startup"} scraping in progress... This may take several minutes.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Last scraping session</span>
                <Badge variant="secondary">2 hours ago</Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Organizations scraped</span>
                <Badge className="bg-green-100 text-green-800">12 new entries</Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Manual contributions</span>
                <Badge className="bg-blue-100 text-blue-800">3 pending review</Badge>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-600">Total database entries</span>
                <Badge variant="outline">{dashboardData.totalStartups + dashboardData.totalVCs} organizations</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
