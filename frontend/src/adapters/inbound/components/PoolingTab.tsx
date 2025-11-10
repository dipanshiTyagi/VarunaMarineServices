import React, { useState } from 'react';
import { PoolingService } from '../../../core/application/services/PoolingService';
import { ComplianceService } from '../../../core/application/services/ComplianceService';
import { apiClient } from '../../../adapters/outbound/apiClient';
import { Pool } from '../../../core/domain/Pool';

interface MemberData {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
  loading: boolean;
  error: string | null;
}

/**
 * Pooling Tab Component
 * Handles pooling operations (Fuel EU Article 21)
 */
export const PoolingTab: React.FC = () => {
  const poolingService = new PoolingService(apiClient);
  const complianceService = new ComplianceService(apiClient);

  const [year, setYear] = useState<number>(2024);
  const [shipIdInput, setShipIdInput] = useState<string>('');
  const [shipIds, setShipIds] = useState<string[]>([]);
  const [members, setMembers] = useState<Map<string, MemberData>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [createdPool, setCreatedPool] = useState<Pool | null>(null);

  const addShipId = () => {
    const trimmed = shipIdInput.trim();
    if (!trimmed) {
      setError('Ship ID cannot be empty');
      return;
    }
    if (shipIds.includes(trimmed)) {
      setError('Ship ID already added');
      return;
    }
    setShipIds([...shipIds, trimmed]);
    setShipIdInput('');
    setError(null);
  };

  const removeShipId = (shipId: string) => {
    setShipIds(shipIds.filter((id) => id !== shipId));
    const newMembers = new Map(members);
    newMembers.delete(shipId);
    setMembers(newMembers);
  };

  const fetchMemberCB = async (shipId: string) => {
    const newMembers = new Map(members);
    newMembers.set(shipId, {
      shipId,
      cbBefore: 0,
      cbAfter: 0,
      loading: true,
      error: null,
    });
    setMembers(new Map(newMembers));

    try {
      const adjustedCB = await complianceService.getAdjustedCB(shipId, year);

      if (!adjustedCB || typeof adjustedCB.cbGco2eq === 'undefined') {
        throw new Error(`No compliance data found for ship ${shipId} in year ${year}`);
      }
      newMembers.set(shipId, {
        shipId,
        cbBefore: adjustedCB.cbGco2eq,
        cbAfter: adjustedCB.cbGco2eq, // Will be updated after pool creation
        loading: false,
        error: null,
      });
      setMembers(new Map(newMembers));
    } catch (err) {
      newMembers.set(shipId, {
        shipId,
        cbBefore: 0,
        cbAfter: 0,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch CB',
      });
    }
    setMembers(new Map(newMembers));
  };

  const fetchAllMembers = async () => {
    if (shipIds.length === 0) {
      setError('Please add at least one ship ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Fetch CB for all ships
    const promises = shipIds.map((shipId) => fetchMemberCB(shipId));
    await Promise.all(promises);

    setLoading(false);
  };

  const calculatePoolSum = (): number => {
    let sum = 0;
    members.forEach((member) => {
      if (!member.loading && !member.error) {
        sum += member.cbBefore;
      }
    });
    return sum;
  };

  const validatePool = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (shipIds.length === 0) {
      errors.push('At least one ship ID is required');
    }

    // Check if all members have CB data
    const hasErrors = Array.from(members.values()).some((m) => m.error);
    if (hasErrors) {
      errors.push('Some ships have errors. Please fix them before creating a pool.');
    }

    const poolSum = calculatePoolSum();
    if (poolSum < 0) {
      errors.push(`Pool sum is negative (${poolSum.toFixed(2)}). Sum must be >= 0.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleCreatePool = async () => {
    const validation = validatePool();
    if (!validation.isValid) {
      setError(validation.errors.join('; '));
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const pool = await poolingService.createPool(year, shipIds);
      setCreatedPool(pool);
      setSuccess('Pool created successfully!');

      // Update members with cbAfter values
      const newMembers = new Map(members);
      pool.members.forEach((poolMember) => {
        const existing = newMembers.get(poolMember.shipId);
        if (existing) {
          newMembers.set(poolMember.shipId, {
            ...existing,
            cbAfter: poolMember.cbAfter,
          });
        }
      });
      setMembers(newMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pool');
    } finally {
      setCreating(false);
    }
  };

  const poolSum = calculatePoolSum();
  const validation = validatePool();
  const canCreatePool = validation.isValid && !loading && !creating;

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Pool</h3>
        <div className="space-y-4">
          {/* Year Input */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || 2024)}
              min="2020"
              max="2030"
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Ship ID Input */}
          <div>
            <label htmlFor="shipId" className="block text-sm font-medium text-gray-700 mb-1">
              Add Ship ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="shipId"
                value={shipIdInput}
                onChange={(e) => setShipIdInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addShipId();
                  }
                }}
                placeholder="e.g., S001"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={addShipId}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Ship IDs List */}
          {shipIds.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ship IDs ({shipIds.length})</p>
              <div className="flex flex-wrap gap-2">
                {shipIds.map((shipId) => (
                  <div
                    key={shipId}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md"
                  >
                    <span className="text-sm font-medium text-gray-900">{shipId}</span>
                    <button
                      onClick={() => removeShipId(shipId)}
                      className="text-red-600 hover:text-red-800 text-sm font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fetch CB Button */}
          {shipIds.length > 0 && (
            <button
              onClick={fetchAllMembers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Fetching CB...' : 'Fetch Adjusted CB for All Ships'}
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Success</p>
          <p className="text-green-600 text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Pool Sum Indicator */}
      {members.size > 0 && (
        <div
          className={`border-2 rounded-lg p-4 ${
            poolSum >= 0
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Pool Sum</p>
              <p
                className={`text-3xl font-bold ${
                  poolSum >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {poolSum.toFixed(2)} gCO₂e
              </p>
            </div>
            <div className="text-4xl">{poolSum >= 0 ? '✅' : '❌'}</div>
          </div>
          {poolSum < 0 && (
            <p className="text-sm text-red-600 mt-2">
              Pool sum must be {'>='} 0 to create a pool
            </p>
          )}
        </div>
      )}

      {/* Members List */}
      {members.size > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Pool Members</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ship ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CB Before
                    <br />
                    <span className="text-xs font-normal">(gCO₂e)</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CB After
                    <br />
                    <span className="text-xs font-normal">(gCO₂e)</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                    <br />
                    <span className="text-xs font-normal">(gCO₂e)</span>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from(members.values()).map((member) => (
                  <tr key={member.shipId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{member.shipId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.loading ? (
                        <div className="animate-pulse text-gray-400">Loading...</div>
                      ) : member.error ? (
                        <span className="text-sm text-red-600">{member.error}</span>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            member.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {member.cbBefore.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.loading ? (
                        <div className="animate-pulse text-gray-400">Loading...</div>
                      ) : member.error ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            member.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {member.cbAfter.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.loading || member.error ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            member.cbAfter - member.cbBefore > 0
                              ? 'text-green-600'
                              : member.cbAfter - member.cbBefore < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {member.cbAfter - member.cbBefore > 0 ? '+' : ''}
                          {(member.cbAfter - member.cbBefore).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {member.loading ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      ) : member.error ? (
                        <span className="text-red-600 text-sm">Error</span>
                      ) : member.cbAfter >= 0 ? (
                        <span className="text-green-600 text-sm">✅ Compliant</span>
                      ) : (
                        <span className="text-red-600 text-sm">❌ Deficit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Pool Button */}
      {members.size > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleCreatePool}
            disabled={!canCreatePool}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {creating ? 'Creating Pool...' : 'Create Pool'}
          </button>
        </div>
      )}

      {/* Created Pool Summary */}
      {createdPool && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Created Successfully</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Pool ID:</span>
              <p className="font-medium text-gray-900">{createdPool.id}</p>
            </div>
            <div>
              <span className="text-gray-600">Year:</span>
              <p className="font-medium text-gray-900">{createdPool.year}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Members:</span>
              <p className="font-medium text-gray-900">{createdPool.members.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Pool Sum:</span>
              <p
                className={`font-medium ${
                  createdPool.members.reduce((sum, m) => sum + m.cbBefore, 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {createdPool.members.reduce((sum, m) => sum + m.cbBefore, 0).toFixed(2)} gCO₂e
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

