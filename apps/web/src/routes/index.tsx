import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  environment: string;
}

// 環境変数からAPIのベースURLを取得
const API_BASE_URL = import.meta.env.VITE_API_URL;

const fetchHealthData = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const loader = async () => {
  const healthData = await fetchHealthData();
  return { healthData };
};

export const Route = createFileRoute('/')({
  loader,
  component: Index,
});

function Index() {
  const { healthData: initialHealthData } = Route.useLoaderData();
  const [healthData, setHealthData] = useState<HealthResponse>(initialHealthData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthData();
      setHealthData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to EC App</h1>
        <p className="text-xl text-gray-600 mb-8">TanStack Router SPA with Radix UI & Tailwind CSS</p>

        {/* 商品一覧へのリンク */}
        <div className="mb-8">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            商品一覧を見る
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* API疎通確認セクション */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">API Health Check</h2>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="mb-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Loading...' : 'Refresh Health Data'}
          </button>

          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
              <p className="text-sm text-red-500 mt-2">Make sure the API server is running on {API_BASE_URL}</p>
            </div>
          )}

          {healthData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">✓ API Connection Successful</p>
              <p className="text-sm text-gray-600 mb-2">
                API URL: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE_URL}</code>
              </p>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded overflow-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <a
          href="https://www.radix-ui.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          Visit Radix UI
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
