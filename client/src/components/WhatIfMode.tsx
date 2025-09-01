import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Icon from './Icon';

interface ClimateData {
  global_temp: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
  carbon_emissions: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
  sea_level_rise: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
  forest_loss: {
    current: number;
    forecast: Array<{ year: number; value: number }>;
  };
}

interface HumanImpacts {
  death_toll_annual: number;
  population: number;
  arable_land_loss_percent: number;
  refugees: number;
  gdp_loss_percent: number;
  biodiversity_loss_percent: number;
}

interface Scenario {
  id: number;
  user_input: string;
  theme: string;
  alt_forecasts: {
    global_temp_2100: number;
    death_toll_annual: number;
    refugees: number;
    arable_land_loss_percent: number;
    population: number;
    biodiversity_loss_percent: number;
    gdp_loss_percent: number;
  };
  narrative: string;
  created_at: string;
}

const WhatIfMode: React.FC = () => {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [humanImpacts, setHumanImpacts] = useState<HumanImpacts | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
    fetchScenarios();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching baseline data...');
      const [climateResponse, impactsResponse] = await Promise.all([
        fetch('/api/climate/baseline'),
        fetch('/api/impacts/baseline')
      ]);
      
      if (!climateResponse.ok || !impactsResponse.ok) {
        throw new Error('Failed to fetch baseline data');
      }
      
      const climate = await climateResponse.json();
      const impacts = await impactsResponse.json();
      
      console.log('Climate data:', climate);
      console.log('Human impacts:', impacts);
      
      setClimateData(climate);
      setHumanImpacts(impacts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchScenarios = async () => {
    try {
      console.log('Fetching scenarios...');
      const response = await fetch('/api/scenarios');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Scenarios data:', data);
      
      // Ensure data is always an array
      const scenariosArray = Array.isArray(data) ? data : [];
      setScenarios(scenariosArray);
      
      // Set the first scenario as current if available
      if (scenariosArray.length > 0) {
        console.log('Setting first scenario as current:', scenariosArray[0]);
        setCurrentScenario(scenariosArray[0]);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      // Set empty array on error
      setScenarios([]);
    }
  };

  const generateScenario = async () => {
    if (!userInput.trim() || !climateData || !humanImpacts) return;
    
    setGenerating(true);
    try {
      console.log('Generating scenario for:', userInput);
      console.log('Sending data:', { userInput, baselineData: climateData, humanImpacts });
      
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: userInput,
          baselineData: climateData,
          humanImpacts: humanImpacts
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newScenario = await response.json();
      console.log('Received scenario:', newScenario);
      
      if (newScenario.error) {
        console.error('Server returned error:', newScenario.error);
        return;
      }
      
      setCurrentScenario(newScenario);
      setScenarios(prev => {
        // Ensure prev is always an array
        const prevArray = Array.isArray(prev) ? prev : [];
        return [newScenario, ...prevArray];
      });
      setUserInput('');
    } catch (error) {
      console.error('Error generating scenario:', error);
    } finally {
      setGenerating(false);
    }
  };

  const selectScenario = (scenario: Scenario) => {
    setCurrentScenario(scenario);
  };

  if (!climateData || !humanImpacts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-climate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading climate data...</p>
        </div>
      </div>
    );
  }

  // Generate overlay data for charts
  const generateOverlayData = (scenario: Scenario) => {
    const baselineTemp = climateData.global_temp.forecast;
    const baselineEmissions = climateData.carbon_emissions.forecast;
    
    // Create speculative forecasts based on scenario
    const speculativeTemp = baselineTemp.map(point => ({
      ...point,
      speculative: point.value * (scenario.alt_forecasts.global_temp_2100 / baselineTemp[baselineTemp.length - 1].value)
    }));
    
    const speculativeEmissions = baselineEmissions.map(point => ({
      ...point,
      speculative: point.value * (scenario.alt_forecasts.gdp_loss_percent / 100) // Simplified relationship
    }));

    return { speculativeTemp, speculativeEmissions };
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  // Generate speculative forecast data based on AI scenario
  const generateSpeculativeForecast = (baselineData: any, scenario: any) => {
    if (!scenario || !baselineData) return null;

    const currentYear = new Date().getFullYear();
    const endYear = 2100;
    const years = [];
    for (let year = currentYear; year <= endYear; year += 10) {
      years.push(year);
    }

    // Create speculative temperature forecast with climate reality constraints
    const tempForecast = years.map((year, index) => {
      const baselineTemp = baselineData.global_temp.forecast[index]?.value || baselineData.global_temp.current;
      const progress = (year - currentYear) / (endYear - currentYear);
      const targetTemp = scenario.alt_forecasts.global_temp_2100;
      const currentTemp = baselineData.global_temp.current;
      
      // Apply climate reality constraints:
      // 1. Minimum committed warming of ~1.5°C from current levels
      // 2. Tipping points may accelerate warming
      // 3. Even optimistic scenarios can't completely reverse committed warming
      
      const committedWarming = 1.5; // Minimum warming already locked in
      const minPossibleTemp = currentTemp + committedWarming;
      
      // Ensure speculative temp doesn't go below physically possible minimum
      const constrainedTargetTemp = Math.max(targetTemp, minPossibleTemp);
      
      // Add realistic variability and tipping point effects
      const tippingPointEffect = Math.random() * 0.3; // Small random variation
      const speculativeTemp = currentTemp + (constrainedTargetTemp - currentTemp) * progress + tippingPointEffect;
      
      return {
        year,
        baseline: baselineTemp,
        speculative: speculativeTemp
      };
    });

    // Create speculative emissions forecast with realistic constraints
    const emissionsForecast = years.map((year, index) => {
      const baselineEmissions = baselineData.carbon_emissions.forecast[index]?.value || baselineData.carbon_emissions.current;
      const progress = (year - currentYear) / (endYear - currentYear);
      
      const currentEmissions = baselineData.carbon_emissions.current;
      
      // Use AI's actual emissions target if available, otherwise fall back to realistic constraints
      const aiTargetEmissions = scenario.alt_forecasts.carbon_emissions_2100;
      
      if (aiTargetEmissions !== undefined) {
        // AI provided specific emissions target - use it directly
        const speculativeEmissions = currentEmissions + (aiTargetEmissions - currentEmissions) * progress;
        
        return {
          year,
          baseline: baselineEmissions,
          speculative: speculativeEmissions
        };
      } else {
        // Fallback to realistic constraints if AI didn't provide emissions target
        const minEmissions = currentEmissions * 0.15; // 15% minimum (agriculture, natural processes)
        const targetEmissions = Math.max(scenario.alt_forecasts.global_temp_2100 < 2.0 ? minEmissions : minEmissions * 2, minEmissions);
        
        // Gradual reduction with realistic deployment curve
        const deploymentDelay = Math.max(0, (year - currentYear) / 20); // 20-year deployment lag
        const speculativeEmissions = currentEmissions + (targetEmissions - currentEmissions) * Math.min(progress + deploymentDelay, 1);
        
        return {
          year,
          baseline: baselineEmissions,
          speculative: speculativeEmissions
        };
      }
    });

    // Create speculative sea level forecast with physical constraints
    const seaLevelForecast = years.map((year, index) => {
      const baselineSeaLevel = baselineData.sea_level_rise.forecast[index]?.value || baselineData.sea_level_rise.current;
      const progress = (year - currentYear) / (endYear - currentYear);
      
      const currentSeaLevel = baselineData.sea_level_rise.current;
      
      // Use AI's actual sea level target if available, otherwise fall back to physical constraints
      const aiTargetSeaLevel = scenario.alt_forecasts.sea_level_rise_2100;
      
      if (aiTargetSeaLevel !== undefined) {
        // AI provided specific sea level target - use it directly
        const speculativeRise = currentSeaLevel + (aiTargetSeaLevel - currentSeaLevel) * progress;
        
        return {
          year,
          baseline: baselineSeaLevel,
          speculative: speculativeRise
        };
      } else {
        // Fallback to physical constraints if AI didn't provide sea level target
        const committedRise = 0.3; // 30cm already committed from thermal expansion
        const minPossibleRise = currentSeaLevel + committedRise;
        
        // Ensure speculative rise doesn't go below physically possible minimum
        const constrainedTargetRise = Math.max(scenario.alt_forecasts.global_temp_2100 < 2.0 ? minPossibleRise * 1.2 : minPossibleRise * 1.8, minPossibleRise);
        
        // Add realistic ice sheet dynamics
        const iceSheetEffect = Math.random() * 0.1; // Small random variation
        const speculativeRise = currentSeaLevel + (constrainedTargetRise - currentSeaLevel) * progress + iceSheetEffect;
        
        return {
          year,
          baseline: baselineSeaLevel,
          speculative: speculativeRise
        };
      }
    });

    return {
      temperature: tempForecast,
      emissions: emissionsForecast,
      seaLevel: seaLevelForecast
    };
  };

  // Generate speculative data for charts
  const speculativeData = currentScenario ? generateSpeculativeForecast(climateData, currentScenario) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What If Mode</h1>
        <p className="text-lg text-gray-600">Explore speculative climate futures with AI-powered scenarios</p>
        <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Scenario Input */}
      <div className="card bg-gradient-to-r from-purple-50 to-climate-50 border-purple-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Icon name="zap" className="w-8 h-8 text-purple-600 mr-3" />
          Generate New Scenario
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-2">
              What if...?
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                id="scenario"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., What if we master fusion energy before 2025?"
                className="input-field flex-1"
                onKeyPress={(e) => e.key === 'Enter' && generateScenario()}
              />
              <button
                onClick={generateScenario}
                disabled={generating || !userInput.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <span>Generate</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>💡 Try scenarios like:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>"What if we achieve net-zero emissions by 2030?"</li>
              <li>"What if geoengineering becomes mainstream by 2040?"</li>
              <li>"What if we discover unlimited clean energy by 2025?"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Scenario Display */}
      {currentScenario && (
        <div className="space-y-6">
          {/* Scenario Header */}
          <div className="card bg-gradient-to-r from-climate-50 to-blue-50 border-climate-200">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Current Scenario</h3>
              <div className="text-lg text-climate-700 font-medium mb-2">
                "{currentScenario.user_input}"
              </div>
              <div className="text-sm text-gray-600">
                Generated on {new Date(currentScenario.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">Central Theme</h4>
              <p className="text-gray-700 italic">"{currentScenario.theme}"</p>
            </div>
          </div>

          {/* Key Metrics Comparison */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics Comparison: Baseline vs AI Scenario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                <div className="text-2xl font-bold text-red-600">
                  {currentScenario.alt_forecasts.global_temp_2100.toFixed(1)}°C
                </div>
                <div className="text-sm text-gray-600">Temperature by 2100</div>
                <div className="text-xs text-gray-500">
                  vs {climateData.global_temp.forecast[climateData.global_temp.forecast.length - 1].value.toFixed(1)}°C baseline
                </div>
                <div className="text-xs font-medium mt-1">
                  {currentScenario.alt_forecasts.global_temp_2100 < climateData.global_temp.forecast[climateData.global_temp.forecast.length - 1].value ? 
                    <span className="text-green-600">↓ Improvement</span> : 
                    <span className="text-red-600">↑ Worse</span>
                  }
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(currentScenario.alt_forecasts.death_toll_annual)}
                </div>
                <div className="text-sm text-gray-600">Annual deaths</div>
                <div className="text-xs text-gray-500">
                  vs {formatNumber(humanImpacts.death_toll_annual)} baseline
                </div>
                <div className="text-xs font-medium mt-1">
                  {currentScenario.alt_forecasts.death_toll_annual < humanImpacts.death_toll_annual ? 
                    <span className="text-green-600">↓ Improvement</span> : 
                    <span className="text-red-600">↑ Worse</span>
                  }
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(currentScenario.alt_forecasts.refugees)}
                </div>
                <div className="text-sm text-gray-600">Climate refugees</div>
                <div className="text-xs text-gray-500">
                  vs {formatNumber(humanImpacts.refugees)} baseline
                </div>
                <div className="text-xs font-medium mt-1">
                  {currentScenario.alt_forecasts.refugees < humanImpacts.refugees ? 
                    <span className="text-green-600">↓ Improvement</span> : 
                    <span className="text-red-600">↑ Worse</span>
                  }
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-600">
                  {currentScenario.alt_forecasts.arable_land_loss_percent.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Arable land lost</div>
                <div className="text-xs text-gray-500">
                  vs {humanImpacts.arable_land_loss_percent.toFixed(1)}% baseline
                </div>
                <div className="text-xs font-medium mt-1">
                  {currentScenario.alt_forecasts.arable_land_loss_percent < humanImpacts.arable_land_loss_percent ? 
                    <span className="text-green-600">↓ Improvement</span> : 
                    <span className="text-red-600">↑ Worse</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Climate Reality Disclaimer */}
          <div className="col-span-full">
            <div className="card bg-amber-50 border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center">
                <Icon name="alert-triangle" className="w-5 h-5 text-amber-600 mr-2" />
                Climate Reality Constraints
              </h3>
              <div className="text-sm text-amber-700 space-y-1">
                <p><strong>Important:</strong> These speculative scenarios are constrained by climate physics and tipping points already in motion.</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Committed Warming:</strong> ~1.5°C minimum warming is already locked in from past emissions</li>
                  <li><strong>Tipping Points:</strong> Some systems (Arctic sea ice, permafrost) have passed irreversible thresholds</li>
                  <li><strong>Sea Level Rise:</strong> Thermal expansion and ice sheet dynamics continue for centuries</li>
                  <li><strong>Technology Deployment:</strong> Even breakthrough technologies take decades to scale globally</li>
                </ul>
                <p className="mt-2 text-xs">The AI scenarios show what's theoretically possible, but climate physics sets hard limits on how quickly we can reverse certain changes.</p>
              </div>
            </div>
          </div>

          {/* Overlay Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Temperature Overlay */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Temperature Forecast Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speculativeData?.temperature || climateData.global_temp.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      name="Baseline Forecast"
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speculative" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="AI Scenario Forecast"
                      dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {speculativeData && (
                  <div className="text-center mt-2 text-sm text-gray-600">
                    <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                    <span className="mr-4">Baseline: {climateData.global_temp.forecast[climateData.global_temp.forecast.length - 1].value.toFixed(1)}°C by 2100</span>
                    <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                    <span className="mr-4">AI Scenario: {currentScenario.alt_forecasts.global_temp_2100.toFixed(1)}°C by 2100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Emissions Overlay */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Emissions Forecast Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speculativeData?.emissions || climateData.carbon_emissions.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} Gt`, 'Emissions']} />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#6b7280" 
                      strokeWidth={3}
                      name="Baseline Forecast"
                      dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speculative" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="AI Scenario Forecast"
                      dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {speculativeData && (
                  <div className="text-center mt-2 text-sm text-gray-600">
                    <span className="inline-block w-3 h-3 bg-gray-600 rounded-full mr-2"></span>
                    <span className="mr-4">Baseline: {climateData.carbon_emissions.forecast[climateData.carbon_emissions.forecast.length - 1].value.toFixed(1)} Gt by 2100</span>
                    <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                    <span className="mr-4">AI Scenario: {speculativeData.emissions[speculativeData.emissions.length - 1].speculative.toFixed(1)} Gt by 2100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sea Level Rise Overlay */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sea Level Rise Forecast Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speculativeData?.seaLevel || climateData.sea_level_rise.forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}m`, 'Sea Level']} />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#0891b2" 
                      strokeWidth={3}
                      name="Baseline Forecast"
                      dot={{ fill: '#0891b2', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="speculative" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      name="AI Scenario Forecast"
                      dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {speculativeData && (
                  <div className="text-center mt-2 text-sm text-gray-600">
                    <span className="inline-block w-3 h-3 bg-cyan-600 rounded-full mr-2"></span>
                    <span className="mr-4">Baseline: {climateData.sea_level_rise.forecast[climateData.sea_level_rise.forecast.length - 1].value.toFixed(2)}m by 2100</span>
                    <span className="inline-block w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                    <span className="mr-4">AI Scenario: {speculativeData.seaLevel[speculativeData.seaLevel.length - 1].speculative.toFixed(2)}m by 2100</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Narrative Story */}
          <div className="card bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Icon name="file-text" className="w-6 h-6 text-orange-600 mr-2" />
              Narrative Story
            </h3>
            <div className="bg-white p-6 rounded-lg border border-orange-200">
              <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                {currentScenario.narrative}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Scenarios */}
      {scenarios.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Saved Scenarios</h3>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => selectScenario(scenario)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  currentScenario?.id === scenario.id
                    ? 'border-climate-500 bg-climate-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  "{scenario.user_input}"
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {scenario.theme}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(scenario.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Scenarios Message */}
      {scenarios.length === 0 && !currentScenario && (
        <div className="card text-center py-12">
          <Icon name="zap" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Scenarios Yet</h3>
          <p className="text-gray-500 mb-4">
            Generate your first "What if..." scenario to see how it could change our climate future.
          </p>
          <p className="text-sm text-gray-400">
            Try asking something like "What if we achieve net-zero emissions by 2030?"
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatIfMode;
