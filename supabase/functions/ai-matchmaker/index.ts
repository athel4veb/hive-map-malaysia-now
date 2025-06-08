
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    
    // Get all profiles of the opposite type
    const targetType = userType === 'vc' ? 'startup' : 'vc';
    const { data: profiles, error } = await supabase
      .from('matchmaking_profiles')
      .select('*')
      .eq('user_type', targetType);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Prepare context for AI
    const profilesContext = profiles.map(p => 
      `${p.name}: ${p.description} | Sectors: ${p.sectors.join(', ')} | Regions: ${p.regions.join(', ')} | Stages: ${p.stages.join(', ')}`
    ).join('\n');

    const systemPrompt = `You are an expert matchmaking AI for the Malaysian startup ecosystem. 
    
    User is a ${userType} and provided this description: "${prompt}"
    
    Available ${targetType}s in database:
    ${profilesContext}
    
    Analyze the user's description and match them with the most suitable ${targetType}s. Consider:
    - Sector alignment and synergies
    - Geographic proximity or market overlap
    - Investment stage compatibility
    - Complementary strengths and needs
    - Market timing and trends
    
    Return ONLY a JSON array with top 3-5 matches in this exact format:
    [
      {
        "name": "Profile Name",
        "matchPercentage": 85,
        "reasons": ["Reason 1", "Reason 2", "Reason 3"]
      }
    ]
    
    Be specific about why each match makes sense. Match percentages should reflect realistic compatibility.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze and provide matches for: ${prompt}` }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    const aiMatches = JSON.parse(aiData.choices[0].message.content);

    // Enrich AI matches with full profile data
    const enrichedMatches = aiMatches.map((aiMatch: any) => {
      const profile = profiles.find(p => p.name === aiMatch.name);
      return {
        ...profile,
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
