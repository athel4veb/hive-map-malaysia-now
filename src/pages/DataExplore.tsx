
import { useState, useMemo } from "react";
import { Search, Filter, MapPin, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

// Mock data for demonstration
const mockData = [
  {
    id: 1,
    name: "GreenTech Accelerator KL",
    website: "https://greentech-kl.com",
    description: "Accelerating sustainable technology startups in Malaysia",
    sector: "Technology",
    location: "Kuala Lumpur",
    programType: "Accelerator",
    contactEmail: "info@greentech-kl.com",
    contactPhone: "+60 3-2123 4567",
    notes: "Focus on clean energy and environmental solutions"
  },
  {
    id: 2,
    name: "Social Impact Ventures",
    website: "https://sivmalaysia.org",
    description: "Investment fund supporting social enterprises across Southeast Asia",
    sector: "Finance",
    location: "Selangor",
    programType: "Funder",
    contactEmail: "contact@sivmalaysia.org",
    contactPhone: "+60 3-7890 1234",
    notes: "Minimum investment RM 100k, focus on measurable social impact"
  },
  {
    id: 3,
    name: "Rural Education Initiative",
    website: "https://rural-edu.my",
    description: "Improving educational access in rural Malaysian communities",
    sector: "Education",
    location: "Sabah",
    programType: "Social Enterprise",
    contactEmail: "team@rural-edu.my",
    contactPhone: "+60 8-8765 4321",
    notes: "Currently serving 25 rural schools"
  },
  {
    id: 4,
    name: "HealthTech Incubator",
    website: "https://healthtech.my",
    description: "Supporting healthcare innovation and digital health solutions",
    sector: "Healthcare",
    location: "Penang",
    programType: "Incubator",
    contactEmail: "hello@healthtech.my",
    contactPhone: "+60 4-1234 5678",
    notes: "12-month program with mentorship and funding"
  }
];

const DataExplore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [programTypeFilter, setProgramTypeFilter] = useState("all");

  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSector = sectorFilter === "all" || item.sector === sectorFilter;
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      const matchesProgramType = programTypeFilter === "all" || item.programType === programTypeFilter;
      
      return matchesSearch && matchesSector && matchesLocation && matchesProgramType;
    });
  }, [searchTerm, sectorFilter, locationFilter, programTypeFilter]);

  const sectors = [...new Set(mockData.map(item => item.sector))];
  const locations = [...new Set(mockData.map(item => item.location))];
  const programTypes = [...new Set(mockData.map(item => item.programType))];

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
            Discover {mockData.length} organizations in Malaysia's social enterprise ecosystem
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
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
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
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
            
            <Select value={programTypeFilter} onValueChange={setProgramTypeFilter}>
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
            <Card key={item.id} className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 mb-2">{item.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {item.programType}
                      </Badge>
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {item.sector}
                      </Badge>
                    </div>
                  </div>
                  {item.website && (
                    <a 
                      href={item.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{item.description}</p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  {item.location}
                </div>
                
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

        {filteredData.length === 0 && (
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
