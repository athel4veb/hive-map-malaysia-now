
import { Globe, Link, FileText, Upload, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface URLManagerProps {
  urlType: "vc" | "startup";
  setUrlType: (type: "vc" | "startup") => void;
  uploadMethod: "url" | "csv";
  setUploadMethod: (method: "url" | "csv") => void;
  urls: string[];
  newUrl: string;
  setNewUrl: (url: string) => void;
  bulkUrls: string;
  setBulkUrls: (urls: string) => void;
  addUrl: () => void;
  removeUrl: (url: string) => void;
  addBulkUrls: () => void;
  handleCsvUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const URLManager = ({
  urlType,
  setUrlType,
  uploadMethod,
  setUploadMethod,
  urls,
  newUrl,
  setNewUrl,
  bulkUrls,
  setBulkUrls,
  addUrl,
  removeUrl,
  addBulkUrls,
  handleCsvUpload
}: URLManagerProps) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Data Source Configuration */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl text-gray-900">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Data Source Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Select Data Type</label>
              <Select value={urlType} onValueChange={(value: "vc" | "startup") => setUrlType(value)}>
                <SelectTrigger className="w-full bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="startup" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Startup Data (startup_urls)
                    </div>
                  </SelectItem>
                  <SelectItem value="vc" className="hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      VC/Grant Data (grant_urls)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                {urlType === "vc" 
                  ? "🏦 URLs will be saved to grant_urls table for VC/Grant program scraping"
                  : "🚀 URLs will be saved to startup_urls table for startup scraping"
                }
              </p>
            </div>

            {/* Upload Method Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Choose Upload Method</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={uploadMethod === "url" ? "default" : "outline"}
                  onClick={() => setUploadMethod("url")}
                  className="flex items-center gap-2 h-12"
                >
                  <Link className="h-4 w-4" />
                  URL Input
                </Button>
                <Button
                  variant={uploadMethod === "csv" ? "default" : "outline"}
                  onClick={() => setUploadMethod("csv")}
                  className="flex items-center gap-2 h-12"
                >
                  <FileText className="h-4 w-4" />
                  CSV Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current URLs Summary */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl text-gray-900">
              <span className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Current Sources
              </span>
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                {urls.length} URLs
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{urls.length}</div>
                  <div className="text-sm text-green-600">Total URLs</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{urlType === "vc" ? "VC/Grant" : "Startup"}</div>
                  <div className="text-sm text-blue-600">Data Type</div>
                </div>
              </div>
              
              {urls.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {urls.slice(0, 3).map((url, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded truncate">
                      {url}
                    </div>
                  ))}
                  {urls.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{urls.length - 3} more URLs...
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URL Input Section */}
      {uploadMethod === "url" && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-900">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              URL Input Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single URL Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Add Single URL</label>
              <div className="flex gap-3">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder={`Enter ${urlType === "vc" ? "VC/Grant" : "startup"} URL (e.g., https://example.com)`}
                  className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                />
                <Button 
                  onClick={addUrl} 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Bulk URL Input */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                Bulk Add URLs (one per line)
              </label>
              <Textarea
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                placeholder="https://site1.com&#10;https://site2.com&#10;https://site3.com"
                rows={5}
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
              />
              <Button 
                onClick={addBulkUrls}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Bulk URLs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Upload Section */}
      {uploadMethod === "csv" && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-gray-900">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              CSV File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">Upload CSV File</h3>
                <p className="text-sm text-gray-500">
                  Select a CSV file containing URLs in the first column
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Choose CSV File
                </label>
              </div>
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>CSV Format:</strong> First column should contain URLs. Header row will be skipped.
                <br />
                Example: URL,Description
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* URL List */}
      {urls.length > 0 && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl text-gray-900">
              <span className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-purple-600" />
                Managed URLs
              </span>
              <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                {urls.length} sources
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 flex-1 mr-2 break-all">{url}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrl(url)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
