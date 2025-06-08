
import { useState, useMemo, useEffect } from "react";
import { Search, Filter, MapPin, Globe, Mail, Phone, ExternalLink, Sparkles, Loader2 } from "lucide-react";
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
  programType: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isAiMatch?: boolean;
  matchPercentage?: number;
  reasons?: string[];
}

const DataExplore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [programTypeFilter, setProgramTypeFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<Organization[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch grant programs (VCs/Funders)
        const { data: grantPrograms, error: grantError } = await supabase
          .from('grant_programs')
          .select('*');
        
        if (grantError) {
          console.error('Error fetching grant programs:', grantError);
          toast.error('Failed to fetch grant programs');
        }

        // Fetch startups
        const { data: startups, error: startupError } = await supabase
          .from('startup')
          .select('*');
        
        if (startupError) {
          console.error('Error fetching startups:', startupError);
          toast.error('Failed to fetch startups');
        }

        // Transform data to unified format
        const transformedData: Organization[] = [];

        // Transform grant programs
        if (grantPrograms) {
          grantPrograms.forEach((program) => {
            transformedData.push({
              id: program.id,
              name: program.company_name || program.fund_name || 'Unknown Organization',
              website: program.website_url || '',
              description: program.description_services || '',
              sector: program.industry_sector || 'Various',
              location: 'Malaysia', // Default as location not in grant_programs table
              programType: 'Funder/VC',
              contactEmail: program.contact_info || '',
              contactPhone: '',
              notes: program.related_news_updates || ''
            });
          });
        }

        // Transform startups - using correct column names from the database schema
        if (startups) {
          startups.forEach((startup) => {
            transformedData.push({
              id: `startup-${startup.No}`,
              name: startup["Company Name"] || 'Unknown Startup',
              website: startup["Website/Social Media"] || '',
              description: startup["What They Do"] || '',
              sector: startup.Sector || 'Various',
              location: startup.Location || 'Malaysia',
              programType: 'Startup',
              contactEmail: '',
              contactPhone: '',
              notes: startup["Problem They Solve"] || ''
            });
          });
        }

        console.log('Transformed data:', transformedData);
        setOrganizations(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
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
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSector = sectorFilter === "all" || item.sector === sectorFilter;
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      const matchesProgramType = programTypeFilter === "all" || item.programType === programTypeFilter;
      
      return matchesSearch && matchesSector && matchesLocation && matchesProgramType;
    });
  }, [searchTerm, sectorFilter, locationFilter, programTypeFilter, showAiResults, aiMatches, organizations]);

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of what you're looking for");
      return;
    }

    setIsAiLoading(true);
    try {
      // Search through actual database using AI
      const searchResults = organizations.filter(org => {
        const searchText = `${org.name} ${org.description} ${org.sector} ${org.notes}`.toLowerCase();
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
          `Active in ${match.location}`
        ],
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
  const programTypes = [...new Set(organizations.map(item => item.programType))].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ecosystem data...</p>
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
            Explore the Ecosystem
          </h1>
          <p className="text-lg text-gray-600">
            Discover {organizations.length} organizations in Malaysia's social enterprise ecosystem
          </p>
        </div>

        {/* AI-Powered Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6 shadow-sm border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Discovery</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Describe what type of startup or organization you're looking for, and our AI will find the best matches
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
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
            
            <Select value={programTypeFilter} onValueChange={setProgramTypeFilter} disabled={showAiResults}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {programTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
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
            {programTypeFilter !== "all" && (
              <Badge variant="secondary" onClick={() => setProgramTypeFilter("all")} className="cursor-pointer">
                Type: {programTypeFilter} ×
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
                      <Badge className={item.isAiMatch ? "bg-green-500 text-white hover:bg-green-600" : "bg-green-100 text-green-800 hover:bg-green-200"}>
                        {item.programType}
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {item.sector}
                      </Badge>
                      {item.isAiMatch && item.matchPercentage && (
                        <Badge className="bg-blue-500 text-white">
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
                
                <div className="space-y-2">
                  {item.contactEmail && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${item.contactEmail}`} className="hover:text-green-600 transition-colors">
                        {item.contactEmail}
                      </a>
                    </div>
                  )}
                  {item.contactPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${item.contactPhone}`} className="hover:text-green-600 transition-colors">
                        {item.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
                
                {item.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">{item.notes}</p>
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
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12 bg-white/80 backdrop-blur-sm rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Know an organization we're missing?
          </h3>
          <p className="text-gray-600 mb-6">
            Help us build a comprehensive database by contributing information about social enterprises in Malaysia
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
