
import { useState, useMemo, useEffect } from "react";
import { Users, Target, TrendingUp, MapPin, Building, Mail, Globe, Sparkles, Send, Zap, Trophy, Heart, Lightbulb, Rocket, Star, Gift, Crown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface GrantProgram {
  id: number;
  company_name: string | null;
  fund_name: string | null;
  industry_sector: string | null;
  description_services: string | null;
  contact_info: string | null;
  website_url: string | null;
}

interface ConnectionChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  progress: number;
  target: number;
  completed: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

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
  
  // Connection Hub state
  const [userLevel, setUserLevel] = useState(3);
  const [userPoints, setUserPoints] = useState(1250);
  const [userRank, setUserRank] = useState("Connector");
  const [grantPrograms, setGrantPrograms] = useState<GrantProgram[]>([]);
  const [selectedHubSector, setSelectedHubSector] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  const connectionChallenges: ConnectionChallenge[] = [
    {
      id: "1",
      title: "First Connection",
      description: "Connect with your first VC or startup",
      icon: "🤝",
      points: 100,
      progress: 1,
      target: 1,
      completed: true,
    },
    {
      id: "2",
      title: "Sector Explorer",
      description: "Connect with VCs from 3 different sectors",
      icon: "🌐",
      points: 250,
      progress: 2,
      target: 3,
      completed: false,
    },
    {
      id: "3",
      title: "Knowledge Sharing",
      description: "Help 5 entrepreneurs with advice",
      icon: "🧠",
      points: 300,
      progress: 2,
      target: 5,
      completed: false,
    },
  ];

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "Network Builder",
      description: "Made 10 successful connections",
      icon: "🏗️",
      unlocked: true,
      rarity: "common",
    },
    {
      id: "2",
      title: "Sector Specialist",
      description: "Connected with VCs in your expertise area",
      icon: "💎",
      unlocked: true,
      rarity: "rare",
    },
    {
      id: "3",
      title: "Collaboration King",
      description: "Completed 5 collaboration challenges",
      icon: "👑",
      unlocked: false,
      rarity: "legendary",
    },
  ];

  useEffect(() => {
    fetchGrantPrograms();
  }, []);

  const fetchGrantPrograms = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('grant_programs')
        .select('*')
        .order('id');

      if (error) {
        throw error;
      }

      setGrantPrograms(data || []);
    } catch (error) {
      console.error('Error fetching grant programs:', error);
      toast({
        title: "Error loading VCs",
        description: "Could not load VC data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMatchPercentage = (profile: any) => {
    let totalWeight = 3;
    let matchScore = 0;

    const sectorMatches = profile.sectors.filter((s: string) => selectedSectors.includes(s));
    const sectorScore = selectedSectors.length > 0 ? (sectorMatches.length / selectedSectors.length) * 0.4 : 0;
    matchScore += sectorScore;

    const regionMatches = profile.regions.filter((r: string) => selectedRegions.includes(r));
    const regionScore = selectedRegions.length > 0 ? (regionMatches.length / selectedRegions.length) * 0.35 : 0;
    matchScore += regionScore;

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

  const getUniqueSectors = () => {
    const sectors = grantPrograms
      .filter(program => program.industry_sector)
      .map(program => program.industry_sector!)
      .filter((sector, index, array) => array.indexOf(sector) === index);
    return sectors;
  };

  const getFilteredPrograms = () => {
    if (selectedHubSector === "all") {
      return grantPrograms;
    }
    return grantPrograms.filter(program => program.industry_sector === selectedHubSector);
  };

  const calculateHubMatchScore = (program: GrantProgram) => {
    let score = Math.floor(Math.random() * 30) + 70;
    
    if (program.description_services) score += 5;
    if (program.contact_info) score += 5;
    if (program.website_url) score += 5;
    
    return Math.min(score, 100);
  };

  const handleConnect = (program: GrantProgram) => {
    toast({
      title: "Connection Initiated!",
      description: `You've sent a connection request to ${program.company_name || program.fund_name}`,
    });
    
    setUserPoints(prev => prev + 50);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-800";
      case "rare": return "bg-blue-100 text-blue-800";
      case "epic": return "bg-purple-100 text-purple-800";
      case "legendary": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Networking & Matchmaker Hub
            </h1>
            <p className="text-lg text-gray-600">
              Connect, level up, and find the right partners in Malaysia's ecosystem
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with gamification stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Networking & Matchmaker Hub
              </h1>
              <p className="text-gray-600 mt-2">
                You selected: <Badge className={userType === "vc" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                  {userType === "vc" ? "VC/Investor" : "Startup"}
                </Badge>
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userPoints}</div>
                <div className="text-sm text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">Level {userLevel}</div>
                <div className="text-sm text-gray-500">{userRank}</div>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">#12 Global</span>
              </div>
              <Button variant="outline" onClick={resetForm}>
                Change Type
              </Button>
            </div>
          </div>

          {/* Level progress */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress to Level {userLevel + 1}</span>
              <span className="text-sm text-gray-500">{userPoints}/1500 XP</span>
            </div>
            <Progress value={(userPoints % 1500) / 15} className="h-2" />
          </div>
        </div>

        <Tabs defaultValue="matchmaker" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="matchmaker">🎯 Smart Matching</TabsTrigger>
            <TabsTrigger value="discover">🔍 Discover VCs</TabsTrigger>
            <TabsTrigger value="challenges">🎯 Challenges</TabsTrigger>
            <TabsTrigger value="achievements">🏆 Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="matchmaker" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {/* Sector filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-3">Filter by Sector</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedHubSector === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedHubSector("all")}
                >
                  All Sectors
                </Button>
                {getUniqueSectors().map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedHubSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedHubSector(sector)}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            {/* VC/Grant Programs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-white/80 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                getFilteredPrograms().map((program) => {
                  const matchScore = calculateHubMatchScore(program);
                  return (
                    <Card key={program.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-lg">
                              {program.company_name || program.fund_name || "Unnamed Fund"}
                            </CardTitle>
                          </div>
                          <Badge className={`${matchScore >= 90 ? 'bg-green-100 text-green-800' : matchScore >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {matchScore}% Match
                          </Badge>
                        </div>
                        {program.fund_name && program.company_name && (
                          <p className="text-sm text-gray-600">{program.fund_name}</p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {program.industry_sector && (
                            <div>
                              <Badge variant="outline" className="text-xs">
                                {program.industry_sector}
                              </Badge>
                            </div>
                          )}
                          
                          {program.description_services && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {program.description_services}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {program.contact_info && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>Contact available</span>
                              </div>
                            )}
                            {program.website_url && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span>Website</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleConnect(program)}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              Connect (+50 XP)
                            </Button>
                            {program.website_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(program.website_url!, '_blank')}
                              >
                                <Globe className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectionChallenges.map((challenge) => (
                <Card key={challenge.id} className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{challenge.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{challenge.progress}/{challenge.target}</span>
                      </div>
                      <Progress value={(challenge.progress / challenge.target) * 100} />
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-100 text-purple-800">
                          {challenge.points} XP
                        </Badge>
                        {challenge.completed && (
                          <Badge className="bg-green-100 text-green-800">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={`bg-white/80 backdrop-blur-sm ${achievement.unlocked ? '' : 'opacity-60'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </Badge>
                      {achievement.unlocked ? (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          🔒 Locked
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Matchmaker;
