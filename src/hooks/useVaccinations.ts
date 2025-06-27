import { useState, useEffect } from 'react';
import { supabase, VaccinationRecord } from '../lib/supabase';

export const useVaccinations = (patientId?: string) => {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!patientId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('date_administered', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching vaccination records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const addRecord = async (record: Omit<VaccinationRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      
      setRecords(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding vaccination record:', error);
      throw error;
    }
  };

  const updateRecord = async (id: string, updates: Partial<VaccinationRecord>) => {
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRecords(prev => prev.map(record => 
        record.id === id ? data : record
      ));
      return data;
    } catch (error) {
      console.error('Error updating vaccination record:', error);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vaccination_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecords(prev => prev.filter(record => record.id !== id));
    } catch (error) {
      console.error('Error deleting vaccination record:', error);
      throw error;
    }
  };

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  };
};