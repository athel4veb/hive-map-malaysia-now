
import { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Dashboard } from "@/components/admin/Dashboard";
import { URLManager } from "@/components/admin/URLManager";
import { ScrapingControls } from "@/components/admin/ScrapingControls";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUrlManager } from "@/hooks/useUrlManager";
import { startScrapingProcess, exportData } from "@/utils/scrapingUtils";

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
  const [urlType, setUrlType] = useState<"vc" | "startup">("startup");
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"url" | "csv">("url");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const { dashboardData, loadDashboardData } = useDashboardData();
  const {
    urls,
    newUrl,
    setNewUrl,
    bulkUrls,
    setBulkUrls,
    loadExistingUrls,
    addUrl,
    removeUrl,
    addBulkUrls,
    handleCsvUpload
  } = useUrlManager();

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
  }, [navigate, loadExistingUrls, loadDashboardData, urlType]);

  // Reload URLs when URL type changes
  useEffect(() => {
    if (initialLoadDone) {
      loadExistingUrls(urlType);
    }
  }, [urlType, initialLoadDone, loadExistingUrls]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/auth');
  };

  const handleStartScraping = async () => {
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
      
      await startScrapingProcess(
        urls,
        urlType,
        user,
        (message) => {
          toast({
            title: "Scraping Started",
            description: message,
          });
        },
        (message) => {
          toast({
            title: "Webhook Error",
            description: message,
            variant: "destructive",
          });
        }
      );

      // Simulate scraping process completion
      setTimeout(() => {
        setIsScrapingActive(false);
        toast({
          title: "Scraping Complete",
          description: `${urlType === "vc" ? "VC/Grant" : "Startup"} data extraction completed. New entries have been added to the database.`,
        });
      }, 5000);
    } catch (error) {
      console.error("Error in handleStartScraping:", error);
      setIsScrapingActive(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping process.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    exportData(urls, urlType);
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
        <Dashboard 
          dashboardData={dashboardData} 
          urlsCount={urls.length} 
        />

        {/* URL Management Section */}
        <URLManager
          urlType={urlType}
          setUrlType={setUrlType}
          uploadMethod={uploadMethod}
          setUploadMethod={setUploadMethod}
          urls={urls}
          newUrl={newUrl}
          setNewUrl={setNewUrl}
          bulkUrls={bulkUrls}
          setBulkUrls={setBulkUrls}
          addUrl={addUrl}
          removeUrl={removeUrl}
          addBulkUrls={addBulkUrls}
          handleCsvUpload={handleCsvUpload}
        />

        {/* Scraping Controls */}
        <ScrapingControls
          urlType={urlType}
          urls={urls}
          isScrapingActive={isScrapingActive}
          onStartScraping={handleStartScraping}
          onExportData={handleExportData}
        />

        {/* Recent Activity */}
        <RecentActivity 
          totalOrganizations={dashboardData.totalStartups + dashboardData.totalVCs} 
        />
      </div>
    </div>
  );
};

export default AdminPanel;
