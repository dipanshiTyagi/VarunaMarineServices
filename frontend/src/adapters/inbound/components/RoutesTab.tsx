import React, { useState, useEffect, useMemo } from 'react';
import { RouteService } from '../../../core/application/services/RouteService';
import { apiClient } from '../../../adapters/outbound/apiClient';
import { RouteFilters } from '../../../core/application/services/RouteService';
import { Route } from '../../../core/domain/Route';

/**
 * Routes Tab Component
 * Displays routes table with filters and baseline functionality
 */
export const RoutesTab: React.FC = () => {
  const routeService = new RouteService(apiClient);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RouteFilters>({});
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null);

  // Get unique values for filters
  // const vesselTypes = Array.from(new Set(routes.map((r) => r.vesselType))).sort();
  // const fuelTypes = Array.from(new Set(routes.map((r) => r.fuelType))).sort();

  const vesselTypes = useMemo(() => {
    if (!routes) return [];
    return Array.from(new Set(routes.map((r) => r.vesselType))).sort();
  }, [routes]);

  const fuelTypes = useMemo(() => {
    if (!routes) return [];
    return Array.from(new Set(routes.map((r) => r.fuelType))).sort();
  }, [routes]);

  // const _years = Array.from(new Set(routes.map((r) => r.year))).sort((a, b) => b - a);

  useEffect(() => {
    fetchRoutes();
  }, [filters]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeService.getRoutes(filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBaseline = async (routeId: string) => {
    try {
      setSettingBaseline(routeId);
      await routeService.setBaseline(routeId);
      // Refresh routes to update baseline status
      await fetchRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set baseline');
    } finally {
      setSettingBaseline(null);
    }
  };

  const handleFilterChange = (key: keyof RouteFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (loading && (!routes || routes.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  if (error && (!routes || routes.length === 0)) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800 font-medium">Error loading routes</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchRoutes}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vessel Type Filter */}
          <div>
            <label htmlFor="vesselType" className="block text-sm font-medium text-gray-700 mb-1">
              Vessel Type
            </label>
            <select
              id="vesselType"
              value={filters.vesselType || ''}
              onChange={(e) => handleFilterChange('vesselType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              {vesselTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div>
            <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Type
            </label>
            <select
              id="fuelType"
              value={filters.fuelType || ''}
              onChange={(e) => handleFilterChange('fuelType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Fuels</option>
              {fuelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              id="year"
              value={filters.year || ''}
              onChange={(e) =>
                handleFilterChange('year', e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              placeholder="All Years"
              min="2020"
              max="2030"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && routes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* Routes Table */}
      {/* <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vessel Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fuel Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GHG Intensity
                <br />
                <span className="text-xs font-normal">(gCO₂e/MJ)</span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fuel Consumption
                <br />
                <span className="text-xs font-normal">(t)</span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance
                <br />
                <span className="text-xs font-normal">(km)</span>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Emissions
                <br />
                <span className="text-xs font-normal">(t)</span>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No routes found
                </td>
              </tr>
            ) : (
              routes.map((route) => (
                <tr
                  key={route.routeId}
                  className={route.isBaseline ? 'bg-primary-50' : 'hover:bg-gray-50'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{route.routeId}</span>
                      {route.isBaseline && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded">
                          Baseline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.vesselType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.fuelType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.ghgIntensity.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.fuelConsumption.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.distance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {route.totalEmissions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleSetBaseline(route.routeId)}
                      disabled={route.isBaseline || settingBaseline === route.routeId}
                      className={`
                        px-3 py-1 text-xs font-medium rounded-md transition-colors
                        ${
                          route.isBaseline
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : settingBaseline === route.routeId
                            ? 'bg-primary-300 text-white cursor-wait'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }
                      `}
                    >
                      {settingBaseline === route.routeId ? 'Setting...' : 'Set Baseline'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div> */}

      {/* Results Count */}
      {/* <div className="text-sm text-gray-600">
        Showing {routes.length} route{routes.length !== 1 ? 's' : ''}
      </div> */}

      {/* Routes Table */}
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Route ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vessel Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fuel Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Year
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              GHG Intensity
              <br />
              <span className="text-xs font-normal">(gCO₂e/MJ)</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fuel Consumption
              <br />
              <span className="text-xs font-normal">(t)</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance
              <br />
              <span className="text-xs font-normal">(km)</span>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Emissions
              <br />
              <span className="text-xs font-normal">(t)</span>
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(!routes || routes.length === 0) ? (
            <tr>
              <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                No routes found
              </td>
            </tr>
          ) : (
            routes.map((route) => (
              <tr
                key={route.routeId}
                className={route.isBaseline ? 'bg-primary-50' : 'hover:bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{route.routeId}</span>
                    {route.isBaseline && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-800 rounded">
                        Baseline
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.vesselType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.fuelType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.ghgIntensity.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.fuelConsumption.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.distance.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {route.totalEmissions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handleSetBaseline(route.routeId)}
                    disabled={route.isBaseline || settingBaseline === route.routeId}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-md transition-colors
                      ${
                        route.isBaseline
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : settingBaseline === route.routeId
                          ? 'bg-primary-300 text-white cursor-wait'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }
                    `}
                  >
                    {settingBaseline === route.routeId ? 'Setting...' : 'Set Baseline'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Results Count */}
    <div className="text-sm text-gray-600">
      Showing {routes?.length || 0} route{(routes?.length || 0) !== 1 ? 's' : ''}
    </div>
    </div>
  );
};  


