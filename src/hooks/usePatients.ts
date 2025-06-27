import { useState, useEffect } from 'react';
import { supabase, Patient } from '../lib/supabase';

export const usePatients = (doctorId?: string) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    if (!doctorId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          users!inner(*)
        `)
        .eq('doctor_id', doctorId);

      if (error) throw error;
      
      const formattedPatients = data?.map(item => ({
        ...item.users,
        patient_details: {
          date_of_birth: item.date_of_birth,
          parent_name: item.parent_name,
          parent_phone: item.parent_phone,
          doctor_id: item.doctor_id
        }
      })) || [];

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [doctorId]);

  return {
    patients,
    loading,
    refetch: fetchPatients
  };
};