
import { useState, useEffect } from "react";
import { Building2, MapPin, ExternalLink, Globe, Award, TrendingUp, Users, Search, Sparkles, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface VCData {
  id: number;
  companyName: string;
  fundName: string;
  industrySector: string;
  descriptionServices: string;
  websiteUrl: string;
  contactInfo: string;
  socialEnterpriseStatus: string;
  programParticipation: string;
  relatedNewsUpdates: string;
  isAiMatch?: boolean;
  matchPercentage?: number;
  reasons?: string[];
}

const VCExplore = () => {
  const [vcData, setVcData] = useState<VCData[]>([]);
  const [filteredVcData, setFilteredVcData] = useState<VCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<VCData[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);

  useEffect(() => {
    fetchVCData();
  }, []);

  useEffect(() => {
    filterVCData();
  }, [vcData, searchTerm, sectorFilter, showAiResults, aiMatches]);

  const fetchVCData = async () => {
    try {
      setLoading(true);
      console.log('Fetching VC data from grant_programs table...');
      
      const { data, error } = await supabase
        .from('grant_programs')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) {
        console.error('Error fetching VC data:', error);
        toast.error('Failed to load VC data');
        return;
      }

      console.log('Raw VC data:', data);

      const transformedData: VCData[] = data.map((item) => ({
        id: item.id,
        companyName: item.company_name || 'Unknown Company',
        fundName: item.fund_name || 'N/A',
        industrySector: item.industry_sector || 'Unspecified',
        descriptionServices: item.description_services || '',
        websiteUrl: item.website_url || '',
        contactInfo: item.contact_info || '',
        socialEnterpriseStatus: item.social_enterprise_status || '',
        programParticipation: item.program_participation || '',
        relatedNewsUpdates: item.related_news_updates || ''
      }));

      console.log('Transformed VC data:', transformedData);
      setVcData(transformedData);
      toast.success(`Loaded ${transformedData.length} VC entries`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while loading VC data');
    } finally {
      setLoading(false);
    }
  };

  const filterVCData = () => {
    if (showAiResults && aiMatches.length > 0) {
      setFilteredVcData(aiMatches);
      return;
    }
    
    let filtered = vcData;

    if (searchTerm) {
      filtered = filtered.filter(vc =>
        vc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.industrySector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.descriptionServices.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter(vc => vc.industrySector === sectorFilter);
    }

    setFilteredVcData(filtered);
  };

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of what you're looking for");
      return;
    }

    setIsAiLoading(true);
    try {
      console.log('Calling AI matchmaker for VC recommendations...');
      
      const { data, error } = await supabase.functions.invoke('ai-matchmaker', {
        body: {
          userType: 'vc',
          prompt: aiPrompt
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }

      console.log('AI matchmaker response:', data);

      if (!data || !data.matches) {
        throw new Error('Invalid response from AI matchmaker');
      }

      // Map AI matches to VC data format
      const mappedMatches: VCData[] = data.matches.map((match: any) => {
        // Try to find the VC in our dataset by name
        const vcMatch = vcData.find(vc => 
          vc.companyName.toLowerCase() === match.name.toLowerCase() ||
          vc.companyName.toLowerCase().includes(match.name.toLowerCase()) ||
          match.name.toLowerCase().includes(vc.companyName.toLowerCase())
        );

        if (vcMatch) {
          return {
            ...vcMatch,
            matchPercentage: match.matchPercentage,
            reasons: match.reasons,
            isAiMatch: true
          };
        }

        // If no exact match found, create a placeholder entry
        return {
          id: Math.random() * 10000,
          companyName: match.name,
          fundName: 'AI Recommended',
          industrySector: 'Various',
          descriptionServices: match.reasons?.join('. ') || 'AI recommended match',
          websiteUrl: '',
          contactInfo: '',
          socialEnterpriseStatus: '',
          programParticipation: '',
          relatedNewsUpdates: '',
          matchPercentage: match.matchPercentage,
          reasons: match.reasons,
          isAiMatch: true
        };
      });

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

  // Extract and clean up sectors - split by comma and create unique list
  const allSectors = vcData.flatMap(vc => 
    vc.industrySector ? vc.industrySector.split(',').map(sector => sector.trim()) : []
  );
  const sectors = [...new Set(allSectors)].filter(Boolean).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading VC directory...</p>
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
            Discover VC & Grant Programs
          </h1>
          <p className="text-lg text-gray-600">
            Explore {vcData.length} venture capital firms and grant programs supporting innovation
          </p>
        </div>

        {/* AI-Powered Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-sm border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Discovery</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Describe what type of VC firm or grant program you're looking for, and our AI will find the best matches
          </p>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., 'I'm looking for early-stage venture capital firms focused on fintech and sustainable technology in Southeast Asia...'"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search VC firms and grant programs..."
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
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300">
              {filteredVcData.length} results
              {showAiResults && <span className="ml-1">(AI matches)</span>}
            </Badge>
            {sectorFilter !== "all" && (
              <Badge variant="secondary" onClick={() => setSectorFilter("all")} className="cursor-pointer">
                Sector: {sectorFilter} ×
              </Badge>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVcData.map(vc => (
            <Card key={vc.id} className={`hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm ${vc.isAiMatch ? 'border-2 border-green-300' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{vc.companyName}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-green-500 text-white hover:bg-green-600">
                        VC/Grant
                      </Badge>
                      {vc.industrySector && vc.industrySector.split(',').map((sector, index) => (
                        <Badge key={index} variant="outline" className="border-green-300 text-green-700">
                          {sector.trim()}
                        </Badge>
                      ))}
                      {vc.fundName && vc.fundName !== 'N/A' && (
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          <Award className="h-3 w-3 mr-1" />
                          {vc.fundName}
                        </Badge>
                      )}
                      {vc.socialEnterpriseStatus && (
                        <Badge className="bg-blue-500 text-white">
                          <Users className="h-3 w-3 mr-1" />
                          Social Enterprise
                        </Badge>
                      )}
                      {vc.isAiMatch && vc.matchPercentage && (
                        <Badge className="bg-purple-500 text-white">
                          {vc.matchPercentage}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  {vc.websiteUrl && vc.websiteUrl !== "#" && (
                    <a 
                      href={vc.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  {vc.isAiMatch && (
                    <Sparkles className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vc.descriptionServices && (
                  <p className="text-gray-600">{vc.descriptionServices}</p>
                )}
                
                {vc.isAiMatch && vc.reasons && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Why this is a good match:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {vc.reasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {vc.programParticipation && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-green-700 mb-1">Program Participation:</h4>
                    <p className="text-sm text-green-600">{vc.programParticipation}</p>
                  </div>
                )}
                
                {vc.contactInfo && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-700 mb-1">Contact Information:</h4>
                    <p className="text-sm text-blue-600">{vc.contactInfo}</p>
                  </div>
                )}

                {vc.relatedNewsUpdates && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-yellow-700 mb-1">News & Updates:</h4>
                    <p className="text-sm text-yellow-600">{vc.relatedNewsUpdates}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVcData.length === 0 && !loading && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              {vcData.length === 0 
                ? "No VC data available. Please check if the grant_programs table contains data." 
                : "Try adjusting your search terms or filters"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VCExplore;
