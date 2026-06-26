-- 시드 게시판 제거 (공지/자유/QnA — 이후 CRUD로 관리)
DELETE FROM "boards" WHERE "slug" IN ('notice', 'free', 'qna');
