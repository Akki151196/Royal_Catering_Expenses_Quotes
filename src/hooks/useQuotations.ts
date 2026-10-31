import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  event_date: string;
  event_type: string;
  grand_total: number;
  status: string;
  created_at: string;
}

export async function fetchFullQuotation(id: string) {
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (quotationError || !quotation) {
    console.error('Quotation error:', quotationError);
    throw new Error('Failed to fetch quotation details');
  }

  const { data: items, error: itemsError } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id)
    .order('sort_order');

  if (itemsError) {
    console.error('Items error:', itemsError);
    throw new Error('Failed to fetch quotation items');
  }

  return { ...quotation, items: items || [] };
}

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, client_name, event_date, event_type, grand_total, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotations(data ?? []);
    } catch (error) {
      console.error('Error loading quotations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const removeQuotation = useCallback(async (id: string) => {
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) throw error;
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { quotations, loading, reload, removeQuotation };
}
