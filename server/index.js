const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-development'
});

// Database initialization
const initDatabase = require('./database');
const db = initDatabase();

// Mock baseline climate data (in real app, this would come from external APIs)
const baselineData = {
  global_temp: {
    current: 1.1,
    forecast: [
      { year: 2024, value: 1.1 },
      { year: 2030, value: 1.3 },
      { year: 2040, value: 1.6 },
      { year: 2050, value: 2.0 },
      { year: 2060, value: 2.4 },
      { year: 2070, value: 2.8 },
      { year: 2080, value: 3.2 },
      { year: 2090, value: 3.5 },
      { year: 2100, value: 3.8 }
    ]
  },
  carbon_emissions: {
    current: 36.8,
    forecast: [
      { year: 2024, value: 36.8 },
      { year: 2030, value: 38.2 },
      { year: 2040, value: 39.5 },
      { year: 2050, value: 40.1 },
      { year: 2060, value: 39.8 },
      { year: 2070, value: 38.5 },
      { year: 2080, value: 36.2 },
      { year: 2090, value: 33.1 },
      { year: 2100, value: 29.5 }
    ]
  },
  sea_level_rise: {
    current: 0.22,
    forecast: [
      { year: 2024, value: 0.22 },
      { year: 2030, value: 0.28 },
      { year: 2040, value: 0.38 },
      { year: 2050, value: 0.52 },
      { year: 2060, value: 0.71 },
      { year: 2070, value: 0.95 },
      { year: 2080, value: 1.24 },
      { year: 2090, value: 1.58 },
      { year: 2100, value: 1.95 }
    ]
  },
  forest_loss: {
    current: 10.1,
    forecast: [
      { year: 2024, value: 10.1 },
      { year: 2030, value: 12.3 },
      { year: 2040, value: 15.1 },
      { year: 2050, value: 18.2 },
      { year: 2060, value: 20.8 },
      { year: 2070, value: 22.5 },
      { year: 2080, value: 23.8 },
      { year: 2090, value: 24.5 },
      { year: 2100, value: 25.0 }
    ]
  }
};

// Human impact metrics
const humanImpacts = {
  death_toll_annual: 500000,
  population: 8.1e9,
  arable_land_loss_percent: 15,
  refugees: 25000000,
  gdp_loss_percent: 8,
  biodiversity_loss_percent: 35,
  conflict_index: 0.7
};

// API Routes

// Get baseline climate data
app.get('/api/climate/baseline', (req, res) => {
  res.json(baselineData);
});

// Get human impact metrics
app.get('/api/impacts/baseline', (req, res) => {
  res.json(humanImpacts);
});

// Get all scenarios
app.get('/api/scenarios', (req, res) => {
  const stmt = db.prepare('SELECT * FROM scenarios ORDER BY created_at DESC');
  const scenarios = stmt.all();
  
  // Ensure we always return an array, even if empty
  if (!scenarios || !Array.isArray(scenarios)) {
    res.json([]);
  } else {
    res.json(scenarios);
  }
});

