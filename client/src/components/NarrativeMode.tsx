import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface ClimateData {
  global_temp: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
  sea_level_rise: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
}

interface HumanImpacts {
  death_toll_annual: number;
  refugees: number;
  gdp_loss_percent: number;
}

interface NarrativeResponse {
  narrative: string;
}

const NarrativeMode: React.FC = () => {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [humanImpacts, setHumanImpacts] = useState<HumanImpacts | null>(null);
  const [narrative, setNarrative] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [climateResponse, impactsResponse] = await Promise.all([
        fetch('/api/climate/baseline'),
        fetch('/api/impacts/baseline')
      ]);
      
      const climate = await climateResponse.json();
      const impacts = await impactsResponse.json();
      
      setClimateData(climate);
      setHumanImpacts(impacts);
      
      // Auto-generate narrative on load
      generateNarrative(climate, impacts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateNarrative = async (climate: ClimateData, impacts: HumanImpacts) => {
    setGeneratingNarrative(true);
    try {
      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baselineData: climate,
          humanImpacts: impacts
        }),
      });
      
      const data: NarrativeResponse = await response.json();
      setNarrative(data.narrative);
    } catch (error) {
      console.error('Error generating narrative:', error);
      // Fallback narrative
      setNarrative(`Climate Bulletin - ${new Date().toLocaleDateString()}

The Earth's climate system continues to show concerning trends. Global temperatures have risen to ${climate.global_temp.current}°C above pre-industrial levels, with sea levels rising by ${climate.sea_level_rise.current}m since 1900. These changes are already having profound human impacts, with ${impacts.death_toll_annual.toLocaleString()} annual deaths attributed to climate-related causes and ${impacts.refugees.toLocaleString()} people displaced as climate refugees.

The economic toll is equally stark, with ${impacts.gdp_loss_percent}% of global GDP at risk from climate change. Projections suggest these impacts will intensify through 2100, requiring immediate and coordinated global action to mitigate the worst outcomes.`);
    } finally {
      setGeneratingNarrative(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !climateData || !humanImpacts) return;
    
    setLoading(true);
    try {
      // For demo purposes, generate a simple AI response
      // In production, this would call the OpenAI API
      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baselineData: climateData,
          humanImpacts: humanImpacts,
          question: question
        }),
      });
      
      const data: NarrativeResponse = await response.json();
      setAnswer(data.narrative);
    } catch (error) {
      console.error('Error asking question:', error);
      // Fallback response
      setAnswer(`Based on current climate data, here's what I can tell you about "${question}":

The question you've asked is complex and requires careful analysis of multiple climate indicators. Current data shows global temperatures at ${climateData.global_temp.current}°C above pre-industrial levels, with sea levels rising by ${climateData.sea_level_rise.current}m. These changes are contributing to the ${humanImpacts.death_toll_annual.toLocaleString()} annual climate-related deaths and ${humanImpacts.refugees.toLocaleString()} climate refugees we're seeing today.

For a more detailed analysis, I'd recommend consulting the specific data visualizations in the Dashboard and Human Futures tabs, or asking a more specific question about particular climate indicators.`);
    } finally {
      setLoading(false);
    }
  };

  const refreshNarrative = () => {
    if (climateData && humanImpacts) {
      generateNarrative(climateData, humanImpacts);
    }
  };

  if (!climateData || !humanImpacts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-climate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Narrative Mode</h1>
        <p className="text-lg text-gray-600">AI-generated climate insights and interactive Q&A</p>
        <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Climate Bulletin */}
      <div className="card bg-gradient-to-r from-blue-50 to-climate-50 border-climate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="file-text" className="w-8 h-8 text-climate-600 mr-3" />
            Climate Bulletin
          </h2>
          <button
            onClick={refreshNarrative}
            disabled={generatingNarrative}
            className="btn-secondary flex items-center space-x-2"
          >
            <Icon name="refresh" className="w-4 h-4" />
            <span>{generatingNarrative ? 'Generating...' : 'Refresh'}</span>
          </button>
        </div>
        
        {generatingNarrative ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-climate-600 mr-3"></div>
            <span className="text-gray-600">Generating climate bulletin...</span>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {narrative}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Q&A Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Icon name="zap" className="w-8 h-8 text-climate-600 mr-3" />
          Ask About Climate Data
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to know about the climate data?
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., How will sea level rise affect coastal cities by 2050?"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
              />
              <button
                onClick={askQuestion}
                disabled={loading || !question.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <span>Ask</span>
                )}
              </button>
            </div>
          </div>

          {answer && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Response</h3>
              <div className="prose max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {answer}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card text-center">
          <Icon name="thermometer" className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {climateData.global_temp.current}°C
          </div>
          <div className="text-sm text-gray-600">Current temperature rise</div>
        </div>
        
        <div className="metric-card text-center">
          <Icon name="waves" className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {climateData.sea_level_rise.current}m
          </div>
          <div className="text-sm text-gray-600">Sea level rise since 1900</div>
        </div>
        
        <div className="metric-card text-center">
          <Icon name="alert" className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {humanImpacts.death_toll_annual.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Annual climate deaths</div>
        </div>
      </div>

      {/* Sample Questions */}
      <div className="card bg-gradient-to-r from-green-50 to-climate-50 border-green-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Questions to Try</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <button
              onClick={() => setQuestion("What are the main drivers of current temperature increases?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • What are the main drivers of current temperature increases?
            </button>
            <button
              onClick={() => setQuestion("How will biodiversity loss affect human societies?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • How will biodiversity loss affect human societies?
            </button>
            <button
              onClick={() => setQuestion("What's the economic cost of climate inaction?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • What's the economic cost of climate inaction?
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setQuestion("How do climate models predict sea level rise?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • How do climate models predict sea level rise?
            </button>
            <button
              onClick={() => setQuestion("What are the most effective climate solutions?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • What are the most effective climate solutions?
            </button>
            <button
              onClick={() => setQuestion("How will climate change affect food security?")}
              className="text-left text-sm text-climate-700 hover:text-climate-800 hover:underline"
            >
              • How will climate change affect food security?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NarrativeMode;
