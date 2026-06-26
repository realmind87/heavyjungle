-- 기본 게시판 시드 (notice, free, qna)
INSERT INTO "boards" ("slug", "name", "description", "sort_order") VALUES
	('notice', '공지', '공지사항 게시판', 0),
	('free', '자유게시판', '자유롭게 이야기하는 공간', 1),
	('qna', '질문답변', '궁금한 것을 물어보세요', 2)
ON CONFLICT ("slug") DO NOTHING;
