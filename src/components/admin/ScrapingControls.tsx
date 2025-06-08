
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ScrapingControlsProps {
  urlType: "vc" | "startup";
  urls: string[];
  isScrapingActive: boolean;
  onStartScraping: () => void;
  onExportData: () => void;
}

export const ScrapingControls = ({
  urlType,
  urls,
  isScrapingActive,
  onStartScraping,
  onExportData
}: ScrapingControlsProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">
          {urlType === "vc" ? "VC/Grant" : "Startup"} Data Scraping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={onStartScraping}
            disabled={isScrapingActive || urls.length === 0}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex-1 h-12 text-lg"
          >
            {isScrapingActive ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scraping...
              </>
            ) : (
              `Start ${urlType === "vc" ? "VC/Grant" : "Startup"} Scraping`
            )}
          </Button>
          
          <Button
            onClick={onExportData}
            disabled={urls.length === 0}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50 px-8 h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {isScrapingActive && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 font-medium">
                {urlType === "vc" ? "VC/Grant" : "Startup"} scraping in progress... This may take several minutes.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
