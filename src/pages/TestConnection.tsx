import { useEffect, useState } from 'react';
import { testSupabaseConnection } from '../utils/supabaseTest';

export default function TestConnection() {
  const [testResult, setTestResult] = useState<string>('Testing...');

  useEffect(() => {
    const runTest = async () => {
      try {
        const result = await testSupabaseConnection();
        setTestResult(result ? 'Connection successful! ✅' : 'Connection failed ❌');
      } catch (error) {
        setTestResult(`Test error: ${error}`);
      }
    };

    runTest();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p className="mb-2">{testResult}</p>
      <p className="text-gray-600">Check the browser console for detailed results.</p>
    </div>
  );
} 