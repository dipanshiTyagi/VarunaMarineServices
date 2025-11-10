import React, { useState } from 'react';
import { BankingService } from '../../../core/application/services/BankingService';
import { ComplianceService } from '../../../core/application/services/ComplianceService';
import { apiClient } from '../../../adapters/outbound/apiClient';
import { BankEntry } from '../../../core/domain/BankEntry';

/**
 * Banking Tab Component
 * Handles banking operations (Fuel EU Article 20)
 */
export const BankingTab: React.FC = () => {
  const bankingService = new BankingService(apiClient);
  const complianceService = new ComplianceService(apiClient);

  const [shipId, setShipId] = useState<string>('');
  const [year, setYear] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // CB Data
  const [cbData, setCbData] = useState<{
    cbBefore: number;
    cbAfter: number;
    adjustedCB: number;
  } | null>(null);

  // Bank Records
  const [bankRecords, setBankRecords] = useState<BankEntry[]>([]);
  const [bankSummary, setBankSummary] = useState<{
    totalBanked: number;
    totalApplied: number;
    available: number;
  } | null>(null);

  // Banking form
  const [bankAmount, setBankAmount] = useState<string>('');
  const [applyAmount, setApplyAmount] = useState<string>('');
  const [banking, setBanking] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);

  const handleFetchCB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipId.trim()) {
      setError('Ship ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch current CB
      const cb = await complianceService.getCB(shipId, year);
      const adjustedCB = await complianceService.getAdjustedCB(shipId, year);

      // Fetch bank records
      const recordsData = await bankingService.getRecords(shipId, year);

      setCbData({
        cbBefore: cb.cbGco2eq,
        cbAfter: adjustedCB.cbGco2eq,
        adjustedCB: adjustedCB.cbGco2eq,
      });

      setBankRecords(recordsData.records);
      setBankSummary(recordsData.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch compliance balance');
      setCbData(null);
      setBankRecords([]);
      setBankSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSurplus = async () => {
    if (!shipId.trim() || !bankAmount) {
      setError('Ship ID and amount are required');
      return;
    }

    const amount = parseFloat(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    try {
      setBanking(true);
      setError(null);
      setSuccess(null);

      await bankingService.bank(shipId, year, amount);
      setSuccess(`Successfully banked ${amount.toFixed(2)} gCO₂e`);

      // Refresh data
      await handleFetchCB({ preventDefault: () => {} } as React.FormEvent);
      setBankAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bank surplus');
    } finally {
      setBanking(false);
    }
  };

  const handleApplyBanked = async () => {
    if (!shipId.trim() || !applyAmount) {
      setError('Ship ID and amount are required');
      return;
    }

    const amount = parseFloat(applyAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    try {
      setApplying(true);
      setError(null);
      setSuccess(null);

      const result = await bankingService.apply(shipId, year, amount);
      setSuccess(
        `Successfully applied ${amount.toFixed(2)} gCO₂e. CB: ${result.cbBefore.toFixed(2)} → ${result.cbAfter.toFixed(2)}`
      );

      // Update CB data
      if (cbData && result) {
        setCbData({
          ...cbData,
          cbAfter: result.cbAfter,
        });
      }

      // Refresh bank records
      const recordsData = await bankingService.getRecords(shipId, year);
      setBankRecords(recordsData.records);
      setBankSummary(recordsData.summary);
      setApplyAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply banked amount');
    } finally {
      setApplying(false);
    }
  };

  const canBank = cbData && cbData.cbBefore > 0;
  const canApply = bankSummary && bankSummary.available > 0;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fetch Compliance Balance</h3>
        <form onSubmit={handleFetchCB} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="shipId" className="block text-sm font-medium text-gray-700 mb-1">
              Ship ID
            </label>
            <input
              type="text"
              id="shipId"
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              placeholder="e.g., S001"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
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
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Loading...' : 'Fetch CB'}
            </button>
          </div>
        </form>
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

      {/* KPIs */}
      {cbData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">CB Before</p>
            <p
              className={`text-3xl font-bold ${
                cbData?.cbBefore >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {cbData?.cbBefore.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">gCO₂e</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Applied</p>
            <p className="text-3xl font-bold text-blue-600">
              {bankSummary ? bankSummary.totalApplied.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1">gCO₂e</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-1">CB After</p>
            <p
              className={`text-3xl font-bold ${
                cbData?.cbAfter >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {cbData?.cbAfter.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">gCO₂e</p>
          </div>
        </div>
      )}

      {/* Banking Actions */}
      {cbData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Surplus */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Surplus</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="bankAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (gCO₂e)
                </label>
                <input
                  type="number"
                  id="bankAmount"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  disabled={!canBank}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {cbData.cbBefore > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {cbData?.cbBefore.toFixed(2)} gCO₂e
                  </p>
                )}
              </div>
              <button
                onClick={handleBankSurplus}
                disabled={!canBank || banking || !bankAmount}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {banking ? 'Banking...' : 'Bank Surplus'}
              </button>
              {!canBank && (
                <p className="text-sm text-gray-500 text-center">
                  CB must be positive to bank surplus
                </p>
              )}
            </div>
          </div>

          {/* Apply Banked */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Banked</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="applyAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Amount (gCO₂e)
                </label>
                <input
                  type="number"
                  id="applyAmount"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  disabled={!canApply}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {bankSummary && bankSummary.available > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {bankSummary.available.toFixed(2)} gCO₂e
                  </p>
                )}
              </div>
              <button
                onClick={handleApplyBanked}
                disabled={!canApply || applying || !applyAmount}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {applying ? 'Applying...' : 'Apply Banked'}
              </button>
              {!canApply && (
                <p className="text-sm text-gray-500 text-center">
                  No available banked amount to apply
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bank Records Table */}
      {bankSummary && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bank Records</h3>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Banked:</span> {bankSummary.totalBanked.toFixed(2)} gCO₂e
                {' | '}
                <span className="font-medium">Applied:</span> {bankSummary.totalApplied.toFixed(2)} gCO₂e
                {' | '}
                <span className="font-medium">Available:</span>{' '}
                <span className="text-green-600">{bankSummary.available.toFixed(2)} gCO₂e</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ship ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                    <br />
                    <span className="text-xs font-normal">(gCO₂e)</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bankRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No bank records found
                    </td>
                  </tr>
                ) : (
                  bankRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.shipId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.amountGco2eq.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

