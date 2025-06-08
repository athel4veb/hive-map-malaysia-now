
import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

const DataInput = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startup_name: "",
    website_url: "",
    description: "",
    industry_sector: "",
    location: "",
    founding_year: "",
    contact_info: "",
    related_news_updates: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.startup_name || !formData.description || !formData.industry_sector) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the startup name, description, and industry sector.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into Supabase startups table
      const { error } = await supabase
        .from('startups')
        .insert([{
          startup_name: formData.startup_name,
          website_url: formData.website_url,
          description: formData.description,
          industry_sector: formData.industry_sector,
          location: formData.location,
          founding_year: formData.founding_year ? parseInt(formData.founding_year) : null,
          contact_info: formData.contact_info,
          related_news_updates: formData.related_news_updates
        }]);

      if (error) {
        throw error;
      }

      console.log("Data submitted successfully:", formData);
      
      toast({
        title: "Thank you!",
        description: "Your startup has been submitted and added to our database.",
      });
      
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          startup_name: "",
          website_url: "",
          description: "",
          industry_sector: "",
          location: "",
          founding_year: "",
          contact_info: "",
          related_news_updates: ""
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting data:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center bg-white/90 backdrop-blur-sm">
            <CardContent className="py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Thank You for Contributing!
              </h2>
              <p className="text-gray-600 mb-6">
                Your startup submission has been received and added to our database. 
                Together, we're building a comprehensive map of Malaysia's startup ecosystem.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to form in a few seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contribute to the Ecosystem
          </h1>
          <p className="text-lg text-gray-600">
            Help us map Malaysia's startup ecosystem by sharing information 
            about startups you know.
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Startup Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startup_name">Startup Name *</Label>
                  <Input
                    id="startup_name"
                    value={formData.startup_name}
                    onChange={(e) => handleInputChange("startup_name", e.target.value)}
                    placeholder="Enter startup name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => handleInputChange("website_url", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the startup and its mission"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry_sector">Industry Sector *</Label>
                  <Select value={formData.industry_sector} onValueChange={(value) => handleInputChange("industry_sector", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Agriculture">Agriculture</SelectItem>
                      <SelectItem value="Social Services">Social Services</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                      <SelectItem value="Selangor">Selangor</SelectItem>
                      <SelectItem value="Penang">Penang</SelectItem>
                      <SelectItem value="Johor">Johor</SelectItem>
                      <SelectItem value="Sabah">Sabah</SelectItem>
                      <SelectItem value="Sarawak">Sarawak</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="founding_year">Founding Year</Label>
                  <Input
                    id="founding_year"
                    type="number"
                    value={formData.founding_year}
                    onChange={(e) => handleInputChange("founding_year", e.target.value)}
                    placeholder="2024"
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_info">Contact Information</Label>
                <Textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange("contact_info", e.target.value)}
                  placeholder="Email, phone, or other contact details"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="related_news_updates">Related News & Updates</Label>
                <Textarea
                  id="related_news_updates"
                  value={formData.related_news_updates}
                  onChange={(e) => handleInputChange("related_news_updates", e.target.value)}
                  placeholder="Recent news, funding rounds, achievements, or other relevant updates"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8 py-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Startup"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            * Required fields. All submissions are added directly to our database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataInput;
