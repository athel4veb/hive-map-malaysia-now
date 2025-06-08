
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useUrlManager = () => {
  const { toast } = useToast();
  const [urls, setUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");

  const loadExistingUrls = useCallback(async (type: "vc" | "startup") => {
    try {
      const tableName = type === "vc" ? "grant_urls" : "startup_urls";
      
      const { data, error } = await supabase
        .from(tableName)
        .select('url');
      
      if (error) {
        console.error(`Error loading URLs from ${tableName}:`, error);
        throw error;
      }
      
      if (data) {
        const loadedUrls = data.map(item => item.url);
        setUrls(loadedUrls);
        console.log(`Loaded ${loadedUrls.length} URLs from ${tableName}`);
      }
    } catch (error) {
      console.error("Error in loadExistingUrls:", error);
      toast({
        title: "Error",
        description: "Failed to load existing URLs from database.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addUrl = useCallback(() => {
    const trimmedUrl = newUrl.trim();
    
    if (!trimmedUrl) {
      toast({
        title: "Empty URL",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }
    
    if (!trimmedUrl.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "URL must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }
    
    if (urls.includes(trimmedUrl)) {
      toast({
        title: "Duplicate URL",
        description: "This URL already exists in the list.",
        variant: "destructive",
      });
      return;
    }

    setUrls(prev => [...prev, trimmedUrl]);
    setNewUrl("");
    toast({
      title: "URL Added",
      description: "New URL has been added to the list.",
    });
  }, [newUrl, urls, toast]);

  const removeUrl = useCallback((urlToRemove: string) => {
    setUrls(prev => prev.filter(url => url !== urlToRemove));
    toast({
      title: "URL Removed",
      description: "URL has been removed from the list.",
    });
  }, [toast]);

  const addBulkUrls = useCallback(() => {
    if (!bulkUrls.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter one or more URLs.",
        variant: "destructive",
      });
      return;
    }
    
    const newUrls = bulkUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'))
      .filter(url => !urls.includes(url));
    
    if (newUrls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "No new valid URLs were found in your input.",
        variant: "destructive",
      });
      return;
    }
    
    setUrls(prev => [...prev, ...newUrls]);
    setBulkUrls("");
    toast({
      title: "URLs Added",
      description: `${newUrls.length} new URLs have been added to the list.`,
    });
  }, [bulkUrls, urls, toast]);

  const handleCsvUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      // Extract URLs from CSV (assumes URLs in first column)
      const csvUrls = lines.slice(1) // Skip header row
        .map(line => line.split(',')[0].trim())
        .filter(url => url && url.startsWith('http'))
        .filter(url => !urls.includes(url));

      if (csvUrls.length > 0) {
        setUrls(prev => [...prev, ...csvUrls]);
        toast({
          title: "CSV Processed",
          description: `${csvUrls.length} new URLs extracted from CSV file.`,
        });
      } else {
        toast({
          title: "No new URLs found",
          description: "The CSV file doesn't contain any new valid URLs.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [urls, toast]);

  return {
    urls,
    setUrls,
    newUrl,
    setNewUrl,
    bulkUrls,
    setBulkUrls,
    loadExistingUrls,
    addUrl,
    removeUrl,
    addBulkUrls,
    handleCsvUpload
  };
};
