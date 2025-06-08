
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

const DataInput = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    website: "",
    description: "",
    sector: "",
    location: "",
    programType: "",
    contactEmail: "",
    contactPhone: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.organizationName || !formData.description || !formData.sector) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the organization name, description, and sector.",
        variant: "destructive",
      });
      return;
    }

    // Simulate submission
    console.log("Submitting data:", formData);
    
    toast({
      title: "Thank you!",
      description: "Your contribution has been submitted and will be reviewed.",
    });
    
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        organizationName: "",
        website: "",
        description: "",
        sector: "",
        location: "",
        programType: "",
        contactEmail: "",
        contactPhone: "",
        notes: ""
      });
    }, 3000);
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
                Your submission has been received and will be reviewed by our team. 
                Together, we're building a comprehensive map of Malaysia's social enterprise ecosystem.
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
            Help us map Malaysia's social enterprise ecosystem by sharing information 
            about organizations you know.
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    placeholder="Enter organization name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website / Link</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
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
                  placeholder="Brief description of the organization and its mission"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector *</Label>
                  <Select value={formData.sector} onValueChange={(value) => handleInputChange("sector", value)}>
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
                  <Label htmlFor="programType">Program Type</Label>
                  <Select value={formData.programType} onValueChange={(value) => handleInputChange("programType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accelerator">Accelerator</SelectItem>
                      <SelectItem value="Incubator">Incubator</SelectItem>
                      <SelectItem value="Funder">Funder</SelectItem>
                      <SelectItem value="Social Enterprise">Social Enterprise</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="Government Agency">Government Agency</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="contact@organization.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="+60 3-1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional information about funding, programs, or special focus areas"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-8 py-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Submit Contribution
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            * Required fields. All submissions are reviewed before being added to the database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataInput;
