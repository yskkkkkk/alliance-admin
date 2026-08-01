import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CRON_SECRET으로 외부 호출 방지 (선택 사항)
  // Vercel에서 Cron 설정 시 자동으로 Authorization 헤더에 Bearer 토큰으로 포함되어 옵니다.
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized attempt to access keep-alive cron");
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 서버리스 환경에서는 import.meta.env 대신 process.env를 사용합니다.
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials missing in environment variables' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 앱에서 사용하는 테이블(예: heroes)을 가볍게 조회하여 DB를 깨웁니다.
    // 데이터가 반환되든 테이블이 없든 관계없이 DB 엔진은 깨어납니다.
    const { error } = await supabase.from('heroes').select('id').limit(1);
    
    if (error && error.code !== '42P01') {
      // 42P01은 "relation does not exist(테이블 없음)" 에러
      console.error("Keep-alive query error:", error);
      throw error;
    }

    console.log("Supabase keep-alive ping successful.");
    return res.status(200).json({ success: true, message: 'Supabase pinged successfully!' });
  } catch (error) {
    console.error("Keep-alive error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
