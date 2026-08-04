import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CRON_SECRET으로 외부 호출 방지 (선택 사항)
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized attempt to access keep-alive cron");
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 사용자가 Vercel 환경 변수를 설정하지 않았더라도 동작하도록 하드코딩된 fallback 값 추가
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ttxcijismlynuhewshrw.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_wK8KBl7MrWWhEdlxi_mcIg_ydqbYHD8';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials missing in environment variables' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 앱에서 사용하는 테이블(예: heroes)을 가볍게 조회하여 DB를 깨웁니다.
    const { error } = await supabase.from('heroes').select('id').limit(1);
    
    if (error && error.code !== '42P01') {
      console.error("Keep-alive query error:", error);
      throw error;
    }

    console.log("Supabase keep-alive ping successful.");
    return res.status(200).json({ success: true, message: 'Supabase pinged successfully with fallback credentials!' });
  } catch (error) {
    console.error("Keep-alive error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
