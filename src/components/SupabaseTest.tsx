import { useState } from 'react';
import { testSupabaseConnection } from '../utils/supabaseTest';

const SupabaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await testSupabaseConnection();
      setTestResult(result ? 'Connection successful! Check console for details.' : 'Connection failed. Check console for errors.');
    } catch (error) {
      setTestResult('Test failed with an unexpected error. Check console for details.');
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>

      {testResult && (
        <div className={`mt-4 p-3 rounded-md ${
          testResult.includes('successful') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {testResult}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>This test will:</p>
        <ol className="list-decimal ml-4 space-y-1">
          <li>Try to connect to Supabase</li>
          <li>Insert a test record</li>
          <li>Delete the test record</li>
        </ol>
        <p className="mt-2">Check the browser console for detailed results.</p>
      </div>
    </div>
  );
};

export default SupabaseTest; 