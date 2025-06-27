import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihcflbjtddjyvpqoeoit.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables with detailed error messages
if (!supabaseUrl) {
  throw new Error(
    'Missing SUPABASE_URL. Please ensure the Supabase URL is properly configured.'
  );
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(
    'Invalid Supabase URL format. The URL must start with "https://" and should look like: ' +
    'https://your-project-id.supabase.co'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'Missing or invalid VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please set it to your Supabase anonymous key in the .env file. ' +
    'You can find this key in your Supabase project dashboard under Settings > API > Project API keys > anon public.'
  );
}

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'vaccination-tracker'
      }
    }
  });
} catch (error) {
  throw new Error(
    'Failed to initialize Supabase client. Please check your environment variables and try again. ' +
    'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
  );
}

export { supabase };

// Database types with comprehensive interface definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'patient';
  phone?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor extends User {
  role: 'doctor';
  doctor_details: {
    license: string;
    specialization: string;
    clinic: string;
  };
}

export interface Patient extends User {
  role: 'patient';
  patient_details: {
    date_of_birth: string;
    parent_name: string;
    parent_phone: string;
    doctor_id?: string;
  };
}

export interface VaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  batch_number?: string;
  administered_by: string;
  notes?: string;
  card_image?: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionCode {
  id: string;
  code: string;
  doctor_id: string;
  expires_at: string;
  used: boolean;
  created_at: string;
  used_at?: string;
  used_by?: string;
}

// Database utility functions for error handling
export const handleDatabaseError = (error: any): string => {
  if (!error) return 'Unknown database error occurred';
  
  const errorMessage = error.message || error.toString();
  
  // Environment/configuration errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
    return 'Cannot connect to database. Please check your internet connection and Supabase configuration.';
  }
  
  // Authentication errors
  if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
    return 'Authentication error. Please try logging out and logging back in.';
  }
  
  // Permission/RLS errors
  if (errorMessage.includes('permission denied') || errorMessage.includes('policy')) {
    return 'Database permission error. This may be due to Row Level Security policies. Please contact support.';
  }
  
  // Foreign key constraint errors
  if (errorMessage.includes('foreign key') || errorMessage.includes('violates')) {
    return 'Data integrity error. Please ensure all required relationships are properly set up.';
  }
  
  // Unique constraint errors
  if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
    return 'This record already exists. Please check for duplicates.';
  }
  
  // Missing table/column errors
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    return 'Database schema error. Please ensure all migrations have been applied.';
  }
  
  // Generic database errors
  if (errorMessage.includes('Database error granting user') || 
      errorMessage.includes('unexpected_failure')) {
    return 'Database configuration issue. This may be caused by Row Level Security policies, missing triggers, or insufficient permissions. Please contact the administrator.';
  }
  
  // Return the original message if no specific pattern matches
  return errorMessage;
};

// Test database connection
export const testDatabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    if (error) {
      return { success: false, error: handleDatabaseError(error) };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: handleDatabaseError(error) };
  }
};