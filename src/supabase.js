import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yiamplfqhyurgxxbpeur.supabase.co'
const supabaseKey = 'sb_publishable_KbRr12cW5aCbvyv1BQVbdw_f7NbmcCU'

export const supabase = createClient(supabaseUrl, supabaseKey)