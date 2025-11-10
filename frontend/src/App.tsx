import { useState } from 'react';
import { TabButton } from './ui/TabButton';
import { RoutesTab } from './adapters/inbound/components/RoutesTab';
import { CompareTab } from './adapters/inbound/components/CompareTab';
import { BankingTab } from './adapters/inbound/components/BankingTab';
import { PoolingTab } from './adapters/inbound/components/PoolingTab';

// Tab types
type Tab = 'routes' | 'compare' | 'banking' | 'pooling';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'routes', label: 'Routes', icon: '🛳️' },
    { id: 'compare', label: 'Compare', icon: '📊' },
    { id: 'banking', label: 'Banking', icon: '💰' },
    { id: 'pooling', label: 'Pooling', icon: '🤝' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Fuel EU Maritime Compliance
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'routes' && <RoutesTab />}

          {activeTab === 'compare' && <CompareTab />}

          {activeTab === 'banking' && <BankingTab />}

          {activeTab === 'pooling' && <PoolingTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Fuel EU Maritime Compliance Platform © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
