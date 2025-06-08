import { useState, useEffect } from "react";
import { Users, Zap, Trophy, Heart, Lightbulb, Rocket, Star, Target, Gift, Sparkles, Crown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";

const connectionChallenges = [
  {
    id: 1,
    title: "Coffee Chat Challenge",
    description: "Set up 3 virtual coffee chats this week",
    icon: "☕",
    points: 150,
    progress: 1,
    target: 3,
    difficulty: "Easy"
  },
  {
    id: 2,
    title: "Pitch Perfect",
    description: "Share your 60-second elevator pitch",
    icon: "🎯",
    points: 200,
    progress: 0,
    target: 1,
    difficulty: "Medium"
  },
  {
    id: 3,
    title: "Knowledge Sharing",
    description: "Help 5 entrepreneurs with advice",
    icon: "🧠",
    points: 300,
    progress: 2,
    target: 5,
    difficulty: "Hard"
  }
];

const collaborationGames = [
  {
    id: 1,
    title: "Startup Speed Dating",
    description: "3-minute rapid connections with VCs",
    participants: 12,
    timeLeft: "2h 30m",
    status: "joining",
    icon: "💕"
  },
  {
    id: 2,
    title: "Innovation Jam Session",
    description: "Collaborative problem-solving workshop",
    participants: 8,
    timeLeft: "45m",
    status: "live",
    icon: "🎵"
  },
  {
    id: 3,
    title: "Future Builders Tournament",
    description: "Team up to solve real-world challenges",
    participants: 24,
    timeLeft: "Next Monday",
    status: "upcoming",
    icon: "🏆"
  }
];

const achievements = [
  { title: "First Connection", icon: "🤝", unlocked: true },
  { title: "Conversation Starter", icon: "💬", unlocked: true },
  { title: "Network Builder", icon: "🌐", unlocked: false },
  { title: "Collaboration Champion", icon: "👑", unlocked: false }
];

const ConnectionHub = () => {
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(420);
  const [userLevel, setUserLevel] = useState(3);
  const [streak, setStreak] = useState(7);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleJoinGame = (gameId: number) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    // Here you would implement the actual game joining logic
  };

  const handleCompleteChallenge = (challengeId: number) => {
    setUserPoints(prev => prev + 50);
    // Here you would implement challenge completion logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 relative overflow-hidden">
      <Navbar />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Connection Hub
            </h1>
            <Sparkles className="h-8 w-8 text-blue-600 ml-2" />
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Where VCs and Startups Connect, Collaborate, and Create Magic ✨
          </p>
          
          {/* User Stats */}
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userPoints}</div>
              <div className="text-sm text-gray-500">Connection Points</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="text-2xl font-bold text-yellow-600">Level {userLevel}</span>
              </div>
              <div className="text-sm text-gray-500">Network Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{streak} 🔥</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connection Challenges */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-purple-600" />
                  Daily Connection Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectionChallenges.map((challenge) => (
                  <div key={challenge.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{challenge.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {challenge.difficulty}
                        </Badge>
                        <div className="text-sm font-medium text-purple-600 mt-1">
                          +{challenge.points} pts
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{challenge.progress}/{challenge.target}</span>
                        </div>
                        <Progress 
                          value={(challenge.progress / challenge.target) * 100} 
                          className="h-2"
                        />
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {challenge.progress >= challenge.target ? "Claim" : "Continue"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Collaboration Games */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-blue-100 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-600" />
                  Live Collaboration Games
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {collaborationGames.map((game) => (
                  <div key={game.id} className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{game.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{game.title}</h3>
                          <p className="text-sm text-gray-600">{game.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {game.participants} participants
                            </span>
                            <span className="text-xs text-gray-500">
                              {game.status === 'live' ? '🔴 LIVE' : 
                               game.status === 'joining' ? '🟡 Joining' : '🟢 Upcoming'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600 mb-2">
                          {game.timeLeft}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleJoinGame(game.id)}
                          className={`${
                            game.status === 'live' ? 'bg-red-600 hover:bg-red-700' :
                            game.status === 'joining' ? 'bg-yellow-600 hover:bg-yellow-700' :
                            'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {game.status === 'live' ? 'Join Now' : 
                           game.status === 'joining' ? 'Join Queue' : 'Set Reminder'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-yellow-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg text-center border-2 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div className={`text-xs font-medium ${
                        achievement.unlocked ? 'text-yellow-800' : 'text-gray-500'
                      }`}>
                        {achievement.title}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-green-600" />
                  Quick Connect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  onClick={() => navigate('/matchmaker')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Perfect Match
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Random Connection
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Join Community
                </Button>
              </CardContent>
            </Card>

            {/* Fun Stats */}
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-pink-600" />
                  Fun Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Connections Made</span>
                  <span className="font-bold text-pink-600">42 🤝</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coffee Chats</span>
                  <span className="font-bold text-purple-600">18 ☕</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ideas Shared</span>
                  <span className="font-bold text-blue-600">127 💡</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">High Fives Given</span>
                  <span className="font-bold text-green-600">89 🙌</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionHub;
