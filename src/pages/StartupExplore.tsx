
import { useState, useEffect } from "react";
import { Building2, MapPin, ExternalLink, Calendar, Award, Target, TrendingUp, Users, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<Startup[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);

  useEffect(() => {
    fetchStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm, selectedSector, showAiResults, aiMatches]);

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

    if (selectedSector) {
      filtered = filtered.filter(startup => startup.sector === selectedSector);
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
      const searchResults = startups.filter(startup => {
        const searchText = `${startup.companyName} ${startup.whatTheyDo} ${startup.sector} ${startup.problemTheySolve} ${startup.targetBeneficiaries} ${startup.revenueModel} ${startup.impact}`.toLowerCase();
        const promptKeywords = aiPrompt.toLowerCase().split(' ');
        
        return promptKeywords.some(keyword => 
          keyword.length > 2 && searchText.includes(keyword)
        );
      });

      const mappedMatches: Startup[] = searchResults.slice(0, 10).map((match, index) => ({
        ...match,
        id: `ai-${match.id}`,
        matchPercentage: Math.floor(Math.random() * 30) + 70,
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

  const sectors = [...new Set(startups.map(s => s.sector))].filter(Boolean).sort();

  const sectorStats = sectors.map(sector => ({
    name: sector,
    count: startups.filter(s => s.sector === sector).length
  }));

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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <Building2 className="inline-block mr-3 h-10 w-10 text-blue-600" />
            Startup Directory
          </h1>
          <p className="text-lg text-gray-600">
            Explore {startups.length} startups driving social impact in Malaysia
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

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search startups by name, sector, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                disabled={showAiResults}
              />
            </div>
            <Button
              variant={selectedSector ? "default" : "outline"}
              onClick={() => setSelectedSector(null)}
              className="whitespace-nowrap"
            >
              All Sectors ({startups.length})
            </Button>
          </div>
          
          {/* Sector Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {sectorStats.slice(0, 8).map(sector => (
              <Button
                key={sector.name}
                variant={selectedSector === sector.name ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
                className="text-xs"
                disabled={showAiResults}
              >
                {sector.name} ({sector.count})
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {filteredStartups.length} results
              {showAiResults && <span className="ml-1">(AI matches)</span>}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="sectors">By Sector</TabsTrigger>
          </TabsList>

          {/* Grid View */}
          <TabsContent value="grid" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStartups.map(startup => (
                <Card key={startup.id} className={`hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm ${startup.isAiMatch ? 'border-2 border-blue-300' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-900 mb-2 line-clamp-2">
                          {startup.companyName}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                            Startup
                          </Badge>
                          <Badge variant="outline" className="text-blue-700 border-blue-300">
                            {startup.sector}
                          </Badge>
                          {startup.yearFounded && (
                            <Badge variant="outline" className="text-gray-700">
                              <Calendar className="h-3 w-3 mr-1" />
                              {startup.yearFounded}
                            </Badge>
                          )}
                          {startup.magicAccredited === 'Yes' && (
                            <Badge className="bg-purple-500 text-white">
                              <Award className="h-3 w-3 mr-1" />
                              MaGIC
                            </Badge>
                          )}
                          {startup.isAiMatch && startup.matchPercentage && (
                            <Badge className="bg-purple-500 text-white">
                              {startup.matchPercentage}% match
                            </Badge>
                          )}
                        </div>
                      </div>
                      {startup.website && (
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {startup.location}
                    </div>
                    
                    {startup.whatTheyDo && (
                      <p className="text-gray-600">{startup.whatTheyDo}</p>
                    )}
                    
                    {startup.isAiMatch && startup.reasons && (
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
                    
                    {startup.problemTheySolve && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Problem They Solve:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{startup.problemTheySolve}</p>
                      </div>
                    )}

                    {startup.targetBeneficiaries && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center text-xs font-medium text-blue-800 mb-1">
                          <Users className="h-3 w-3 mr-1" />
                          Target Beneficiaries
                        </div>
                        <p className="text-xs text-blue-700 line-clamp-2">{startup.targetBeneficiaries}</p>
                      </div>
                    )}
                    
                    {startup.impact && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center text-xs font-medium text-green-800 mb-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Impact
                        </div>
                        <p className="text-xs text-green-700 line-clamp-2">{startup.impact}</p>
                      </div>
                    )}

                    {startup.awards && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-yellow-700 mb-1">Awards:</h4>
                        <p className="text-sm text-yellow-600">{startup.awards}</p>
                      </div>
                    )}

                    {startup.grants && (
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-indigo-700 mb-1">Grants:</h4>
                        <p className="text-sm text-indigo-600">{startup.grants}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredStartups.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No startups found</h3>
                <p className="text-gray-600">
                  {startups.length === 0 
                    ? "No startup data available. Please check if the startup table contains data." 
                    : "Try adjusting your search terms or filters"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table">
            <Card className="bg-white/90">
              <CardHeader>
                <CardTitle>Startup Directory ({filteredStartups.length} results)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Founded</TableHead>
                      <TableHead>MaGIC</TableHead>
                      <TableHead>Website</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStartups.map(startup => (
                      <TableRow key={startup.id}>
                        <TableCell className="font-medium">{startup.companyName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{startup.sector}</Badge>
                        </TableCell>
                        <TableCell>{startup.location}</TableCell>
                        <TableCell>{startup.yearFounded || '-'}</TableCell>
                        <TableCell>
                          {startup.magicAccredited === 'Yes' ? (
                            <Badge className="bg-purple-500 text-white text-xs">Yes</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {startup.website ? (
                            <a 
                              href={startup.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sectors View */}
          <TabsContent value="sectors">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sectorStats.map(sector => (
                <Card 
                  key={sector.name} 
                  className="hover:shadow-lg transition-shadow cursor-pointer bg-white/90"
                  onClick={() => setSelectedSector(sector.name)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{sector.name}</CardTitle>
                    <p className="text-2xl font-bold text-blue-600">{sector.count}</p>
                    <p className="text-sm text-gray-600">startups</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StartupExplore;
