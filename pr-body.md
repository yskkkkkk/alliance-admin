탭 숨김 처리와 SWR 메모리 캐싱을 도입하여 조회 최적화를 진행했습니다. 그리고 연맹원들의 Drag and Drop 순서 정렬을 지원합니다.

### 데이터베이스 마이그레이션 쿼리
적용 전, Supabase SQL Editor에서 아래 쿼리를 꼭 1회 실행해 주세요. (기존 생성순으로 고유 순서번호 부여)
```sql
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS order_idx integer DEFAULT 0;

WITH cte AS (
  SELECT id, ROW_NUMBER() OVER(ORDER BY created_at ASC) as rnum
  FROM public.members
)
UPDATE public.members m
SET order_idx = cte.rnum
FROM cte
WHERE m.id = cte.id;
```
