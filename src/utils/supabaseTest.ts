import { supabase } from '../config/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('films')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Connection Test Failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Data:', data);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}; 