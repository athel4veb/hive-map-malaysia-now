import { useState, useMemo } from "react";
import { Users, Target, TrendingUp, MapPin, Building, Mail, Globe, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock data for testing
const mockProfiles = [
  {
    id: "1",
    userType: "startup",
    name: "GreenTech Solutions",
    description: "Sustainable technology for urban farming",
    sectors: ["Agriculture", "Technology", "Environment"],
    regions: ["Kuala Lumpur", "Selangor"],
    stages: ["Seed", "Series A"],
    contactEmail: "contact@greentech.my",
    website: "https://greentech.my"
  },
  {
    id: "2",
    userType: "startup",
    name: "HealthAI Malaysia",
    description: "AI-powered healthcare diagnostics",
    sectors: ["Healthcare", "Technology"],
    regions: ["Penang", "Kuala Lumpur"],
    stages: ["Series A", "Series B"],
    contactEmail: "hello@healthai.my",
    website: "https://healthai.my"
  },
  {
    id: "3",
    userType: "startup",
    name: "EduFin",
    description: "Financial literacy education platform",
    sectors: ["Education", "Finance"],
    regions: ["Johor", "Kuala Lumpur"],
    stages: ["Pre-Seed", "Seed"],
    contactEmail: "team@edufin.my",
    website: "https://edufin.my"
  },
  {
    id: "4",
    userType: "vc",
    name: "Malaysia Venture Partners",
    description: "Early-stage technology investor",
    sectors: ["Technology", "Healthcare", "Finance"],
    regions: ["Kuala Lumpur", "Selangor", "Penang"],
    stages: ["Pre-Seed", "Seed", "Series A"],
    contactEmail: "invest@mvp.my",
    website: "https://mvp.my"
  },
  {
    id: "5",
    userType: "vc",
    name: "Green Impact Fund",
    description: "Sustainable and environmental impact investing",
    sectors: ["Environment", "Agriculture", "Social Services"],
    regions: ["Kuala Lumpur", "Johor", "Penang"],
    stages: ["Seed", "Series A", "Series B"],
    contactEmail: "fund@greenimpact.my",
    website: "https://greenimpact.my"
  },
  {
    id: "6",
    userType: "vc",
    name: "TechNova Capital",
    description: "Technology-focused venture capital",
    sectors: ["Technology", "Education", "Healthcare"],
    regions: ["Kuala Lumpur", "Selangor"],
    stages: ["Series A", "Series B"],
    contactEmail: "contact@technova.my",
    website: "https://technova.my"
  }
];

const SECTORS = ["Technology", "Healthcare", "Education", "Finance", "Environment", "Agriculture", "Social Services"];
const REGIONS = ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Sabah", "Sarawak"];
const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B"];

const Matchmaker = () => {
  const [userType, setUserType] = useState<"vc" | "startup" | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMatches, setAiMatches] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiMatches, setShowAiMatches] = useState(false);
  const { toast } = useToast();

  const calculateMatchPercentage = (profile: any) => {
    let totalWeight = 3; // sectors, regions, stages
    let matchScore = 0;

    // Sector match (40% weight)
    const sectorMatches = profile.sectors.filter((s: string) => selectedSectors.includes(s));
    const sectorScore = selectedSectors.length > 0 ? (sectorMatches.length / selectedSectors.length) * 0.4 : 0;
    matchScore += sectorScore;

    // Region match (35% weight)
    const regionMatches = profile.regions.filter((r: string) => selectedRegions.includes(r));
    const regionScore = selectedRegions.length > 0 ? (regionMatches.length / selectedRegions.length) * 0.35 : 0;
    matchScore += regionScore;

    // Stage match (25% weight)
    const stageMatches = profile.stages.filter((s: string) => selectedStages.includes(s));
    const stageScore = selectedStages.length > 0 ? (stageMatches.length / selectedStages.length) * 0.25 : 0;
    matchScore += stageScore;

    return Math.round(matchScore * 100);
  };

  const getMatchReasons = (profile: any) => {
    const reasons = [];
    
    const sectorMatches = profile.sectors.filter((s: string) => selectedSectors.includes(s));
    if (sectorMatches.length > 0) {
      reasons.push(`Shared sectors: ${sectorMatches.join(", ")}`);
    }

    const regionMatches = profile.regions.filter((r: string) => selectedRegions.includes(r));
    if (regionMatches.length > 0) {
      reasons.push(`Common regions: ${regionMatches.join(", ")}`);
    }

    const stageMatches = profile.stages.filter((s: string) => selectedStages.includes(s));
    if (stageMatches.length > 0) {
      reasons.push(`Matching stages: ${stageMatches.join(", ")}`);
    }

    return reasons;
  };

  const matches = useMemo(() => {
    if (!userType || !showMatches) return [];

    const targetType = userType === "vc" ? "startup" : "vc";
    const candidates = mockProfiles.filter(p => p.userType === targetType);

    const scoredMatches = candidates.map(profile => ({
      ...profile,
      matchPercentage: calculateMatchPercentage(profile),
      reasons: getMatchReasons(profile)
    }));

    return scoredMatches
      .filter(m => m.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5);
  }, [userType, selectedSectors, selectedRegions, selectedStages, showMatches]);

  const handleFindMatches = () => {
    if (selectedSectors.length === 0 && selectedRegions.length === 0 && selectedStages.length === 0) {
      return;
    }
    setShowMatches(true);
    setShowAiMatches(false);
  };

  const handleAiMatch = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Please enter a description",
        description: "Describe your startup or investment focus to get AI-powered matches.",
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-matchmaker', {
        body: {
          userType,
          prompt: aiPrompt,
        },
      });

      if (error) throw error;

      setAiMatches(data.matches);
      setShowAiMatches(true);
      setShowMatches(false);
      
      toast({
        title: "AI matches found!",
        description: `Found ${data.matches.length} potential matches for you.`,
      });
    } catch (error) {
      console.error('AI matching error:', error);
      toast({
        title: "AI matching failed",
        description: "Please try again or use manual matching instead.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetForm = () => {
    setUserType(null);
    setSelectedSectors([]);
    setSelectedRegions([]);
    setSelectedStages([]);
    setShowMatches(false);
    setAiPrompt("");
    setAiMatches([]);
    setShowAiMatches(false);
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Matchmaker
            </h1>
            <p className="text-lg text-gray-600">
              Connect with the right partners in Malaysia's ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-2 hover:border-green-300"
              onClick={() => setUserType("vc")}
            >
              <CardContent className="p-8 text-center">
                <Building className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a VC</h3>
                <p className="text-gray-600">
                  Looking for promising startups to invest in
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-2 hover:border-blue-300"
              onClick={() => setUserType("startup")}
            >
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Startup</h3>
                <p className="text-gray-600">
                  Seeking investors and funding opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Find Your {userType === "vc" ? "Startup" : "Investor"} Match
              </h1>
              <p className="text-gray-600">
                You selected: <Badge className={userType === "vc" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                  {userType === "vc" ? "VC/Investor" : "Startup"}
                </Badge>
              </p>
            </div>
            <Button variant="outline" onClick={resetForm}>
              Change Type
            </Button>
          </div>
        </div>

        {!showMatches && !showAiMatches ? (
          <div className="space-y-8">
            {/* AI-Powered Matching Section */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI-Powered Matching
                </CardTitle>
                <p className="text-gray-600">
                  Describe your {userType === "vc" ? "investment focus and criteria" : "startup and what you're looking for"} in natural language, and our AI will find the best matches for you.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tell us about yourself</Label>
                  <Textarea
                    placeholder={userType === "vc" 
                      ? "e.g., We're a Series A focused fund investing in Southeast Asian fintech startups that are solving financial inclusion challenges. We particularly value companies with strong regulatory compliance and proven traction in emerging markets..."
                      : "e.g., We're a B2B SaaS startup building AI-powered inventory management solutions for SMEs in Malaysia. We've achieved product-market fit with 50+ paying customers and are looking for Series A funding to expand across Southeast Asia..."
                    }
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                
                <Button 
                  onClick={handleAiMatch}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isAiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Finding AI Matches...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Get AI Matches
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">OR</span>
              </div>
            </div>

            {/* Manual Matching Section */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Manual Preference Matching
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Sectors of Interest</Label>
                    <Select onValueChange={(value) => {
                      if (!selectedSectors.includes(value)) {
                        setSelectedSectors([...selectedSectors, value]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.filter(s => !selectedSectors.includes(s)).map(sector => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSectors.map(sector => (
                        <Badge 
                          key={sector} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setSelectedSectors(selectedSectors.filter(s => s !== sector))}
                        >
                          {sector} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Regions</Label>
                    <Select onValueChange={(value) => {
                      if (!selectedRegions.includes(value)) {
                        setSelectedRegions([...selectedRegions, value]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select regions" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.filter(r => !selectedRegions.includes(r)).map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedRegions.map(region => (
                        <Badge 
                          key={region} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setSelectedRegions(selectedRegions.filter(r => r !== region))}
                        >
                          {region} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Investment Stages</Label>
                    <Select onValueChange={(value) => {
                      if (!selectedStages.includes(value)) {
                        setSelectedStages([...selectedStages, value]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stages" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.filter(s => !selectedStages.includes(s)).map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedStages.map(stage => (
                        <Badge 
                          key={stage} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => setSelectedStages(selectedStages.filter(s => s !== stage))}
                        >
                          {stage} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={handleFindMatches}
                    disabled={selectedSectors.length === 0 && selectedRegions.length === 0 && selectedStages.length === 0}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Find Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {showAiMatches ? (
                  <>
                    <Sparkles className="inline h-6 w-6 text-purple-600 mr-2" />
                    AI-Powered Matches ({aiMatches.length})
                  </>
                ) : (
                  `Top ${matches.length} Matches (${userType === "vc" ? "Startups" : "Investors"})`
                )}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowMatches(false);
                  setShowAiMatches(false);
                }}>
                  Try Different Approach
                </Button>
              </div>
            </div>

            {(showAiMatches ? aiMatches : matches).length === 0 ? (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-600">Try adjusting your preferences or description to find more matches</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {(showAiMatches ? aiMatches : matches).map((match, index) => (
                  <Card key={match.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{match.name}</CardTitle>
                            <Badge className={showAiMatches ? "bg-purple-100 text-purple-800 text-lg px-3 py-1" : "bg-green-100 text-green-800 text-lg px-3 py-1"}>
                              {match.matchPercentage}% Match
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              #{index + 1}
                            </Badge>
                            {showAiMatches && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600">{match.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Sectors</h4>
                          <div className="flex flex-wrap gap-1">
                            {match.sectors.map((sector: string) => (
                              <Badge 
                                key={sector} 
                                variant="outline"
                                className={selectedSectors.includes(sector) ? "border-green-500 text-green-700" : ""}
                              >
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Regions</h4>
                          <div className="flex flex-wrap gap-1">
                            {match.regions.map((region: string) => (
                              <Badge 
                                key={region} 
                                variant="outline"
                                className={selectedRegions.includes(region) ? "border-blue-500 text-blue-700" : ""}
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Stages</h4>
                          <div className="flex flex-wrap gap-1">
                            {match.stages.map((stage: string) => (
                              <Badge 
                                key={stage} 
                                variant="outline"
                                className={selectedStages.includes(stage) ? "border-purple-500 text-purple-700" : ""}
                              >
                                {stage}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {match.reasons && match.reasons.length > 0 && (
                        <div className={showAiMatches ? "bg-purple-50 rounded-lg p-3" : "bg-green-50 rounded-lg p-3"}>
                          <h4 className={showAiMatches ? "font-medium text-purple-900 mb-2" : "font-medium text-green-900 mb-2"}>
                            {showAiMatches ? "AI Analysis:" : "Why this match:"}
                          </h4>
                          <ul className={showAiMatches ? "text-sm text-purple-800 space-y-1" : "text-sm text-green-800 space-y-1"}>
                            {match.reasons.map((reason: string, idx: number) => (
                              <li key={idx}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t">
                        {match.contactEmail && (
                          <a 
                            href={`mailto:${match.contactEmail}`}
                            className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </a>
                        )}
                        {match.website && (
                          <a 
                            href={match.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matchmaker;
