export type SearchMode = "post" | "user";

export type SearchPost = {
  id: string;
  title: string;
  createdAt: string;
  author: {
    username: string;
    displayName: string | null;
  };
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
};

export type SearchUsersResponse = {
  items: SearchUser[];
};

export type SearchErrorResponse = {
  error: string;
};
