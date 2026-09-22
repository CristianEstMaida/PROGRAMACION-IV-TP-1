import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabaseUrl = 'https://molxinzidxbtajevetmy.supabase.co';
  private supabaseKey = 'sb_publishable___MmJnE20qOCI10AQIJ1Jg_f0NVPHHI';
  public client: SupabaseClient;

  constructor() {
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
  }
}