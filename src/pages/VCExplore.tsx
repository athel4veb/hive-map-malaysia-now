
import { useState, useEffect } from "react";
import { Building2, MapPin, ExternalLink, Globe, Award, TrendingUp, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

const VCExplore = () => {
  const [vcData, setVcData] = useState<VCData[]>([]);
  const [filteredVcData, setFilteredVcData] = useState<VCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    fetchVCData();
  }, []);

  useEffect(() => {
    filterVCData();
  }, [vcData, searchTerm, selectedSector]);

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
    let filtered = vcData;

    if (searchTerm) {
      filtered = filtered.filter(vc =>
        vc.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.fundName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.industrySector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vc.descriptionServices.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSector) {
      filtered = filtered.filter(vc => vc.industrySector === selectedSector);
    }

    setFilteredVcData(filtered);
  };

  const sectors = [...new Set(vcData.map(vc => vc.industrySector))].filter(Boolean).sort();

  const sectorStats = sectors.map(sector => ({
    name: sector,
    count: vcData.filter(vc => vc.industrySector === sector).length
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading VC directory...</p>
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
            <TrendingUp className="inline-block mr-3 h-10 w-10 text-green-600" />
            VC & Grant Programs Directory
          </h1>
          <p className="text-lg text-gray-600">
            Explore {vcData.length} venture capital firms and grant programs supporting innovation
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by company name, fund, sector, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant={selectedSector ? "default" : "outline"}
              onClick={() => setSelectedSector(null)}
              className="whitespace-nowrap"
            >
              All Sectors ({vcData.length})
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
              >
                {sector.name} ({sector.count})
              </Button>
            ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVcData.map(vc => (
                <Card key={vc.id} className="hover:shadow-lg transition-shadow bg-white/90">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 mb-2 line-clamp-2">
                          {vc.companyName}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            {vc.industrySector}
                          </Badge>
                          {vc.fundName && vc.fundName !== 'N/A' && (
                            <Badge variant="outline" className="text-purple-700 border-purple-300">
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
                        </div>
                      </div>
                      {vc.websiteUrl && (
                        <a 
                          href={vc.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vc.descriptionServices && (
                      <p className="text-sm text-gray-600 line-clamp-3">{vc.descriptionServices}</p>
                    )}
                    
                    {vc.programParticipation && (
                      <div className="bg-green-50 rounded-lg p-2">
                        <div className="flex items-center text-xs font-medium text-green-800 mb-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Program Participation
                        </div>
                        <p className="text-xs text-green-700 line-clamp-2">{vc.programParticipation}</p>
                      </div>
                    )}
                    
                    {vc.contactInfo && (
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-center text-xs font-medium text-blue-800 mb-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          Contact Information
                        </div>
                        <p className="text-xs text-blue-700 line-clamp-2">{vc.contactInfo}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredVcData.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No VC data found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table">
            <Card className="bg-white/90">
              <CardHeader>
                <CardTitle>VC & Grant Programs Directory ({filteredVcData.length} results)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Fund Name</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Social Enterprise</TableHead>
                      <TableHead>Website</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVcData.map(vc => (
                      <TableRow key={vc.id}>
                        <TableCell className="font-medium">{vc.companyName}</TableCell>
                        <TableCell>{vc.fundName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{vc.industrySector}</Badge>
                        </TableCell>
                        <TableCell>
                          {vc.socialEnterpriseStatus ? (
                            <Badge className="bg-blue-500 text-white text-xs">Yes</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {vc.websiteUrl ? (
                            <a 
                              href={vc.websiteUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800"
                            >
                              <Globe className="h-4 w-4" />
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
                    <p className="text-2xl font-bold text-green-600">{sector.count}</p>
                    <p className="text-sm text-gray-600">programs</p>
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

export default VCExplore;
