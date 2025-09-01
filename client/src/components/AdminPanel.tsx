import React, { useState, useRef } from 'react';
import Icon from './Icon';

interface Dataset {
  id: string;
  name: string;
  source: string;
  lastUpdated: string;
  status: 'active' | 'processing' | 'error';
  type: 'csv' | 'pdf' | 'api';
}

const AdminPanel: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: '1',
      name: 'NASA GISTEMP Climate Data',
      source: 'NASA Goddard Institute',
      lastUpdated: '2024-01-15',
      status: 'active',
      type: 'csv'
    },
    {
      id: '2',
      name: 'IPCC AR6 Projections',
      source: 'Intergovernmental Panel on Climate Change',
      lastUpdated: '2024-01-10',
      status: 'active',
      type: 'pdf'
    },
    {
      id: '3',
      name: 'NOAA Sea Level Data',
      source: 'National Oceanic and Atmospheric Administration',
      lastUpdated: '2024-01-12',
      status: 'active',
      type: 'api'
    }
  ]);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    // Simulate file upload and AI processing
    setTimeout(() => {
      const newDatasets = selectedFiles.map((file, index) => ({
        id: Date.now().toString() + index,
        name: file.name,
        source: 'User Upload',
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        type: file.name.endsWith('.csv') ? 'csv' : file.name.endsWith('.pdf') ? 'pdf' : 'api'
      }));
      
      setDatasets(prev => [...newDatasets, ...prev]);
      setSelectedFiles([]);
      setUploading(false);
    }, 2000);
  };

  const refreshDataset = async (id: string) => {
    // Simulate refresh
    setDatasets(prev => prev.map(ds => 
      ds.id === id 
        ? { ...ds, lastUpdated: new Date().toISOString().split('T')[0] }
        : ds
    ));
  };

  const deleteDataset = (id: string) => {
    setDatasets(prev => prev.filter(ds => ds.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv': return 'file-text';
      case 'pdf': return 'file-text';
      case 'api': return 'activity';
      default: return 'file-text';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-lg text-gray-600">Manage climate datasets and data sources</p>
        <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleString()}</p>
      </div>

      {/* File Upload Section */}
      <div className="card bg-gradient-to-r from-green-50 to-climate-50 border-green-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Icon name="upload" className="w-8 h-8 text-green-600 mr-3" />
          Upload New Datasets
        </h2>
        
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-climate-500 bg-climate-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Icon name="upload" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports CSV, PDF, and API endpoints. AI agent will parse and structure the data.
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              Choose Files
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".csv,.pdf,.json,.xml"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Selected Files:</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Icon name="file-text" className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Icon name="x" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span>Upload & Process</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon name="settings" className="w-8 h-8 text-climate-600 mr-3" />
            Dataset Management
          </h2>
          <div className="text-sm text-gray-500">
            {datasets.length} datasets active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dataset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datasets.map((dataset) => (
                <tr key={dataset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon name={getTypeIcon(dataset.type)} className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dataset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dataset.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {dataset.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dataset.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
                      {dataset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => refreshDataset(dataset.id)}
                        className="text-climate-600 hover:text-climate-900"
                        title="Refresh dataset"
                      >
                        <Icon name="refresh" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDataset(dataset.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete dataset"
                      >
                        <Icon name="x" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Agent Status */}
      <div className="card bg-gradient-to-r from-blue-50 to-climate-50 border-blue-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="activity" className="w-6 h-6 text-blue-600 mr-2" />
          AI Agent Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">Active</div>
            <div className="text-sm text-gray-600">AI Agent Status</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-gray-600">Datasets Processed</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-climate-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
          <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Icon name="check" className="w-4 h-4 text-green-500" />
              <span>NASA GISTEMP data parsed and structured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="check" className="w-4 h-4 text-green-500" />
              <span>IPCC AR6 projections integrated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="check" className="w-4 h-4 text-green-500" />
              <span>NOAA sea level data synchronized</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Backend Services</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>API Server:</span>
                <span className="text-green-600">Running</span>
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <span className="text-green-600">Connected</span>
              </div>
              <div className="flex justify-between">
                <span>AI Service:</span>
                <span className="text-green-600">Available</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Climate APIs:</span>
                <span className="text-green-600">3 Active</span>
              </div>
              <div className="flex justify-between">
                <span>File Uploads:</span>
                <span className="text-green-600">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-refresh:</span>
                <span className="text-green-600">Every 24h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
