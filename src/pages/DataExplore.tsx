
import { useState, useMemo, useEffect } from "react";
import { Search, Filter, MapPin, Globe, Mail, Phone, ExternalLink, Sparkles, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const DataExplore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch startups from Supabase
  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .order('inserted_at', { ascending: false });

        if (error) {
          throw error;
        }

        setStartups(data || []);
      } catch (error) {
        console.error('Error fetching startups:', error);
        toast.error("Failed to load startups data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStartups();
  }, []);

  const filteredData = useMemo(() => {
    if (showAiResults && aiMatches.length > 0) {
      return aiMatches;
    }
    
    return startups.filter(item => {
      const matchesSearch = (item.startup_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (item.related_news_updates?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesSector = sectorFilter === "all" || item.industry_sector === sectorFilter;
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      
      return matchesSearch && matchesSector && matchesLocation;
    });
  }, [searchTerm, sectorFilter, locationFilter, showAiResults, aiMatches, startups]);

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of what you're looking for");
      return;
    }

    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-matchmaker', {
        body: {
          userType: 'vc',
          prompt: aiPrompt
        }
      });

      if (error) {
        throw error;
      }

      // Map AI matches to startup data format for display
      const mappedMatches = data.matches?.map((match: any, index: number) => ({
        id: `ai-${index}`,
        startup_name: match.name || "AI Recommended Startup",
        website_url: "#",
        description: match.description || "AI-recommended match based on your criteria",
        industry_sector: Array.isArray(match.sectors) ? match.sectors[0] : "Various",
        location: Array.isArray(match.regions) ? match.regions[0] : "Malaysia",
        contact_info: "contact@example.com",
        related_news_updates: `AI Match: ${match.matchPercentage}% compatibility. ${match.reasons?.join('. ') || 'Recommended based on your criteria'}`,
        matchPercentage: match.matchPercentage,
        reasons: match.reasons,
        isAiMatch: true
      })) || [];

      setAiMatches(mappedMatches);
      setShowAiResults(true);
      
      if (mappedMatches.length === 0) {
        toast.info("No matches found for your criteria. Try adjusting your description.");
      } else {
        toast.success(`Found ${mappedMatches.length} AI-powered matches!`);
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error("Failed to get AI recommendations. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearAiResults = () => {
    setShowAiResults(false);
    setAiMatches([]);
    setAiPrompt("");
  };

  const sectors = [...new Set(startups.map(item => item.industry_sector).filter(Boolean))];
  const locations = [...new Set(startups.map(item => item.location).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore the Startup Ecosystem
          </h1>
          <p className="text-lg text-gray-600">
            Discover {startups.length} startups in Malaysia's ecosystem
          </p>
        </div>

        {/* AI-Powered Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-sm border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Discovery</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Describe what type of startup you're looking for, and our AI will find the best matches
          </p>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., 'I'm looking for early-stage fintech startups in Kuala Lumpur focused on digital payments and financial inclusion...'"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button 
                onClick={handleAiSearch}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find AI Matches
                  </>
                )}
              </Button>
              {showAiResults && (
                <Button variant="outline" onClick={clearAiResults}>
                  Show All Results
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Traditional Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search startups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={showAiResults}
              />
            </div>
            
            <Select value={sectorFilter} onValueChange={setSectorFilter} disabled={showAiResults}>
              <SelectTrigger>
                <SelectValue placeholder="All Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(sector => (
                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter} disabled={showAiResults}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              {filteredData.length} results
              {showAiResults && <span className="ml-1">(AI matches)</span>}
            </Badge>
            {sectorFilter !== "all" && (
              <Badge variant="secondary" onClick={() => setSectorFilter("all")} className="cursor-pointer">
                Sector: {sectorFilter} ×
              </Badge>
            )}
            {locationFilter !== "all" && (
              <Badge variant="secondary" onClick={() => setLocationFilter("all")} className="cursor-pointer">
                Location: {locationFilter} ×
              </Badge>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredData.map(item => (
            <Card key={item.id} className={`hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm ${item.isAiMatch ? 'border-2 border-green-300' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{item.startup_name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className={item.isAiMatch ? "bg-green-500 text-white hover:bg-green-600" : "bg-green-100 text-green-800 hover:bg-green-200"}>
                        {item.industry_sector}
                      </Badge>
                      {item.location && (
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {item.location}
                        </Badge>
                      )}
                      {item.isAiMatch && item.matchPercentage && (
                        <Badge className="bg-blue-500 text-white">
                          {item.matchPercentage}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.website_url && item.website_url !== "#" && (
                      <a 
                        href={item.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                    {item.isAiMatch && (
                      <Sparkles className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{item.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  {item.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {item.location}
                    </div>
                  )}
                  {item.founding_year && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Founded {item.founding_year}
                    </div>
                  )}
                </div>
                
                {item.isAiMatch && item.reasons && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Why this is a good match:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {item.reasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {item.contact_info && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-800 mb-1">Contact Information:</h4>
                    <p className="text-sm text-gray-600">{item.contact_info}</p>
                  </div>
                )}
                
                {item.related_news_updates && !item.isAiMatch && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Recent Updates:</h4>
                    <p className="text-sm text-blue-700">{item.related_news_updates}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12 bg-white/80 backdrop-blur-sm rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Know a startup we're missing?
          </h3>
          <p className="text-gray-600 mb-6">
            Help us build a comprehensive database by contributing information about startups in Malaysia
          </p>
          <Link to="/contribute">
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              Contribute Startup Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataExplore;
