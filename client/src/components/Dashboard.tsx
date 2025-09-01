import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
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

const Dashboard: React.FC = () => {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClimateData();
  }, []);

  const fetchClimateData = async () => {
    try {
      const response = await fetch('/api/climate/baseline');
      const data = await response.json();
      setClimateData(data);
    } catch (error) {
      console.error('Error fetching climate data:', error);
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

  if (!climateData) {
    return (
      <div className="text-center py-12">
        <Icon name="alert" className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Failed to load climate data</h2>
        <p className="text-gray-500">Please try refreshing the page</p>
      </div>
    );
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '°C') return `${value.toFixed(1)}${unit}`;
    if (unit === 'm') return `${value.toFixed(2)}${unit}`;
    if (unit === 'Gt') return `${value.toFixed(1)}${unit}`;
    if (unit === '%') return `${value.toFixed(1)}${unit}`;
    return value.toString();
  };

  const getStatusColor = (metric: string, value: number) => {
    switch (metric) {
      case 'global_temp':
        if (value <= 1.5) return 'text-green-600';
        if (value <= 2.0) return 'text-yellow-600';
        return 'text-red-600';
      case 'sea_level_rise':
        if (value <= 0.5) return 'text-green-600';
        if (value <= 1.0) return 'text-yellow-600';
        return 'text-red-600';
      case 'carbon_emissions':
        if (value <= 30) return 'text-green-600';
        if (value <= 40) return 'text-yellow-600';
        return 'text-red-600';
      case 'forest_loss':
        if (value <= 15) return 'text-green-600';
        if (value <= 25) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (metric: string, value: number) => {
    switch (metric) {
      case 'global_temp':
        if (value <= 1.5) return 'check';
        if (value <= 2.0) return 'alert';
        return 'x';
      case 'sea_level_rise':
        if (value <= 0.5) return 'check';
        if (value <= 1.0) return 'alert';
        return 'x';
      case 'carbon_emissions':
        if (value <= 30) return 'check';
        if (value <= 40) return 'alert';
        return 'x';
      case 'forest_loss':
        if (value <= 15) return 'check';
        if (value <= 25) return 'alert';
        return 'x';
      default:
        return 'activity';
    }
  };

  const metrics = [
    {
      name: 'Global Temperature',
      current: climateData.global_temp.current,
      unit: '°C',
      icon: 'thermometer',
      description: 'Above pre-industrial levels',
      forecast: climateData.global_temp.forecast,
      metric: 'global_temp'
    },
    {
      name: 'Carbon Emissions',
      current: climateData.carbon_emissions.current,
      unit: 'Gt',
      icon: 'cloud',
      description: 'Annual CO2 emissions',
      forecast: climateData.carbon_emissions.forecast,
      metric: 'carbon_emissions'
    },
    {
      name: 'Sea Level Rise',
      current: climateData.sea_level_rise.current,
      unit: 'm',
      icon: 'waves',
      description: 'Since 1900',
      forecast: climateData.sea_level_rise.forecast,
      metric: 'sea_level_rise'
    },
    {
      name: 'Forest Loss',
      current: climateData.forest_loss.current,
      unit: '%',
      icon: 'tree',
      description: 'Global forest cover lost',
      forecast: climateData.forest_loss.forecast,
      metric: 'forest_loss'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earth Systems Dashboard</h1>
        <p className="text-lg text-gray-600">Real-time climate indicators and forecasts to 2100</p>
        <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <Icon name={metric.icon} className="w-8 h-8 text-climate-600" />
              <Icon 
                name={getStatusIcon(metric.metric, metric.current)} 
                className={`w-5 h-5 ${getStatusColor(metric.metric, metric.current)}`} 
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{metric.name}</h3>
            <div className={`text-3xl font-bold mb-1 ${getStatusColor(metric.metric, metric.current)}`}>
              {formatValue(metric.current, metric.unit)}
            </div>
            <p className="text-sm text-gray-500 mb-4">{metric.description}</p>
            
            {/* Mini Sparkline Chart */}
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metric.forecast}>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={getStatusColor(metric.metric, metric.current).replace('text-', '')} 
                    fill={getStatusColor(metric.metric, metric.current).replace('text-', '')}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Temperature Forecast */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="thermometer" className="w-6 h-6 text-red-500 mr-2" />
            Global Temperature Forecast
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateData.global_temp.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carbon Emissions Forecast */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="cloud" className="w-6 h-6 text-gray-500 mr-2" />
            Carbon Emissions Forecast
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateData.carbon_emissions.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} Gt`, 'Emissions']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6b7280" 
                  strokeWidth={3}
                  dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sea Level Rise Forecast */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="waves" className="w-6 h-6 text-blue-500 mr-2" />
            Sea Level Rise Forecast
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateData.sea_level_rise.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}m`, 'Sea Level']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forest Loss Forecast */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="tree" className="w-6 h-6 text-green-500 mr-2" />
            Forest Loss Forecast
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateData.forest_loss.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Forest Loss']} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card bg-gradient-to-r from-climate-50 to-blue-50 border-climate-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-climate-700">
              {climateData.global_temp.forecast[climateData.global_temp.forecast.length - 1].value.toFixed(1)}°C
            </div>
            <div className="text-sm text-gray-600">Projected temperature by 2100</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-climate-700">
              {climateData.sea_level_rise.forecast[climateData.sea_level_rise.forecast.length - 1].value.toFixed(2)}m
            </div>
            <div className="text-sm text-gray-600">Projected sea level rise by 2100</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-climate-700">
              {climateData.carbon_emissions.forecast[climateData.carbon_emissions.forecast.length - 1].value.toFixed(1)} Gt
            </div>
            <div className="text-sm text-gray-600">Projected emissions by 2100</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
