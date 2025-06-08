
import { ArrowRight, Target, Users, Globe, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-800">ASBhive</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link to="/explore" className="text-gray-600 hover:text-green-600 transition-colors">
                Explore
              </Link>
              <Link to="/contribute" className="text-gray-600 hover:text-green-600 transition-colors">
                Contribute
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-green-600 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Malaysia's Social Enterprise
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Ecosystem</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover, map, and connect with Malaysia's thriving social enterprise ecosystem. 
            Real-time data, community-driven insights, and comprehensive coverage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/explore">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 text-lg group">
                Explore the Ecosystem
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contribute">
              <Button variant="outline" size="lg" className="border-green-300 text-green-700 hover:bg-green-50 px-8 py-3 text-lg">
                Contribute Data
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Building Malaysia's Social Impact Future
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle className="text-lg">Discover Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Find accelerators, incubators, funders, and social enterprises across Malaysia
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Connect & Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access contact information and build meaningful partnerships
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle className="text-lg">Real-time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Community-driven data ensures fresh, accurate ecosystem mapping
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Lightbulb className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Data Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Advanced filtering and search to find exactly what you need
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 mb-8">
            ASBhive is dedicated to empowering Malaysia's social enterprise ecosystem by providing 
            a centralized, accessible platform that connects entrepreneurs, investors, and ecosystem 
            builders. We believe in the power of collaboration to create lasting social impact.
          </p>
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6">
            <p className="text-gray-700 italic">
              "Together, we're building a more sustainable and equitable future for Malaysia through 
              social innovation and enterprise."
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-lg font-bold">ASBhive</span>
          </div>
          <p className="text-gray-400">
            Mapping Malaysia's Social Enterprise Ecosystem • Built with ❤️ for social impact
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
