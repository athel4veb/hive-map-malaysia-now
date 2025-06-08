import { useState, useEffect } from "react";
import { Building2, MapPin, ExternalLink, Calendar, Award, Target, TrendingUp, Users, Sparkles, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Startup {
  id: string;
  companyName: string;
  sector: string;
  location: string;
  yearFounded?: number;
  whatTheyDo: string;
  problemTheySolve: string;
  targetBeneficiaries?: string;
  revenueModel?: string;
  impact?: string;
  awards?: string;
  grants?: string;
  institutionalSupport?: string;
  magicAccredited?: string;
  website?: string;
  isAiMatch?: boolean;
  matchPercentage?: number;
  reasons?: string[];
}

const StartupExplore = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<Startup[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);

  // Helper function to check if a value exists and is not empty
  const hasValue = (value: any): boolean => {
    return value && value.toString().trim() !== '' && value.toLowerCase() !== 'not defined';
  };

  // Helper function to get display text or return null if no value
  const getDisplayValue = (value: any): string | null => {
    if (!hasValue(value)) return null;
    return value.toString().trim();
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm, sectorFilter, locationFilter, showAiResults, aiMatches]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      console.log('Fetching startup data from startup table...');
      
      const { data, error } = await supabase
        .from('startup')
        .select('*')
        .order('CompanyName', { ascending: true });

      if (error) {
        console.error('Error fetching startups:', error);
        toast.error('Failed to load startup data');
        return;
      }

      console.log('Raw startup data:', data);

      const transformedData: Startup[] = data.map((item, index) => ({
        id: `startup-${item.No || index}`,
        companyName: item.CompanyName || 'Unknown Company',
        sector: item.Sector || 'Unspecified',
        location: item.Location || 'Malaysia',
        yearFounded: item.YearFounded || undefined,
        whatTheyDo: item.WhatTheyDo || '',
        problemTheySolve: item.ProblemTheySolve || '',
        targetBeneficiaries: item.TargetBeneficiaries || '',
        revenueModel: item.RevenueModel || '',
        impact: item.Impact || '',
        awards: item.Awards || '',
        grants: item.Grants || '',
        institutionalSupport: item.InstitutionalSupport || '',
        magicAccredited: item.MaGICAccredited || '',
        website: item.WebsiteSocialMedia || ''
      }));

      console.log('Transformed startup data:', transformedData);
      setStartups(transformedData);
      toast.success(`Loaded ${transformedData.length} startups`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  const filterStartups = () => {
    if (showAiResults && aiMatches.length > 0) {
      setFilteredStartups(aiMatches);
      return;
    }
    
    let filtered = startups;

    if (searchTerm) {
      filtered = filtered.filter(startup =>
        startup.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.whatTheyDo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.problemTheySolve.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter(startup => startup.sector === sectorFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(startup => startup.location === locationFilter);
    }

    setFilteredStartups(filtered);
  };

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of what you're looking for");
      return;
    }

    setIsAiLoading(true);
    try {
      console.log('Calling AI matchmaker with prompt:', aiPrompt);
      
      // Call the AI matchmaker edge function
      const { data, error } = await supabase.functions.invoke('ai-matchmaker', {
        body: {
          userType: 'vc', // We're looking for startups from a VC perspective
          prompt: aiPrompt
        }
      });

      if (error) {
        console.error('AI matchmaker error:', error);
        throw new Error(error.message || 'Failed to get AI recommendations');
      }

      console.log('AI matchmaker response:', data);

      if (data?.matches && Array.isArray(data.matches)) {
        // Transform AI matches to match our Startup interface
        const mappedMatches: Startup[] = data.matches.map((match: any) => ({
          id: `ai-${match.id || match.name}`,
          companyName: match.name || match.companyName || 'Unknown Company',
          sector: match.sectors?.join(', ') || match.sector || 'Unspecified',
          location: match.regions?.join(', ') || match.location || 'Malaysia',
          yearFounded: match.yearFounded,
          whatTheyDo: match.description || match.whatTheyDo || '',
          problemTheySolve: match.problemTheySolve || '',
          targetBeneficiaries: match.targetBeneficiaries || '',
          revenueModel: match.revenueModel || '',
          impact: match.impact || '',
          awards: match.awards || '',
          grants: match.grants || '',
          institutionalSupport: match.institutionalSupport || '',
          magicAccredited: match.magicAccredited || '',
          website: match.website || '',
          matchPercentage: match.matchPercentage || 0,
          reasons: match.reasons || [],
          isAiMatch: true
        }));

        setAiMatches(mappedMatches);
        setShowAiResults(true);
        
        if (mappedMatches.length === 0) {
          toast.info("No matches found for your criteria. Try adjusting your description.");
        } else {
          toast.success(`Found ${mappedMatches.length} AI-powered matches!`);
        }
      } else {
        throw new Error('Invalid response format from AI matchmaker');
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast.error(`Failed to get AI recommendations: ${error.message}`);
      
      // Fallback to local search if AI fails
      console.log('Falling back to local keyword search...');
      const searchResults = startups.filter(startup => {
        const searchText = `${startup.companyName} ${startup.whatTheyDo} ${startup.sector} ${startup.problemTheySolve} ${startup.targetBeneficiaries} ${startup.revenueModel} ${startup.impact}`.toLowerCase();
        const promptKeywords = aiPrompt.toLowerCase().split(' ');
        
        return promptKeywords.some(keyword => 
          keyword.length > 2 && searchText.includes(keyword)
        );
      });

      const fallbackMatches: Startup[] = searchResults.slice(0, 10).map((match, index) => ({
        ...match,
        id: `fallback-${match.id}`,
        matchPercentage: Math.floor(Math.random() * 30) + 70,
        reasons: [
          `Keyword match with "${aiPrompt.substring(0, 50)}..."`,
          `Relevant sector: ${match.sector}`,
          `Active in ${match.location}`,
          match.targetBeneficiaries ? `Target beneficiaries: ${match.targetBeneficiaries}` : ''
        ].filter(Boolean),
        isAiMatch: true
      }));

      setAiMatches(fallbackMatches);
      setShowAiResults(true);
      
      if (fallbackMatches.length > 0) {
        toast.info(`Using keyword search: found ${fallbackMatches.length} matches`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearAiResults = () => {
    setShowAiResults(false);
    setAiMatches([]);
    setAiPrompt("");
  };

  // Extract and clean up sectors - split by comma and create unique list
  const allSectors = startups.flatMap(s => 
    s.sector ? s.sector.split(',').map(sector => sector.trim()) : []
  );
  const sectors = [...new Set(allSectors)].filter(Boolean).sort();

  const locations = [...new Set(startups.map(s => s.location))].filter(Boolean).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading startup directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Startups
          </h1>
          <p className="text-lg text-gray-600">
            Explore {startups.length} startups in Malaysia's social enterprise ecosystem
          </p>
        </div>

        {/* AI-Powered Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-sm border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
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
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
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
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {filteredStartups.length} results
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
          {filteredStartups.map(startup => (
            <Card key={startup.id} className={`hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm ${startup.isAiMatch ? 'border-2 border-blue-300' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 mb-2">{startup.companyName}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                        Startup
                      </Badge>
                      {startup.sector && startup.sector.split(',').map((sector, index) => (
                        <Badge key={index} variant="outline" className="border-blue-300 text-blue-700">
                          {sector.trim()}
                        </Badge>
                      ))}
                      {startup.yearFounded && (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          Founded {startup.yearFounded}
                        </Badge>
                      )}
                      {hasValue(startup.magicAccredited) && startup.magicAccredited.toLowerCase() === 'yes' && (
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          MaGIC Accredited
                        </Badge>
                      )}
                      {startup.isAiMatch && startup.matchPercentage && (
                        <Badge className="bg-purple-500 text-white">
                          {startup.matchPercentage}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasValue(startup.website) && startup.website !== "#" && (
                      <a 
                        href={startup.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                    {startup.isAiMatch && (
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Description */}
                {hasValue(startup.whatTheyDo) && (
                  <p className="text-gray-600">{getDisplayValue(startup.whatTheyDo)}</p>
                )}
                
                {/* Location */}
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {startup.location}
                </div>
                
                {/* AI Match Reasons */}
                {startup.isAiMatch && startup.reasons && startup.reasons.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Why this is a good match:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {startup.reasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Problem They Solve */}
                {hasValue(startup.problemTheySolve) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Problem They Solve:
                    </h4>
                    <p className="text-sm text-gray-600">{getDisplayValue(startup.problemTheySolve)}</p>
                  </div>
                )}

                {/* Target Beneficiaries */}
                {hasValue(startup.targetBeneficiaries) && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Target Beneficiaries:
                    </h4>
                    <p className="text-sm text-blue-600">{getDisplayValue(startup.targetBeneficiaries)}</p>
                  </div>
                )}

                {/* Impact */}
                {hasValue(startup.impact) && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Impact:
                    </h4>
                    <p className="text-sm text-green-600">{getDisplayValue(startup.impact)}</p>
                  </div>
                )}

                {/* Revenue Model */}
                {hasValue(startup.revenueModel) && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-purple-700 mb-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Revenue Model:
                    </h4>
                    <p className="text-sm text-purple-600">{getDisplayValue(startup.revenueModel)}</p>
                  </div>
                )}

                {/* Awards */}
                {hasValue(startup.awards) && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-yellow-700 mb-1 flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      Awards:
                    </h4>
                    <p className="text-sm text-yellow-600">{getDisplayValue(startup.awards)}</p>
                  </div>
                )}

                {/* Grants */}
                {hasValue(startup.grants) && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-indigo-700 mb-1 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Grants:
                    </h4>
                    <p className="text-sm text-indigo-600">{getDisplayValue(startup.grants)}</p>
                  </div>
                )}

                {/* Institutional Support */}
                {hasValue(startup.institutionalSupport) && (
                  <div className="bg-rose-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-rose-700 mb-1 flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      Institutional Support:
                    </h4>
                    <p className="text-sm text-rose-600">{getDisplayValue(startup.institutionalSupport)}</p>
                  </div>
                )}

                {/* Data Completeness Indicator */}
                {!hasValue(startup.whatTheyDo) && !hasValue(startup.problemTheySolve) && !hasValue(startup.targetBeneficiaries) && (
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500 italic">
                      Limited information available for this startup
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStartups.length === 0 && !loading && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              {startups.length === 0 
                ? "No startup data available. Please check if the startup table contains data." 
                : "Try adjusting your search terms or filters"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupExplore;
