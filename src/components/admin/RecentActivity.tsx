
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentActivityProps {
  totalOrganizations: number;
}

export const RecentActivity = ({ totalOrganizations }: RecentActivityProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Last scraping session</span>
            <Badge variant="secondary">2 hours ago</Badge>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Organizations scraped</span>
            <Badge className="bg-green-100 text-green-800">12 new entries</Badge>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Manual contributions</span>
            <Badge className="bg-blue-100 text-blue-800">3 pending review</Badge>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-gray-600">Total database entries</span>
            <Badge variant="outline">{totalOrganizations} organizations</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
