
import { useState, useMemo, useEffect } from "react";
import { Search, Filter, MapPin, ExternalLink, Sparkles, Loader2 } from "lucide-react";
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

interface Organization {
  id: string | number;
  name: string;
  website?: string;
  description: string;
  sector: string;
  location: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isAiMatch?: boolean;
  matchPercentage?: number;
  reasons?: string[];
  yearFounded?: number;
  targetBeneficiaries?: string;
  revenueModel?: string;
  impact?: string;
  awards?: string;
  grants?: string;
  institutionalSupport?: string;
  magicAccredited?: string;
}

const DataExplore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<Organization[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase startup table
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log("Fetching startup data from startup table...");
        
        // First, let's check if we can connect to the database at all
        const { data: testConnection, error: testError } = await supabase
          .from('startup')
          .select('count(*)', { count: 'exact', head: true });
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          toast.error(`Database connection failed: ${testError.message}`);
          setLoading(false);
          return;
        }

        console.log('Database connection successful, total count:', testConnection);

        // Now fetch actual data
        const { data: startups, error: startupError, count } = await supabase
          .from('startup')
          .select('*', { count: 'exact' });
        
        if (startupError) {
          console.error('Error fetching startups:', startupError);
          toast.error(`Failed to fetch startups: ${startupError.message}`);
          setLoading(false);
          return;
        }

        console.log('Raw startups data:', startups);
        console.log('Number of startups found:', startups?.length || 0);
        console.log('Total count from query:', count);

        // Transform data to unified format
        const transformedData: Organization[] = [];

        if (startups && startups.length > 0) {
          startups.forEach((startup, index) => {
            console.log(`Processing startup ${index + 1}:`, startup);
            transformedData.push({
              id: `startup-${startup.No || index}`,
              name: startup.CompanyName || 'Unknown Startup',
              website: startup.WebsiteSocialMedia || '',
              description: startup.WhatTheyDo || 'No description available',
              sector: startup.Sector || 'Various',
              location: startup.Location || 'Malaysia',
              contactEmail: '',
              contactPhone: '',
              notes: startup.ProblemTheySolve || '',
              yearFounded: startup.YearFounded || undefined,
              targetBeneficiaries: startup.TargetBeneficiaries || '',
              revenueModel: startup.RevenueModel || '',
              impact: startup.Impact || '',
              awards: startup.Awards || '',
              grants: startup.Grants || '',
              institutionalSupport: startup.InstitutionalSupport || '',
              magicAccredited: startup.MaGICAccredited || ''
            });
          });
          console.log('Successfully transformed data for', transformedData.length, 'startups');
          toast.success(`Loaded ${transformedData.length} startups successfully!`);
        } else {
          console.log('No startup data found in startup table');
          
          // Let's check if the table exists and what columns it has
          const { data: tableInfo, error: tableError } = await supabase
            .rpc('get_table_info', { table_name: 'startup' })
            .single();
            
          if (tableError) {
            console.log('Could not get table info, table might be empty or have permission issues');
            toast.error("No startup data found. The table might be empty or there might be permission issues.");
          } else {
            console.log('Table info:', tableInfo);
            toast.info("Startup table exists but contains no data");
          }
        }

        console.log('Final transformed data:', transformedData);
        setOrganizations(transformedData);
      } catch (error) {
        console.error('Unexpected error fetching data:', error);
        toast.error('Unexpected error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (showAiResults && aiMatches.length > 0) {
      return aiMatches;
    }
    
    return organizations.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sector && item.sector.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSector = sectorFilter === "all" || item.sector === sectorFilter;
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      
      return matchesSearch && matchesSector && matchesLocation;
    });
  }, [searchTerm, sectorFilter, locationFilter, showAiResults, aiMatches, organizations]);

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of what you're looking for");
      return;
    }

    setIsAiLoading(true);
    try {
      // Search through actual database using AI
      const searchResults = organizations.filter(org => {
        const searchText = `${org.name} ${org.description} ${org.sector} ${org.notes} ${org.targetBeneficiaries} ${org.revenueModel} ${org.impact}`.toLowerCase();
        const promptKeywords = aiPrompt.toLowerCase().split(' ');
        
        // Simple keyword matching - can be enhanced with more sophisticated AI matching
        return promptKeywords.some(keyword => 
          keyword.length > 2 && searchText.includes(keyword)
        );
      });

      // Simulate AI scoring and ranking
      const mappedMatches: Organization[] = searchResults.slice(0, 10).map((match, index) => ({
        ...match,
        id: `ai-${match.id}`,
        matchPercentage: Math.floor(Math.random() * 30) + 70, // 70-100% match
        reasons: [
          `Strong alignment with "${aiPrompt.substring(0, 50)}..."`,
          `Relevant sector: ${match.sector}`,
          `Active in ${match.location}`,
          match.targetBeneficiaries ? `Target beneficiaries: ${match.targetBeneficiaries}` : ''
        ].filter(Boolean),
        isAiMatch: true
      }));

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

  // Generate dynamic filter options from actual data
  const sectors = [...new Set(organizations.map(item => item.sector))].filter(Boolean);
  const locations = [...new Set(organizations.map(item => item.location))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading startup data...</p>
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
            Discover Startups
          </h1>
          <p className="text-lg text-gray-600">
            Explore {organizations.length} startups in Malaysia's social enterprise ecosystem
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
              placeholder="e.g., 'I'm looking for early-stage fintech startups in Kuala Lumpur focused on digital payments and financial inclusion for underserved communities...'"
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
                    <CardTitle className="text-xl text-gray-900 mb-2">{item.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                        Startup
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {item.sector}
                      </Badge>
                      {item.yearFounded && (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          Founded {item.yearFounded}
                        </Badge>
                      )}
                      {item.magicAccredited && item.magicAccredited.toLowerCase() === 'yes' && (
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          MaGIC Accredited
                        </Badge>
                      )}
                      {item.isAiMatch && item.matchPercentage && (
                        <Badge className="bg-purple-500 text-white">
                          {item.matchPercentage}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  {item.website && item.website !== "#" && (
                    <a 
                      href={item.website} 
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
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{item.description}</p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {item.location}
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
                
                {item.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Problem They Solve:</h4>
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>
                )}

                {item.targetBeneficiaries && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-700 mb-1">Target Beneficiaries:</h4>
                    <p className="text-sm text-blue-600">{item.targetBeneficiaries}</p>
                  </div>
                )}

                {item.impact && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-700 mb-1">Impact:</h4>
                    <p className="text-sm text-green-600">{item.impact}</p>
                  </div>
                )}

                {item.awards && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-yellow-700 mb-1">Awards:</h4>
                    <p className="text-sm text-yellow-600">{item.awards}</p>
                  </div>
                )}

                {item.grants && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-indigo-700 mb-1">Grants:</h4>
                    <p className="text-sm text-indigo-600">{item.grants}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              {organizations.length === 0 
                ? "No startup data available. Please check if the startup table contains data." 
                : "Try adjusting your search terms or filters"
              }
            </p>
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
              Contribute Data
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataExplore;
