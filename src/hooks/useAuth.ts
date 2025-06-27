import { useState, useEffect } from 'react';
import { supabase, User, Doctor, Patient } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<Doctor | Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (userData.role === 'doctor') {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', userId)
          .single();

        if (doctorError) throw doctorError;

        setUser({
          ...userData,
          doctor_details: doctorData
        } as Doctor);
      } else {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', userId)
          .single();

        if (patientError) throw patientError;

        setUser({
          ...userData,
          patient_details: patientData
        } as Patient);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Handle email not confirmed error
        if (error.message?.includes('Email not confirmed') ||
            error.message?.includes('email_not_confirmed')) {
          return {
            success: false,
            error: 'Please check your email and click the confirmation link to activate your account before logging in.'
          };
        }

        // Handle database error granting user
        if (error.message?.includes('Database error granting user') ||
            error.message?.includes('unexpected_failure')) {
          return {
            success: false,
            error: 'There was an issue signing you in due to database configuration. This may be caused by Row Level Security policies or database triggers. Please contact the administrator to check the Supabase project\'s database settings for the users, doctors, and patients tables.'
          };
        }
        
        // Handle other specific auth errors
        if (error.message?.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password. Please check your credentials and try again.'
          };
        }
        
        throw error;
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle email not confirmed error from catch block
      if (error.message?.includes('Email not confirmed') ||
          error.message?.includes('email_not_confirmed')) {
        return {
          success: false,
          error: 'Please check your email and click the confirmation link to activate your account before logging in.'
        };
      }
      
      // Handle database error granting user from catch block
      if (error.message?.includes('Database error granting user') ||
          error.message?.includes('unexpected_failure')) {
        return {
          success: false,
          error: 'Login failed due to database configuration issues. This is typically caused by Row Level Security policies or database triggers. Please contact the administrator to review the Supabase project\'s database configuration.'
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    name: string;
    role: 'doctor' | 'patient';
    doctorDetails?: {
      license: string;
      specialization: string;
      clinic: string;
    };
    patientDetails?: {
      dateOfBirth: string;
      parentName: string;
      parentPhone: string;
    };
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });

      if (authError) {
        // Handle specific Supabase auth errors
        if (authError.message?.includes('Email signups are disabled') || 
            authError.message?.includes('email_provider_disabled')) {
          return {
            success: false,
            error: 'Email registration is currently disabled. Please contact your administrator to enable email signups in the Supabase project settings.'
          };
        }
        
        // Handle user already exists error
        if (authError.message?.includes('User already registered') ||
            authError.message?.includes('user_already_exists')) {
          return {
            success: false,
            error: 'An account with this email already exists. Please try logging in instead or use a different email address.'
          };
        }
        
        // Handle database error granting user
        if (authError.message?.includes('Database error granting user') ||
            authError.message?.includes('unexpected_failure')) {
          return {
            success: false,
            error: 'There was an issue creating your account due to database configuration. This may be caused by Row Level Security policies or database triggers. Please contact the administrator to check the Supabase project\'s database settings for the users, doctors, and patients tables.'
          };
        }
        
        throw authError;
      }
      
      if (!authData.user) {
        return {
          success: false,
          error: 'User creation failed - no user data returned from authentication service.'
        };
      }

      // Add a small delay to ensure the auth user and trigger have fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the user profile (already created by trigger) with specific details
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          role: userData.role
        })
        .eq('id', authData.user.id);

      if (userError) {
        console.error('User profile update error:', userError);
        
        // Handle specific RLS or permission errors
        if (userError.message?.includes('permission denied') || 
            userError.message?.includes('policy')) {
          return {
            success: false,
            error: 'Unable to update user profile due to database permissions. Please check the Row Level Security policies for the users table in your Supabase project.'
          };
        }
        
        throw new Error(`Failed to update user profile: ${userError.message}`);
      }

      // Create role-specific profile
      if (userData.role === 'doctor' && userData.doctorDetails) {
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: authData.user.id,
            license: userData.doctorDetails.license,
            specialization: userData.doctorDetails.specialization,
            clinic: userData.doctorDetails.clinic
          });

        if (doctorError) {
          console.error('Doctor profile creation error:', doctorError);
          
          // Handle specific RLS or permission errors
          if (doctorError.message?.includes('permission denied') || 
              doctorError.message?.includes('policy')) {
            return {
              success: false,
              error: 'Unable to create doctor profile due to database permissions. Please check the Row Level Security policies for the doctors table in your Supabase project.'
            };
          }
          
          throw new Error(`Failed to create doctor profile: ${doctorError.message}`);
        }
      } else if (userData.role === 'patient' && userData.patientDetails) {
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            id: authData.user.id,
            date_of_birth: userData.patientDetails.dateOfBirth,
            parent_name: userData.patientDetails.parentName,
            parent_phone: userData.patientDetails.parentPhone
          });

        if (patientError) {
          console.error('Patient profile creation error:', patientError);
          
          // Handle specific RLS or permission errors
          if (patientError.message?.includes('permission denied') || 
              patientError.message?.includes('policy')) {
            return {
              success: false,
              error: 'Unable to create patient profile due to database permissions. Please check the Row Level Security policies for the patients table in your Supabase project.'
            };
          }
          
          throw new Error(`Failed to create patient profile: ${patientError.message}`);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle database error granting user from catch block
      if (error.message?.includes('Database error granting user') ||
          error.message?.includes('unexpected_failure')) {
        return {
          success: false,
          error: 'Account creation failed due to database configuration issues. This is typically caused by Row Level Security policies or database triggers. Please contact the administrator to review the Supabase project\'s database configuration.'
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Registration failed. Please try again or contact support if the problem persists.' 
      };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  return {
    user,
    loading,
    login,
    signup,
    logout,
    isDoctor,
    isPatient,
    isAuthenticated: !!user
  };
};