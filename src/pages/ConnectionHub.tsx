
import { useState, useEffect } from "react";
import { Users, Zap, Trophy, Heart, Lightbulb, Rocket, Star, Target, Gift, Sparkles, Crown, Award, Building2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const ConnectionHub = () => {
  const [userLevel, setUserLevel] = useState(3);
  const [userPoints, setUserPoints] = useState(1250);
  const [userRank, setUserRank] = useState("Connector");
  const [grantPrograms, setGrantPrograms] = useState<GrantProgram[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>("all");
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

  const getUniqueSectors = () => {
    const sectors = grantPrograms
      .filter(program => program.industry_sector)
      .map(program => program.industry_sector!)
      .filter((sector, index, array) => array.indexOf(sector) === index);
    return sectors;
  };

  const getFilteredPrograms = () => {
    if (selectedSector === "all") {
      return grantPrograms;
    }
    return grantPrograms.filter(program => program.industry_sector === selectedSector);
  };

  const calculateMatchScore = (program: GrantProgram) => {
    // Simple matching algorithm based on available data
    let score = Math.floor(Math.random() * 30) + 70; // Base score 70-100
    
    // Boost score if has complete information
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
    
    // Update points (this would normally be saved to a user profile)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with gamification stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Connection Hub
              </h1>
              <p className="text-gray-600 mt-2">Level up your networking game!</p>
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

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="discover">🔍 Discover VCs</TabsTrigger>
            <TabsTrigger value="challenges">🎯 Challenges</TabsTrigger>
            <TabsTrigger value="achievements">🏆 Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Sector filter */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-3">Filter by Sector</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSector === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSector("all")}
                >
                  All Sectors
                </Button>
                {getUniqueSectors().map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSector(sector)}
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
                  const matchScore = calculateMatchScore(program);
                  return (
                    <Card key={program.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-purple-600" />
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

export default ConnectionHub;
