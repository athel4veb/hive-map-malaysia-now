
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userType, prompt } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all startup data from the existing startup table
    const { data: startups, error } = await supabase
      .from('startup')
      .select('*');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!startups || startups.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare context for AI using the startup table structure
    const startupsContext = startups.map(s => 
      `${s.CompanyName || 'Unknown'}: ${s.WhatTheyDo || ''} | Sector: ${s.Sector || ''} | Location: ${s.Location || ''} | Problem: ${s.ProblemTheySolve || ''} | Target: ${s.TargetBeneficiaries || ''} | Impact: ${s.Impact || ''}`
    ).join('\n');

    const systemPrompt = `You are an expert matchmaking AI for the Malaysian startup ecosystem. 
    
    User is a ${userType} and provided this description: "${prompt}"
    
    Available startups in database:
    ${startupsContext}
    
    Analyze the user's description and match them with the most suitable startups. Consider:
    - Sector alignment and synergies
    - Geographic proximity or market overlap
    - Problem-solution fit
    - Target beneficiary alignment
    - Social impact potential
    - Market timing and trends
    
    Return ONLY a JSON array with top 3-5 matches in this exact format:
    [
      {
        "name": "Company Name",
        "matchPercentage": 85,
        "reasons": ["Reason 1", "Reason 2", "Reason 3"]
      }
    ]
    
    Be specific about why each match makes sense. Match percentages should reflect realistic compatibility.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nPlease analyze and provide matches for: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.candidates || !aiData.candidates[0] || !aiData.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const aiResponse = aiData.candidates[0].content.parts[0].text;
    console.log('AI Response:', aiResponse);
    
    // Clean the response to extract JSON
    let cleanResponse = aiResponse.trim();
    if (cleanResponse.includes('```json')) {
      cleanResponse = cleanResponse.split('```json')[1].split('```')[0].trim();
    } else if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.split('```')[1].split('```')[0].trim();
    }
    
    const aiMatches = JSON.parse(cleanResponse);

    // Enrich AI matches with full startup data
    const enrichedMatches = aiMatches.map((aiMatch: any) => {
      const startup = startups.find(s => s.CompanyName === aiMatch.name);
      if (!startup) return null;
      
      return {
        id: startup.No || Math.random().toString(),
        name: startup.CompanyName,
        companyName: startup.CompanyName,
        sector: startup.Sector,
        location: startup.Location,
        yearFounded: startup.YearFounded,
        whatTheyDo: startup.WhatTheyDo,
        problemTheySolve: startup.ProblemTheySolve,
        targetBeneficiaries: startup.TargetBeneficiaries,
        revenueModel: startup.RevenueModel,
        impact: startup.Impact,
        awards: startup.Awards,
        grants: startup.Grants,
        institutionalSupport: startup.InstitutionalSupport,
        magicAccredited: startup.MaGICAccredited,
        website: startup.WebsiteSocialMedia,
        matchPercentage: aiMatch.matchPercentage,
        reasons: aiMatch.reasons,
        isAiMatch: true
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ matches: enrichedMatches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-matchmaker function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
