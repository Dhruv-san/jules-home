import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useUserData } from '@nhost/react';

import CreatePostForm from '../components/feed/CreatePostForm';

// --- Types ---
interface PostAuthor {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  profile?: {
    username?: string | null;
  } | null;
}

interface Post {
  id: string;
  user_id: string;
  content_text?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  created_at: string;
  Author?: PostAuthor | null;
}

interface GetFeedPostsData {
  posts: Post[];
}

interface UserProfileInterests {
    user_id: string;
    interests: string[] | null;
}

interface GetUserInterestsData {
    profiles: UserProfileInterests[]; // profiles is an array, even with limit 1
}

interface NewsArticle {
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

// --- GraphQL Queries ---
const GET_FEED_POSTS = gql`
  query GetFeedPosts($limit: Int = 10, $offset: Int = 0) {
    posts(order_by: { created_at: desc }, limit: $limit, offset: $offset) {
      id
      user_id
      content_text
      image_urls
      video_url
      created_at
      Author {
        id
        displayName
        avatarUrl
        profile {
          username
        }
      }
    }
  }
`;

const GET_USER_INTERESTS = gql`
  query GetUserInterests($userId: uuid!) {
    profiles(where: {user_id: {_eq: $userId}}, limit: 1) {
      user_id
      interests
    }
  }
`;

// --- Components ---
const PostItem: React.FC<{ post: Post }> = ({ post }) => {
  const authorName = post.Author?.profile?.username || post.Author?.displayName || 'Anonymous';
  const AuthorAvatarPlaceholder: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
      {name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="bg-slate-800 p-4 sm:p-5 rounded-lg shadow-md">
      <div className="flex items-center mb-3">
        <AuthorAvatarPlaceholder name={authorName} />
        <div>
          <p className="font-semibold text-white">{authorName}</p>
          <p className="text-xs text-slate-400">{new Date(post.created_at).toLocaleString()}</p>
        </div>
      </div>
      {post.content_text && <p className="text-slate-300 mb-3 whitespace-pre-wrap">{post.content_text}</p>}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`grid gap-2 mb-3 ${post.image_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.image_urls.map((url, index) => <img key={index} src={url} alt={`post image ${index + 1}`} className="rounded-md object-cover w-full max-h-96" />)}
        </div>
      )}
      {post.video_url && (
        <div className="mb-3"><video controls src={post.video_url} className="w-full max-w-md mx-auto rounded-md max-h-96 bg-black">Your browser does not support the video tag.</video></div>
      )}
    </div>
  );
};

const NewsArticleItem: React.FC<{ article: NewsArticle }> = ({ article }) => (
    <div className="bg-slate-800 p-4 sm:p-5 rounded-lg shadow-md">
        {article.urlToImage && <img src={article.urlToImage} alt={article.title} className="w-full h-48 object-cover rounded-t-lg mb-3" />}
        <h3 className="text-lg font-semibold text-white mb-1 hover:text-rose-400"><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a></h3>
        <p className="text-xs text-slate-400 mb-2">By {article.author || article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}</p>
        <p className="text-sm text-slate-300 mb-3 line-clamp-3">{article.description}</p>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:text-sky-300">Read more &rarr;</a>
    </div>
);


const FeedPage: React.FC = () => {
  const currentUser = useUserData();
  const { data: postsData, loading: postsLoading, error: postsError, fetchMore, refetch: refetchPosts } = useQuery<GetFeedPostsData>(GET_FEED_POSTS, {
    variables: { limit: 10, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });
  const { data: interestsData, loading: interestsLoading } = useQuery<GetUserInterestsData>(GET_USER_INTERESTS, {
      variables: { userId: currentUser?.id },
      skip: !currentUser?.id,
  });

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  const NEWS_API_KEY = '83a679cb473e4cf7bd58f918de5adee4'; // Store securely in .env for real apps

  useEffect(() => {
    const fetchNews = async () => {
      if (interestsData?.profiles && interestsData.profiles.length > 0) {
        const userInterests = interestsData.profiles[0].interests;
        if (userInterests && userInterests.length > 0) {
          setNewsLoading(true);
          setNewsError(null);
          try {
            // For simplicity, using the first interest. Can be expanded to query multiple or combine.
            const query = encodeURIComponent(userInterests.join(' OR ')); // Combine interests
            const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&apiKey=${NEWS_API_KEY}&pageSize=5&sortBy=publishedAt&language=en`);
            if (!response.ok) throw new Error(`News API request failed: ${response.statusText}`);
            const newsData = await response.json();
            setNewsArticles(newsData.articles || []);
          } catch (err: any) {
            console.error("Error fetching news:", err);
            setNewsError(err.message || "Failed to fetch news.");
          } finally {
            setNewsLoading(false);
          }
        }
      }
    };
    fetchNews();
  }, [interestsData]);


  const handlePostCreated = () => {
    refetchPosts();
  };

  const loadMorePosts = () => {
    if (postsLoading || isLoadingMorePosts || !postsData) return;
    setIsLoadingMorePosts(true);
    fetchMore({
      variables: { offset: postsData.posts.length },
      updateQuery: (prevResult, { fetchMoreResult }) => {
        setIsLoadingMorePosts(false);
        if (!fetchMoreResult || fetchMoreResult.posts.length === 0) return prevResult;
        return { posts: [...prevResult.posts, ...fetchMoreResult.posts] };
      },
    }).catch(err => {
        setIsLoadingMorePosts(false);
        console.error("Error fetching more posts:", err);
    });
  };

  const posts = postsData?.posts || [];

  // Combine and sort posts and news for an interleaved feed (simplified)
  // This is a basic interleaving. More sophisticated logic might be desired.
  const combinedFeedItems = [...posts.map(p => ({ ...p, type: 'post' })), ...newsArticles.map(n => ({ ...n, type: 'news', id: n.url, created_at: n.publishedAt }))]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


  return (
    <div className="p-4 md:p-6 bg-slate-900 min-h-full text-white">
      <CreatePostForm onPostCreated={handlePostCreated} />

      <h2 className="text-2xl font-bold my-6 border-b border-slate-700 pb-2">Activity Feed</h2>

      {(postsLoading && posts.length === 0) && <p className="text-center py-10">Loading feed...</p>}
      {postsError && <p className="text-center py-10 text-red-500">Error loading posts: {postsError.message}</p>}

      {/* Separate News Section for now for simplicity, can interleave later */}
      {newsLoading && <p className="text-center py-5">Loading relevant news...</p>}
      {newsError && <p className="text-center py-5 text-yellow-500">Could not load news: {newsError}</p>}
      {newsArticles.length > 0 && (
          <div className="mb-8">
              <h3 className="text-xl font-semibold text-sky-400 mb-4">Relevant News For You</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newsArticles.map(article => <NewsArticleItem key={article.url} article={article} />)}
              </div>
               <hr className="my-8 border-slate-700" />
          </div>
      )}

      {!postsLoading && posts.length === 0 && newsArticles.length === 0 && (
        <p className="text-slate-400 text-center py-10">No posts or news in the feed yet. Be the first to share something!</p>
      )}

      <div className="space-y-6">
        {posts.map(post => ( // Only rendering posts here, news is separate above
          <PostItem key={post.id} post={post} />
        ))}
      </div>

      {!postsLoading && !isLoadingMorePosts && postsData && postsData.posts.length > 0 && postsData.posts.length % 10 === 0 && (
        <div className="text-center mt-8">
          <button onClick={loadMorePosts} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-md" disabled={isLoadingMorePosts}>
            {isLoadingMorePosts ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
      {isLoadingMorePosts && <p className="text-center py-4">Loading more posts...</p>}
    </div>
  );
};

export default FeedPage;
