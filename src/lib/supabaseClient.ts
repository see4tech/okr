import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Faltan variables de Supabase: configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify (Configuración del sitio → Variables de entorno) y vuelve a desplegar.'
  )
}

export const supabase = createClient(url, anonKey)
