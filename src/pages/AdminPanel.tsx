import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Download, Upload, LogOut, User, FileText, Link } from "lucide-react";
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

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState([
    "https://www.adb.org/countries/malaysia/social-enterprises",
    "https://www.sbc.org.my/directory",
    "https://www.brit.org.my/members"
  ]);
  const [newUrl, setNewUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [urlType, setUrlType] = useState<"vc" | "startup">("startup");
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"url" | "csv">("url");

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
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
      
      setLoading(false);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

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
      
      // Assuming CSV has URLs in the first column
      const csvUrls = lines.slice(1) // Skip header
        .map(line => line.split(',')[0].trim())
        .filter(url => url.startsWith('http'))
        .filter(url => !urls.includes(url));

      if (csvUrls.length > 0) {
        setUrls([...urls, ...csvUrls]);
        toast({
          title: "CSV Uploaded",
          description: `${csvUrls.length} URLs imported from CSV file.`,
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

  const submitUrlToDatabase = async (url: string) => {
    const tableName = urlType === "vc" ? "grant_urls" : "startup_urls";
    
    const { error } = await supabase
      .from(tableName)
      .insert({ url });

    if (error) {
      console.error(`Error submitting URL to ${tableName}:`, error);
      throw error;
    }
  };

  const saveAllUrlsToDatabase = async () => {
    const tableName = urlType === "vc" ? "grant_urls" : "startup_urls";
    
    try {
      // Get existing URLs from the database to avoid duplicates
      const { data: existingUrls, error: fetchError } = await supabase
        .from(tableName)
        .select('url');

      if (fetchError) {
        console.error('Error fetching existing URLs:', fetchError);
        return;
      }

      const existingUrlSet = new Set(existingUrls?.map(item => item.url) || []);
      
      // Filter out URLs that already exist in the database
      const urlsToInsert = urls.filter(url => !existingUrlSet.has(url));
      
      if (urlsToInsert.length > 0) {
        const urlObjects = urlsToInsert.map(url => ({ url }));
        const { error } = await supabase
          .from(tableName)
          .insert(urlObjects);

        if (error) {
          console.error(`Error saving URLs to ${tableName}:`, error);
          throw error;
        }

        console.log(`Saved ${urlsToInsert.length} new URLs to ${tableName}`);
      }
    } catch (error) {
      console.error('Error in saveAllUrlsToDatabase:', error);
      throw error;
    }
  };

  const addUrl = async () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      try {
        await submitUrlToDatabase(newUrl.trim());
        setUrls([...urls, newUrl.trim()]);
        setNewUrl("");
        toast({
          title: "URL Added",
          description: `New URL has been added to the ${urlType === "vc" ? "VC" : "startup"} scraping list and database.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add URL to database.",
          variant: "destructive",
        });
      }
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(url => url !== urlToRemove));
    toast({
      title: "URL Removed",
      description: "URL has been removed from the scraping list.",
    });
  };

  const addBulkUrls = async () => {
    const newUrls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && !urls.includes(url));
    
    if (newUrls.length > 0) {
      try {
        // Submit all URLs to the database
        for (const url of newUrls) {
          await submitUrlToDatabase(url);
        }
        
        setUrls([...urls, ...newUrls]);
        setBulkUrls("");
        toast({
          title: "URLs Added",
          description: `${newUrls.length} URLs have been added to the ${urlType === "vc" ? "VC" : "startup"} scraping list and database.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add some URLs to database.",
          variant: "destructive",
        });
      }
    }
  };

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
      
      // Save all current URLs to the database before starting scraping
      await saveAllUrlsToDatabase();
      
      console.log(`Starting ${urlType} scraping for URLs:`, urls);
      
      toast({
        title: "Scraping Started",
        description: `Initiated ${urlType === "vc" ? "VC" : "startup"} scraping for ${urls.length} URLs. All URLs have been saved to the database.`,
      });

      // Simulate scraping process
      setTimeout(() => {
        setIsScrapingActive(false);
        toast({
          title: "Scraping Complete",
          description: `${urlType === "vc" ? "VC" : "Startup"} data extraction completed. New entries have been added to the database.`,
        });
      }, 5000);
    } catch (error) {
      setIsScrapingActive(false);
      toast({
        title: "Error",
        description: "Failed to save URLs to database before starting scraping.",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const data = JSON.stringify({
      urls,
      urlType,
      scrapedData: [
        { name: "Sample Organization", sector: "Technology", location: "KL" }
      ],
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
      description: `${urlType === "vc" ? "VC" : "Startup"} data has been exported to JSON file.`,
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
                    disabled={!newUrl.trim()}
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
                  disabled={!bulkUrls.trim()} 
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
                {isScrapingActive ? "Scraping..." : `Start ${urlType === "vc" ? "VC/Grant" : "Startup"} Scraping`}
              </Button>
              
              <Button
                onClick={exportData}
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
                <Badge variant="outline">47 organizations</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
