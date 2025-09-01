import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Icon from './Icon';

interface HumanImpacts {
  death_toll_annual: number;
  population: number;
  arable_land_loss_percent: number;
  refugees: number;
  gdp_loss_percent: number;
  biodiversity_loss_percent: number;
  conflict_index: number;
}

const HumanFutures: React.FC = () => {
  const [impacts, setImpacts] = useState<HumanImpacts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpacts();
  }, []);

  const fetchImpacts = async () => {
    try {
      const response = await fetch('/api/impacts/baseline');
      const data = await response.json();
      setImpacts(data);
    } catch (error) {
      console.error('Error fetching impacts data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-climate-600"></div>
      </div>
    );
  }

  if (!impacts) {
    return (
      <div className="text-center py-12">
        <Icon name="alert" className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to load impact data</h2>
        <p className="text-gray-500">Please try refreshing the page</p>
      </div>
    );
  }

  // Population projection data (simplified)
  const populationData = [
    { year: 2024, population: impacts.population / 1e9 },
    { year: 2030, population: 8.5 },
    { year: 2040, population: 8.8 },
    { year: 2050, population: 9.1 },
    { year: 2060, population: 9.3 },
    { year: 2070, population: 9.4 },
    { year: 2080, population: 9.5 },
    { year: 2090, population: 9.6 },
    { year: 2100, population: 9.7 }
  ];

  // Death toll projection
  const deathTollData = [
    { year: 2024, deaths: impacts.death_toll_annual / 1000 },
    { year: 2030, deaths: 650 },
    { year: 2040, deaths: 850 },
    { year: 2050, deaths: 1100 },
    { year: 2060, deaths: 1300 },
    { year: 2070, deaths: 1500 },
    { year: 2080, deaths: 1700 },
    { year: 2090, deaths: 1900 },
    { year: 2100, deaths: 2100 }
  ];

  // Arable land data
  const arableLandData = [
    { name: 'Lost to Desert', value: impacts.arable_land_loss_percent, color: '#f59e0b' },
    { name: 'Remaining Arable', value: 100 - impacts.arable_land_loss_percent, color: '#10b981' }
  ];

  // Biodiversity data
  const biodiversityData = [
    { name: 'Lost', value: impacts.biodiversity_loss_percent, color: '#ef4444' },
    { name: 'Remaining', value: 100 - impacts.biodiversity_loss_percent, color: '#059669' }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const getRiskLevel = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return { level: 'Low', color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= thresholds.medium) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'High', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const metrics = [
    {
      name: 'Annual Climate Deaths',
      value: impacts.death_toll_annual,
      unit: '',
      icon: 'alert',
      description: 'Deaths from climate-related causes',
      risk: getRiskLevel(impacts.death_toll_annual, { low: 300000, medium: 800000, high: 800000 })
    },
    {
      name: 'Climate Refugees',
      value: impacts.refugees,
      unit: '',
      icon: 'users',
      description: 'People displaced by climate events',
      risk: getRiskLevel(impacts.refugees, { low: 15000000, medium: 30000000, high: 30000000 })
    },
    {
      name: 'Arable Land Lost',
      value: impacts.arable_land_loss_percent,
      unit: '%',
      icon: 'tree',
      description: 'Agricultural land lost to desertification',
      risk: getRiskLevel(impacts.arable_land_loss_percent, { low: 10, medium: 20, high: 20 })
    },
    {
      name: 'GDP at Risk',
      value: impacts.gdp_loss_percent,
      unit: '%',
      icon: 'activity',
      description: 'Economic output threatened by climate',
      risk: getRiskLevel(impacts.gdp_loss_percent, { low: 5, medium: 10, high: 10 })
    },
    {
      name: 'Biodiversity Loss',
      value: impacts.biodiversity_loss_percent,
      unit: '%',
      icon: 'tree',
      description: 'Species lost to climate change',
      risk: getRiskLevel(impacts.biodiversity_loss_percent, { low: 20, medium: 40, high: 40 })
    },
    {
      name: 'Conflict Index',
      value: impacts.conflict_index,
      unit: '',
      icon: 'alert',
      description: 'Instability from climate stress (0-1)',
      risk: getRiskLevel(impacts.conflict_index, { low: 0.3, medium: 0.6, high: 0.6 })
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Human Futures</h1>
        <p className="text-lg text-gray-600">Civilization impact metrics and projections</p>
        <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Key Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <Icon name={metric.icon} className="w-8 h-8 text-climate-600" />
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${metric.risk.bg} ${metric.risk.color}`}>
                {metric.risk.level}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{metric.name}</h3>
            <div className={`text-3xl font-bold mb-1 ${metric.risk.color}`}>
              {metric.unit === '%' ? `${metric.value.toFixed(1)}${metric.unit}` : formatNumber(metric.value)}
            </div>
            <p className="text-sm text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Population Projection */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="users" className="w-6 h-6 text-blue-500 mr-2" />
            Global Population Projection
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={populationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}B`, 'Population']} />
                <Line 
                  type="monotone" 
                  dataKey="population" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Death Toll Projection */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="alert" className="w-6 h-6 text-red-500 mr-2" />
            Annual Climate Deaths Projection
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deathTollData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}K`, 'Deaths']} />
                <Bar dataKey="deaths" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Arable Land Distribution */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="tree" className="w-6 h-6 text-green-500 mr-2" />
            Arable Land Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={arableLandData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {arableLandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Land']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biodiversity Status */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="tree" className="w-6 h-6 text-green-500 mr-2" />
            Biodiversity Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={biodiversityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {biodiversityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Biodiversity']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Civilization Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Immediate Threats (2024-2050)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• {formatNumber(impacts.death_toll_annual)} annual climate deaths</li>
              <li>• {formatNumber(impacts.refugees)} climate refugees</li>
              <li>• {impacts.arable_land_loss_percent}% arable land lost</li>
              <li>• {impacts.gdp_loss_percent}% GDP at risk</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Long-term Projections (2050-2100)</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Population may peak around 9.7B by 2100</li>
              <li>• Annual deaths could reach 2.1M by 2100</li>
              <li>• Arable land loss may accelerate</li>
              <li>• Conflict index: {impacts.conflict_index.toFixed(2)} (high risk)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="card bg-gradient-to-r from-yellow-50 to-red-50 border-yellow-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.name} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="font-medium text-gray-700">{metric.name}</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${metric.risk.bg} ${metric.risk.color}`}>
                {metric.risk.level} Risk
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HumanFutures;
