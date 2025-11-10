import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { RouteService } from '../../../core/application/services/RouteService';
import { apiClient } from '../../../adapters/outbound/apiClient';
import { ComparisonResult } from '../../../core/application/services/RouteService';

const TARGET_2025 = 89.3368; // gCO₂e/MJ

/**
 * Compare Tab Component
 * Displays baseline vs comparison routes with chart visualization
 */
export const CompareTab: React.FC = () => {
  const routeService = new RouteService(apiClient);

  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeService.getComparison();
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = comparisonData
    ? [
        {
          name: comparisonData.baseline.routeId,
          'GHG Intensity (gCO₂e/MJ)': comparisonData.baseline.ghgIntensity,
          type: 'Baseline',
        },
        ...comparisonData.comparisons.map((comp) => ({
          name: comp.route.routeId,
          'GHG Intensity (gCO₂e/MJ)': comp.route.ghgIntensity,
          type: 'Comparison',
        })),
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800 font-medium">Error loading comparison data</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchComparison}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No comparison data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Baseline Info Card */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-primary-900 mb-2">Baseline Route</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-primary-700 font-medium">Route ID:</span>
            <p className="text-primary-900">{comparisonData.baseline.routeId}</p>
          </div>
          <div>
            <span className="text-primary-700 font-medium">GHG Intensity:</span>
            <p className="text-primary-900">{comparisonData.baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ</p>
          </div>
          <div>
            <span className="text-primary-700 font-medium">Target (2025):</span>
            <p className="text-primary-900">{TARGET_2025} gCO₂e/MJ</p>
          </div>
          <div>
            <span className="text-primary-700 font-medium">Baseline Status:</span>
            <p className="text-primary-900">
              {comparisonData.baseline.ghgIntensity <= TARGET_2025 ? '✅ Compliant' : '❌ Non-compliant'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GHG Intensity Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                label={{ value: 'GHG Intensity (gCO₂e/MJ)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)} gCO₂e/MJ`, 'GHG Intensity']}
              />
              <Legend />
              <ReferenceLine
                y={TARGET_2025}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Target (89.34)', position: 'right' }}
              />
              <Bar
                dataKey="GHG Intensity (gCO₂e/MJ)"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-500 rounded"></div>
            <span>GHG Intensity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-t border-b border-dashed"></div>
            <span>Target (89.34 gCO₂e/MJ)</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comparison Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Baseline GHG
                  <br />
                  <span className="text-xs font-normal">(gCO₂e/MJ)</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comparison GHG
                  <br />
                  <span className="text-xs font-normal">(gCO₂e/MJ)</span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Difference
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliant
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonData.comparisons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No comparison routes available
                  </td>
                </tr>
              ) : (
                comparisonData.comparisons.map((comp) => {
                  const isCompliant = comp.route.ghgIntensity <= TARGET_2025;
                  const percentDiffColor =
                    comp.percentDiff > 0
                      ? 'text-red-600'
                      : comp.percentDiff < 0
                      ? 'text-green-600'
                      : 'text-gray-600';

                  return (
                    <tr key={comp.route.routeId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {comp.route.routeId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {comparisonData.baseline.ghgIntensity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {comp.route.ghgIntensity.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${percentDiffColor}`}>
                        {comp.percentDiff > 0 ? '+' : ''}
                        {comp.percentDiff.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-2xl">{isCompliant ? '✅' : '❌'}</span>
                        <span className="ml-2 text-xs text-gray-600">
                          {isCompliant ? 'Compliant' : 'Non-compliant'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Comparisons</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {comparisonData.comparisons.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Compliant Routes</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {comparisonData.comparisons.filter((c) => c.route.ghgIntensity <= TARGET_2025).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Non-Compliant Routes</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {comparisonData.comparisons.filter((c) => c.route.ghgIntensity > TARGET_2025).length}
          </p>
        </div>
      </div>
    </div>
  );
};

