
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const startScrapingProcess = async (
  urls: string[],
  urlType: "vc" | "startup",
  user: User | null,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
) => {
  try {
    const tableName = urlType === "vc" ? "grant_urls" : "startup_urls";
    
    // Get existing URLs from database to avoid duplicates
    const { data: existingUrls, error: fetchError } = await supabase
      .from(tableName)
      .select('url');

    if (fetchError) {
      throw new Error(`Error fetching existing URLs: ${fetchError.message}`);
    }

    const existingUrlSet = new Set(existingUrls?.map(item => item.url) || []);
    
    // Filter URLs that don't exist in the database yet
    const urlsToInsert = urls.filter(url => !existingUrlSet.has(url));
    
    if (urlsToInsert.length > 0) {
      const urlObjects = urlsToInsert.map(url => ({ url }));
      
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(urlObjects);

      if (insertError) {
        throw new Error(`Error saving URLs to database: ${insertError.message}`);
      }
      
      console.log(`Saved ${urlsToInsert.length} new URLs to ${tableName}`);
    } else {
      console.log("No new URLs to save to database");
    }

    // Trigger appropriate n8n webhook based on URL type
    if (urlType === "startup") {
      try {
        console.log("Triggering n8n webhook for startup scraping...");
        await fetch("https://n8n.vebmy.com/webhook-test/getstartupscrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            urls: urls,
            timestamp: new Date().toISOString(),
            triggered_from: "ASBhive_Admin_Panel",
            user_id: user?.id,
            total_urls: urls.length
          }),
        });

        console.log("Startup webhook request sent to n8n");
        onSuccess(`Initiated startup scraping for ${urls.length} URLs. Webhook triggered successfully.`);
      } catch (webhookError) {
        console.error("Error triggering startup n8n webhook:", webhookError);
        onError("Failed to trigger startup n8n webhook, but URLs were saved to database.");
      }
    } else if (urlType === "vc") {
      try {
        console.log("Triggering n8n webhook for VC scraping...");
        await fetch("https://n8n.vebmy.com/webhook/scrapevc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify({
            urls: urls,
            timestamp: new Date().toISOString(),
            triggered_from: "ASBhive_Admin_Panel",
            user_id: user?.id,
            total_urls: urls.length
          }),
        });

        console.log("VC webhook request sent to n8n");
        onSuccess(`Initiated VC/Grant scraping for ${urls.length} URLs. Webhook triggered successfully.`);
      } catch (webhookError) {
        console.error("Error triggering VC n8n webhook:", webhookError);
        onError("Failed to trigger VC n8n webhook, but URLs were saved to database.");
      }
    }
  } catch (error) {
    console.error("Error in startScrapingProcess:", error);
    throw error;
  }
};

export const exportData = (urls: string[], urlType: "vc" | "startup") => {
  const data = JSON.stringify({
    urls,
    urlType,
    exportedAt: new Date().toISOString()
  }, null, 2);
  
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `asbhive-${urlType}-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