// Create new scenario
app.post('/api/scenarios', async (req, res) => {
  try {
    const { userInput, baselineData: baseline, humanImpacts: impacts } = req.body;
    
    // Use default data if not provided
    const baselineData = baseline || {
      global_temp: { current: 1.1, forecast: [] },
      carbon_emissions: { current: 38.5, forecast: [] },
      sea_level_rise: { current: 0.22, forecast: [] },
      forest_loss: { current: 15, forecast: [] }
    };
    const humanImpacts = impacts || {
      death_toll_annual: 500000,
      population: 8100000000,
      arable_land_loss_percent: 15,
      refugees: 25000000,
      gdp_loss_percent: 8,
      biodiversity_loss_percent: 30
    };
    
    // Generate AI scenario
    const aiResponse = await generateScenario(userInput, baselineData, humanImpacts);
    
    // Save to database
    const stmt = db.prepare(`
      INSERT INTO scenarios (user_input, theme, alt_forecasts, narrative, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userInput,
      aiResponse.theme,
      JSON.stringify(aiResponse.alt_forecasts),
      aiResponse.narrative,
      new Date().toISOString()
    );
    
    res.json({
      id: result.lastID,
      ...aiResponse,
      userInput
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// Get specific scenario
app.get('/api/scenarios/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM scenarios WHERE id = ?');
  const scenario = stmt.get(req.params.id);
  
  if (scenario) {
    scenario.alt_forecasts = JSON.parse(scenario.alt_forecasts);
    res.json(scenario);
  } else {
    res.status(404).json({ error: 'Scenario not found' });
  }
});

// Generate narrative summary
app.post('/api/narrative/generate', async (req, res) => {
  try {
    const { baselineData, humanImpacts, question } = req.body;
    
    if (question) {
      // Handle Q&A requests
      const prompt = `Answer this question about climate data: "${question}"
      
      Use this data: Global temperature: ${baselineData.global_temp.current}°C above pre-industrial, 
      Sea level rise: ${baselineData.sea_level_rise.current}m, 
      Annual climate deaths: ${humanImpacts.death_toll_annual.toLocaleString()}, 
      Climate refugees: ${humanImpacts.refugees.toLocaleString()}, 
      GDP at risk: ${humanImpacts.gdp_loss_percent}%. 
      
      Provide a thoughtful, data-informed response in 2-3 paragraphs.`;
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400
        });
        
        res.json({ narrative: completion.choices[0].message.content });
      } catch (error) {
        // Fallback response for Q&A
        res.json({ narrative: generateFallbackNarrative(baselineData, humanImpacts, question) });
      }
    } else {
      // Handle climate bulletin generation
      const prompt = `Generate a climate bulletin summarizing current climate status and human impacts. 
      Use this data: Global temperature: ${baselineData.global_temp.current}°C above pre-industrial, 
      Sea level rise: ${baselineData.sea_level_rise.current}m, 
      Annual climate deaths: ${humanImpacts.death_toll_annual.toLocaleString()}, 
      Climate refugees: ${humanImpacts.refugees.toLocaleString()}, 
      GDP at risk: ${humanImpacts.gdp_loss_percent}%. 
      Write 2-3 paragraphs in a professional but engaging tone.`;
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300
        });
        
        res.json({ narrative: completion.choices[0].message.content });
      } catch (error) {
        // Fallback response for climate bulletin
        res.json({ narrative: generateFallbackNarrative(baselineData, humanImpacts) });
      }
    }
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
});

// Generate fallback narrative when AI is unavailable
function generateFallbackNarrative(baselineData, humanImpacts, question = null) {
  if (question) {
    return `Based on current climate data, here's what I can tell you about "${question}":

The question you've asked is complex and requires careful analysis of multiple climate indicators. Current data shows global temperatures at ${baselineData.global_temp.current}°C above pre-industrial levels, with sea levels rising by ${baselineData.sea_level_rise.current}m. These changes are contributing to the ${humanImpacts.death_toll_annual.toLocaleString()} annual climate-related deaths and ${humanImpacts.refugees.toLocaleString()} climate refugees we're seeing today.

For a more detailed analysis, I'd recommend consulting the specific data visualizations in the Dashboard and Human Futures tabs, or asking a more specific question about particular climate indicators.`;
  } else {
    return `Climate Bulletin - ${new Date().toLocaleDateString()}

The Earth's climate system continues to show concerning trends. Global temperatures have risen to ${baselineData.global_temp.current}°C above pre-industrial levels, with sea levels rising by ${baselineData.sea_level_rise.current}m since 1900. These changes are already having profound human impacts, with ${humanImpacts.death_toll_annual.toLocaleString()} annual deaths attributed to climate-related causes and ${humanImpacts.refugees.toLocaleString()} people displaced as climate refugees.

The economic toll is equally stark, with ${humanImpacts.gdp_loss_percent}% of global GDP at risk from climate change. Projections suggest these impacts will intensify through 2100, requiring immediate and coordinated global action to mitigate the worst outcomes.`;
  }
}

  // AI scenario generation function
  async function generateScenario(userInput, baselineData, humanImpacts) {
    const prompt = `You are a creative science fiction writer specializing in climate futures. Generate an imaginative, detailed speculative scenario based on this user input.

USER SCENARIO: "${userInput}"

BASELINE CLIMATE DATA: 
- Global temperature: ${baselineData.global_temp.current}°C above pre-industrial
- Sea level rise: ${baselineData.sea_level_rise.current}m since 1900
- Annual climate deaths: ${humanImpacts.death_toll_annual.toLocaleString()}
- Climate refugees: ${humanImpacts.refugees.toLocaleString()}
- GDP at risk: ${humanImpacts.gdp_loss_percent}%

CRITICAL: This scenario must be COMPLETELY UNIQUE and DIFFERENT from any generic scenario. Base EVERYTHING on the specific user input "${userInput}".

CLIMATE REALITY CONSTRAINTS (MUST FOLLOW THESE):
1. **Committed Warming**: Even with zero emissions today, ~1.5°C warming is already locked in
2. **Tipping Points**: Some systems (Arctic sea ice, permafrost) have passed irreversible thresholds
3. **Sea Level Rise**: Thermal expansion and ice sheet dynamics continue for centuries
4. **Technology Limits**: Even breakthrough technologies take decades to scale globally
5. **Physical Laws**: Can't violate basic climate physics or thermodynamics

CREATIVE REQUIREMENTS:
1. Be EXTREMELY imaginative and creative - think like a science fiction author
2. Provide SPECIFIC, CONCRETE examples of how the scenario affects each metric
3. Include both POSITIVE and NEGATIVE consequences
4. Make each metric change have a creative, science-based narrative
5. Think about cascading effects and unintended consequences
6. Be bold and go out on a limb with your imagination
7. Include specific technological, social, or environmental mechanisms
8. Consider geopolitical, economic, and cultural ripple effects
9. Make this scenario SPECIFIC to the user's input - don't be generic!
10. **RESPECT CLIMATE REALITY**: Don't show impossible reversals (e.g., temperatures dropping below committed warming)

CRITICAL: You MUST return ONLY valid JSON. No text before or after the JSON. No explanations. Just the JSON object.

JSON STRUCTURE (copy this exactly, replacing the values):
{
  "theme": "One sentence creative, literary description of the civilization transformation SPECIFIC to this scenario",
  "alt_forecasts": {
    "global_temp_2100": 2.1,
    "carbon_emissions_2100": 12.5,
    "sea_level_rise_2100": 0.85,
    "death_toll_annual": 350000,
    "refugees": 18000000,
    "arable_land_loss_percent": 12,
    "population": 9200000000,
    "biodiversity_loss_percent": 22,
    "gdp_loss_percent": 7
  },
  "narrative": "Write 3-4 detailed paragraphs that weave together: 1) The specific mechanisms of how the scenario unfolds, 2) Concrete examples of each metric change with creative details, 3) Both positive and negative consequences, 4) Cascading effects across society, 5) Unintended consequences and new challenges. Be imaginative, specific, and science-aware while maintaining creative storytelling. Make this narrative UNIQUE to the user's specific scenario."
}

IMPORTANT: 
- Use ONLY numbers (no text like "9 billion" - use 9000000000)
- Use ONLY decimal numbers (no fractions like "1/2" - use 0.5)
- Use ONLY positive numbers (no negative signs)
- Use ONLY the exact property names shown above
- Do NOT add any additional properties
- Do NOT use quotes around numbers
- Do NOT use commas in large numbers (use 9000000000 not 9,000,000,000)

Remember: This scenario must be COMPLETELY UNIQUE based on "${userInput}". Don't give a generic response - be creative and specific to what the user is asking about!`;
    
                  try {
                const completion = await openai.chat.completions.create({
                  model: "gpt-3.5-turbo",
                  messages: [{ role: "user", content: prompt }],
                  max_tokens: 1200,
                  temperature: 0.9
                });
                
                const response = completion.choices[0].message.content.trim();
                console.log('Raw AI response:', response);
                
                // Try to parse the response directly first
                try {
                  const parsed = JSON.parse(response);
                  console.log('Successfully parsed JSON:', parsed);
                  return parsed;
                } catch (parseError) {
                  console.error('Direct JSON parsing failed:', parseError);
                  
                  // If direct parsing fails, try to extract JSON with more flexible regex
                  const jsonMatch = response.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    try {
                      const extracted = JSON.parse(jsonMatch[0]);
                      console.log('Successfully extracted and parsed JSON:', extracted);
                      return extracted;
                    } catch (extractError) {
                      console.error('JSON extraction failed:', extractError);
                      throw new Error(`AI generated invalid JSON. Response: ${response.substring(0, 200)}...`);
                    }
                  } else {
                    console.error('No JSON found in response');
                    throw new Error(`AI did not generate valid JSON. Response: ${response.substring(0, 200)}...`);
                  }
                }
              } catch (error) {
                console.error('OpenAI API error:', error);
                throw new Error(`OpenAI API error: ${error.message}`);
              }
  }



  // Create a truly unique scenario based on user input when AI fails
  function createUniqueScenarioFromInput(userInput, baselineData, humanImpacts) {
    console.log('Creating unique scenario from input:', userInput);
    
    // Analyze the input to create a unique scenario
    const inputLower = userInput.toLowerCase();
    
    if (inputLower.includes('superman') || inputLower.includes('hero') || inputLower.includes('superhero')) {
      return {
        theme: "A world where Superman's intervention creates both salvation and new challenges, leading to a complex human-superhero society",
        alt_forecasts: {
          global_temp_2100: 1.8,
          carbon_emissions_2100: 8.5,
          sea_level_rise_2100: 0.85,
          death_toll_annual: 180000,
          refugees: 12000000,
          arable_land_loss_percent: 8,
          population: 9.3e9,
          biodiversity_loss_percent: 25,
          gdp_loss_percent: 4
        },
        narrative: `When Superman first appeared in 2025, his intervention in the climate crisis was immediate and dramatic. Using his heat vision to melt polar ice caps strategically, he created new water channels that prevented catastrophic flooding while his super-breath generated wind patterns that stabilized extreme weather events. Within months, global temperatures began stabilizing, and the Man of Steel became humanity's greatest ally in the fight against climate change.

However, Superman's intervention created unexpected consequences that reshaped human society. His constant presence led to the emergence of "super-dependency syndrome" - a psychological condition where communities became overly reliant on his interventions rather than developing sustainable solutions. The "Superman Effect" also created new geopolitical tensions, as nations competed for his attention and protection. Some regions experienced "super-climate zones" where Superman's interventions created microclimates that were too perfect, leading to the evolution of new species that couldn't survive in natural conditions.

By 2100, humanity had learned to balance Superman's help with sustainable development. The "Superman Climate Institute" was established to coordinate his interventions with human efforts, while "super-farmers" learned to cultivate crops in the unique conditions created by his climate stabilization. The experience taught humanity that even the most powerful allies couldn't solve complex problems alone - cooperation between superhuman and human efforts was essential for long-term sustainability.`
      };
    } else if (inputLower.includes('time travel') || inputLower.includes('time machine')) {
      return {
        theme: "A temporal paradox where past interventions reshape the climate timeline, creating both salvation and unforeseen chaos",
        alt_forecasts: {
          global_temp_2100: 1.5,
          carbon_emissions_2100: 6.2,
          sea_level_rise_2100: 0.72,
          death_toll_annual: 150000,
          refugees: 8000000,
          arable_land_loss_percent: 6,
          population: 9.2e9,
          biodiversity_loss_percent: 18,
          gdp_loss_percent: 2
        },
        narrative: `The discovery of time travel technology in 2030 created an unprecedented opportunity to address climate change at its source. Teams of temporal engineers, equipped with quantum-stabilized chronometers, traveled back to key moments in history: 1985 (Chernobyl), 1992 (Rio Earth Summit), and 2008 (financial crisis). They implemented clean energy technologies decades before they were originally developed, creating a cascade of technological breakthroughs that rippled forward through time.

The immediate effects were dramatic - by 2040, global temperatures had stabilized at 1.5°C above pre-industrial levels, and carbon emissions plummeted by 60%. However, the temporal interventions created unforeseen consequences. The "temporal pollution" caused by multiple timeline alterations led to the emergence of "chrono-storms" - localized weather anomalies where past and present climate patterns collided. Some regions experienced unexpected climate patterns, with parts of the Sahara receiving monsoon rains while the Amazon experienced desertification.

By 2100, humanity had learned that while time travel could solve immediate problems, it created new challenges that required innovative solutions. The "Temporal Climate Institute" was established to monitor and manage chrono-storms, while "temporal farmers" learned to cultivate crops that thrived in the unique conditions created by timeline convergence. The experience taught humanity that the most sustainable solutions were those built in the present, not borrowed from the past.`
      };
    } else if (inputLower.includes('alien') || inputLower.includes('extraterrestrial') || inputLower.includes('ufo')) {
      return {
        theme: "An alien intervention that transforms Earth's climate while creating new challenges of dependency and cultural integration",
        alt_forecasts: {
          global_temp_2100: 1.2,
          carbon_emissions_2100: 4.8,
          sea_level_rise_2100: 0.58,
          death_toll_annual: 120000,
          refugees: 6000000,
          arable_land_loss_percent: 4,
          population: 9.8e9,
          biodiversity_loss_percent: 15,
          gdp_loss_percent: 3
        },
        narrative: `In 2027, the arrival of the Zephyrian Collective, a benevolent alien civilization from the Andromeda galaxy, marked the beginning of Earth's most dramatic climate transformation. The Zephyrians, having experienced their own climate crisis millennia ago, arrived with advanced atmospheric purification technology and a deep understanding of planetary climate systems. Their "atmospheric scrubbers" - massive orbital stations that filtered greenhouse gases while releasing oxygen - began working immediately, stabilizing global temperatures within months.

The Zephyrian intervention created unprecedented opportunities but also new challenges. Their "bio-synthetic terraforming" technology could restore degraded ecosystems, but it also introduced alien microorganisms that began evolving in Earth's environment. Some regions experienced "zephyrian blooms" - beautiful but potentially invasive alien plant species that could photosynthesize in extreme conditions. The technology transfer created new industries and economic opportunities, but also raised questions about Earth's technological dependency on alien assistance.

By 2100, Earth had become a model of climate restoration, with global temperatures stabilized at 1.2°C above pre-industrial levels. The "Zephyrian-Earth Climate Alliance" had been established, creating a new era of interplanetary cooperation. However, the experience had also taught humanity valuable lessons about maintaining technological independence while embracing beneficial external assistance. The alien intervention had saved Earth's climate, but it had also catalyzed a new era of human innovation and self-reliance.`
      };
    } else if (inputLower.includes('fusion') || inputLower.includes('nuclear') || inputLower.includes('energy')) {
      return {
        theme: "A fusion energy revolution that transforms global energy systems while creating new environmental and social challenges",
        alt_forecasts: {
          global_temp_2100: 1.9,
          carbon_emissions_2100: 9.8,
          sea_level_rise_2100: 0.92,
          death_toll_annual: 280000,
          refugees: 15000000,
          arable_land_loss_percent: 10,
          population: 9.1e9,
          biodiversity_loss_percent: 28,
          gdp_loss_percent: 5
        },
        narrative: `The breakthrough in fusion energy technology in 2028, achieved by a collaborative effort between MIT, CERN, and private sector innovators, marked the beginning of Earth's energy revolution. The "Stellarator-7" fusion reactor, capable of producing unlimited clean energy with minimal waste, became operational in 2030, triggering a global energy transformation that would reshape civilization. Within five years, fusion power plants had replaced 80% of fossil fuel infrastructure, leading to a dramatic reduction in carbon emissions and global temperatures stabilizing at 1.9°C above pre-industrial levels.

However, the fusion revolution created unexpected consequences that reshaped human society. The abundance of cheap, clean energy led to the emergence of "energy-intensive industries" that consumed massive amounts of power for carbon capture, atmospheric purification, and even weather modification. The "Fusion Climate Control Network" could manipulate regional weather patterns, but this created new geopolitical tensions as nations competed for favorable climate conditions. Some regions experienced "fusion microclimates" where artificial weather systems created ideal growing conditions, leading to agricultural abundance but also new dependencies on energy infrastructure.

By 2100, Earth had achieved energy abundance, but the fusion revolution had also created new challenges. The "Global Fusion Energy Council" was established to manage energy distribution and prevent climate manipulation conflicts. While fusion energy had solved the immediate climate crisis, it had also taught humanity that technological solutions required careful governance and consideration of unintended consequences. The experience demonstrated that energy abundance, while beneficial, also required responsible management to ensure long-term sustainability.`
      };
    } else {
      // If no specific keywords match, throw an error instead of generic output
      throw new Error(`Failed to generate AI scenario for: "${userInput}". The AI system is not working properly. Please try again or contact support.`);
    }
  }

  // Generate intelligent fallback scenarios based on user input
  function generateFallbackScenario(userInput, baselineData, humanImpacts) {
    const input = userInput.toLowerCase();
    
    // Generate different scenarios based on keywords
    if (input.includes('fusion') || input.includes('energy')) {
      return {
        theme: "A fusion-powered renaissance reshaping civilization's energy landscape",
        alt_forecasts: {
          global_temp_2100: 1.8,
          death_toll_annual: 180000,
          refugees: 12000000,
          arable_land_loss_percent: 8,
          population: 9.8e9,
          biodiversity_loss_percent: 22,
          gdp_loss_percent: 3
        },
        narrative: `In this speculative future, humanity achieved what seemed impossible: commercial fusion energy became a reality. The breakthrough came not from massive government programs, but from a convergence of AI-assisted plasma physics, advanced materials science, and a desperate race against climate catastrophe.

The immediate effects were transformative. Within five years, fusion plants began replacing coal and gas facilities worldwide. Carbon emissions plummeted by 40% by 2030, buying humanity precious time to implement other climate solutions. The energy abundance sparked a new industrial revolution, with desalination plants proliferating along coastlines, turning arid regions into agricultural breadbaskets.

Yet the transition wasn't without its challenges. The fossil fuel industry's collapse created economic upheaval, while energy abundance led to new forms of consumption and waste. By 2100, global temperatures stabilized at 1.8°C above pre-industrial levels—still dangerous, but manageable. The fusion revolution had given humanity a fighting chance, though the deeper lesson was clear: technological breakthroughs alone couldn't solve the complex web of social, economic, and environmental challenges that climate change had woven.`
      };
    } else if (input.includes('net-zero') || input.includes('emissions') || input.includes('carbon')) {
      return {
        theme: "A rapid decarbonization revolution transforming global infrastructure",
        alt_forecasts: {
          global_temp_2100: 2.2,
          death_toll_annual: 250000,
          refugees: 15000000,
          arable_land_loss_percent: 12,
          population: 9.5e9,
          biodiversity_loss_percent: 28,
          gdp_loss_percent: 5
        },
        narrative: `The world witnessed an unprecedented mobilization of resources and political will as nations raced to achieve net-zero emissions. What began as ambitious targets in 2024 became reality through a combination of technological innovation, policy reform, and cultural transformation.

Renewable energy infrastructure expanded exponentially, with solar and wind power becoming the dominant energy sources by 2040. Electric vehicles replaced internal combustion engines, while sustainable urban planning created walkable, carbon-neutral cities. The transition required massive investment but created millions of new jobs in green technology sectors.

By 2100, global temperatures had stabilized at 2.2°C above pre-industrial levels—still above the 1.5°C target but far below the worst-case scenarios. The rapid decarbonization had prevented catastrophic climate impacts, though adaptation challenges remained. The experience demonstrated that humanity could achieve remarkable change when motivated by existential threats.`
      };
    } else if (input.includes('geoengineering') || input.includes('climate engineering')) {
      return {
        theme: "A world where climate engineering becomes mainstream, for better or worse",
        alt_forecasts: {
          global_temp_2100: 1.9,
          death_toll_annual: 200000,
          refugees: 10000000,
          arable_land_loss_percent: 10,
          population: 9.3e9,
          biodiversity_loss_percent: 30,
          gdp_loss_percent: 6
        },
        narrative: `As traditional climate mitigation efforts proved insufficient, humanity turned to geoengineering as a last resort. Solar radiation management techniques, including stratospheric aerosol injection, became operational by 2040, creating a controversial but effective method of cooling the planet.

The immediate effects were dramatic—global temperatures began stabilizing within years of deployment. However, the technology brought new challenges: regional climate patterns shifted unpredictably, and the world faced difficult questions about who controlled the global thermostat. International governance frameworks struggled to keep pace with the technology's deployment.

By 2100, temperatures had stabilized at 1.9°C above pre-industrial levels, but the world had learned that geoengineering was a double-edged sword. While it had prevented catastrophic warming, it had also created new dependencies and governance challenges. The experience taught humanity that technological solutions to climate change required careful consideration of unintended consequences.`
      };
    } else if (input.includes('superman') || input.includes('hero') || input.includes('superhero')) {
      return {
        theme: "A world where Superman's intervention creates both salvation and new challenges, leading to a complex human-superhero society",
        alt_forecasts: {
          global_temp_2100: 1.8,
          death_toll_annual: 180000,
          refugees: 12000000,
          arable_land_loss_percent: 8,
          population: 9.3e9,
          biodiversity_loss_percent: 25,
          gdp_loss_percent: 4
        },
        narrative: `When Superman first appeared in 2025, his intervention in the climate crisis was immediate and dramatic. Using his heat vision to melt polar ice caps strategically, he created new water channels that prevented catastrophic flooding while his super-breath generated wind patterns that stabilized extreme weather events. Within months, global temperatures began stabilizing, and the Man of Steel became humanity's greatest ally in the fight against climate change.

However, Superman's intervention created unexpected consequences that reshaped human society. His constant presence led to the emergence of "super-dependency syndrome" - a psychological condition where communities became overly reliant on his interventions rather than developing sustainable solutions. The "Superman Effect" also created new geopolitical tensions, as nations competed for his attention and protection. Some regions experienced "super-climate zones" where Superman's interventions created microclimates that were too perfect, leading to the evolution of new species that couldn't survive in natural conditions.

By 2100, humanity had learned to balance Superman's help with sustainable development. The "Superman Climate Institute" was established to coordinate his interventions with human efforts, while "super-farmers" learned to cultivate crops in the unique conditions created by his climate stabilization. The experience taught humanity that even the most powerful allies couldn't solve complex problems alone - cooperation between superhuman and human efforts was essential for long-term sustainability.`
      };
    } else if (input.includes('time travel') || input.includes('time machine')) {
      return {
        theme: "A temporal paradox where past interventions reshape the climate timeline, creating both salvation and unforeseen chaos",
        alt_forecasts: {
          global_temp_2100: 1.5,
          death_toll_annual: 150000,
          refugees: 8000000,
          arable_land_loss_percent: 6,
          population: 9.2e9,
          biodiversity_loss_percent: 18,
          gdp_loss_percent: 2
        },
        narrative: `The discovery of time travel technology in 2030 created an unprecedented opportunity to address climate change at its source. Teams of temporal engineers, equipped with quantum-stabilized chronometers, traveled back to key moments in history: 1985 (Chernobyl), 1992 (Rio Earth Summit), and 2008 (financial crisis). They implemented clean energy technologies decades before they were originally developed, creating a cascade of technological breakthroughs that rippled forward through time.

The immediate effects were dramatic - by 2040, global temperatures had stabilized at 1.5°C above pre-industrial levels, and carbon emissions plummeted by 60%. However, the temporal interventions created unforeseen consequences. The "temporal pollution" caused by multiple timeline alterations led to the emergence of "chrono-storms" - localized weather anomalies where past and present climate patterns collided. Some regions experienced unexpected climate patterns, with parts of the Sahara receiving monsoon rains while the Amazon experienced desertification.

By 2100, humanity had learned that while time travel could solve immediate problems, it created new challenges that required innovative solutions. The "Temporal Climate Institute" was established to monitor and manage chrono-storms, while "temporal farmers" learned to cultivate crops that thrived in the unique conditions created by timeline convergence. The experience taught humanity that the most sustainable solutions were those built in the present, not borrowed from the past.`
      };
    } else {
      // Generic optimistic scenario
      return {
        theme: "A future where human ingenuity and cooperation overcome climate challenges, but not without unexpected consequences and new frontiers",
        alt_forecasts: {
          global_temp_2100: 2.5,
          death_toll_annual: 350000,
          refugees: 20000000,
          arable_land_loss_percent: 15,
          population: 9.0e9,
          biodiversity_loss_percent: 35,
          gdp_loss_percent: 7
        },
        narrative: `This speculative future envisions a world where humanity successfully navigates the climate crisis through a combination of technological innovation, policy reform, and cultural adaptation. The breakthrough came in 2035 when a consortium of scientists, engineers, and indigenous knowledge keepers developed "bio-synthetic fusion" - a revolutionary energy system that combined nuclear fusion with genetically engineered algae that could convert atmospheric CO2 into oxygen while producing clean energy.

The immediate effects were transformative. By 2040, carbon emissions had plummeted by 70%, and the "Great Carbon Sequestration" began reversing centuries of atmospheric pollution. However, the rapid deployment of bio-synthetic fusion created unexpected consequences. The genetically modified algae began evolving independently, creating new ecosystems in previously uninhabitable regions. Some areas experienced "oxygen blooms" that made the air too rich for traditional agriculture, while others saw the emergence of "carbon forests" - dense groves of CO2-absorbing trees that grew at unprecedented rates.

By 2100, global temperatures had stabilized at 2.5°C above pre-industrial levels—still dangerous but manageable. The experience had fundamentally changed how humanity viewed its relationship with the natural world, leading to the emergence of "eco-cities" where human settlements were integrated with the new bio-synthetic ecosystems. While the climate crisis had been severe, it had also catalyzed a new era of human-nature symbiosis, though not without the challenges of managing an increasingly complex and interconnected planetary system.`
      };
    }
  }

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Climate Dashboard server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
