export type SearchMode = "post" | "user";

export type SearchPost = {
  id: string;
  title: string;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
  };
  /** 제목이 아닌 본문에서 일치한 경우의 미리보기 텍스트 */
  excerpt?: string;
};

export type SearchUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/** 스펙 별칭 */
export type Post = SearchPost;
export type User = SearchUser;

export type SearchPostsResponse = {
  items: SearchPost[];
  hasMore?: boolean;
};

export type SearchUsersResponse = {
  items: SearchUser[];
  hasMore?: boolean;
};

export type SearchErrorResponse = {
  error: string;
};
