export type Post = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
};

type ApiPost = {
  id: number;
  title: string;
  body: string;
};

export const POSTS_PAGE_SIZE = 9;
export const POSTS_TOTAL = 100;

function withCreatedAt(post: ApiPost): Post {
  return {
    ...post,
    createdAt: new Date(Date.now() - post.id * 86_400_000).toISOString(),
  };
}

export async function getPostsPage(start = 0, limit = POSTS_PAGE_SIZE): Promise<Post[]> {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=${limit}`,
    { next: { revalidate: 60 } },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  const posts = (await res.json()) as ApiPost[];
  return posts.map(withCreatedAt);
}

export async function getPosts(limit = POSTS_PAGE_SIZE): Promise<Post[]> {
  return getPostsPage(0, limit);
}

export async function getPostById(id: number): Promise<Post | null> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    next: { revalidate: 60 },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch post");

  const post = (await res.json()) as ApiPost;
  return withCreatedAt(post);
}

export function formatPostDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
