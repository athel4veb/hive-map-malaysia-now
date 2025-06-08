import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, Download, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState([
    "https://www.adb.org/countries/malaysia/social-enterprises",
    "https://www.sbc.org.my/directory",
    "https://www.brit.org.my/members"
  ]);
  const [newUrl, setNewUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [isScrapingActive, setIsScrapingActive] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
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

  const addUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      setUrls([...urls, newUrl.trim()]);
      setNewUrl("");
      toast({
        title: "URL Added",
        description: "New URL has been added to the scraping list.",
      });
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setUrls(urls.filter(url => url !== urlToRemove));
    toast({
      title: "URL Removed",
      description: "URL has been removed from the scraping list.",
    });
  };

  const addBulkUrls = () => {
    const newUrls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && !urls.includes(url));
    
    if (newUrls.length > 0) {
      setUrls([...urls, ...newUrls]);
      setBulkUrls("");
      toast({
        title: "URLs Added",
        description: `${newUrls.length} URLs have been added to the scraping list.`,
      });
    }
  };

  const startScraping = () => {
    if (urls.length === 0) {
      toast({
        title: "No URLs",
        description: "Please add URLs before starting the scraping process.",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingActive(true);
    console.log("Starting scraping for URLs:", urls);
    
    toast({
      title: "Scraping Started",
      description: `Initiated scraping for ${urls.length} URLs. This may take several minutes.`,
    });

    // Simulate scraping process
    setTimeout(() => {
      setIsScrapingActive(false);
      toast({
        title: "Scraping Complete",
        description: "Data extraction completed. New entries have been added to the database.",
      });
    }, 5000);
  };

  const exportData = () => {
    const data = JSON.stringify({
      urls,
      scrapedData: [
        { name: "Sample Organization", sector: "Technology", location: "KL" }
      ],
      exportedAt: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asbhive-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast({
      title: "Data Exported",
      description: "Data has been exported to JSON file.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Admin Panel
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
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

        {/* URL Management */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-900">
              <Globe className="h-5 w-5 mr-2" />
              URL Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Single URL Input */}
            <div className="flex gap-2">
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Enter URL to scrape (e.g., https://example.com)"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
              />
              <Button onClick={addUrl} disabled={!newUrl.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Bulk URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bulk Add URLs (one per line)</label>
              <Textarea
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                placeholder="https://site1.com&#10;https://site2.com&#10;https://site3.com"
                rows={4}
              />
              <Button onClick={addBulkUrls} disabled={!bulkUrls.trim()} variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Add Bulk URLs
              </Button>
            </div>

            {/* URL List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  Current URLs ({urls.length})
                </h3>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {urls.length} sources
                </Badge>
              </div>
              
              {urls.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700 flex-1 mr-2 break-all">{url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(url)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No URLs added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scraping Controls */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Data Scraping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={startScraping}
                disabled={isScrapingActive || urls.length === 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isScrapingActive ? "Scraping..." : "Start Scraping"}
              </Button>
              
              <Button
                onClick={exportData}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {isScrapingActive && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-800">Scraping in progress... This may take several minutes.</span>
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
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Last scraping session</span>
                <Badge variant="secondary">2 hours ago</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Organizations scraped</span>
                <Badge className="bg-green-100 text-green-800">12 new entries</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Manual contributions</span>
                <Badge className="bg-blue-100 text-blue-800">3 pending review</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
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
