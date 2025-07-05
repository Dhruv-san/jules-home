import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client'; // types are available via package
import { useUserData } from '@nhost/react'; // types are available via package

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
    <div style={{ width: 40, height: 40, background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 16, marginRight: 12 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)', padding: 24, marginBottom: 16, transition: 'box-shadow 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        {/* Avatar - TODO: Use actual avatar_url from post.Author if available */}
        <AuthorAvatarPlaceholder name={authorName} />
        <div>
          <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{authorName}</p>
          <p style={{ fontSize: 12, color: '#64748b' }}>{new Date(post.created_at).toLocaleString()}</p>
        </div>
      </div>
      {post.content_text && <p style={{ color: '#334155', marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{post.content_text}</p>}

      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16, gridTemplateColumns: post.image_urls.length > 1 ? '1fr 1fr' : '1fr' }}>
          {post.image_urls.map((url, index) =>
            <img
              key={index}
              src={url}
              alt={`post content ${index + 1}`}
              style={{ borderRadius: 12, objectFit: 'cover', width: '100%', maxHeight: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
            />
          )}
        </div>
      )}

      {post.video_url && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
          <video controls src={post.video_url} style={{ width: '100%', maxWidth: '100%', maxHeight: 320, background: '#000' }}>
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

const NewsArticleItem: React.FC<{ article: NewsArticle }> = ({ article }) => (
  <div style={{ background: '#1e293b', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', color: '#fff', marginBottom: 8 }}>
    {article.urlToImage && <img src={article.urlToImage} alt={article.title} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />}
    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}><a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>{article.title}</a></h3>
    <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>By {article.author || article.source.name} - {new Date(article.publishedAt).toLocaleDateString()}</p>
    <p style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 10 }}>{article.description}</p>
    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#38bdf8', textDecoration: 'underline' }}>Read more &rarr;</a>
  </div>
);


const FeedPage: React.FC = () => {
  const currentUser = useUserData();
  const { data: postsData, loading: postsLoading, error: postsError, fetchMore, refetch: refetchPosts } = useQuery<GetFeedPostsData, { limit: number; offset: number }>(GET_FEED_POSTS, {
    variables: { limit: 10, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });
  const { data: interestsData } = useQuery<{ profiles: { user_id: string; interests: string[] }[] }>(GET_USER_INTERESTS, {
    variables: { userId: currentUser?.id },
    skip: !currentUser?.id,
  });

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);

  // Ensure you have a .env file at the root of your 'cofounder-app' project
  // For local development, it would contain:
  // REACT_APP_NEWS_API_KEY=83a679cb473e4cf7bd58f918de5adee4
  const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

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
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error("Error fetching news:", err);
            setNewsError(errorMsg || "Failed to fetch news.");
          } finally {
            setNewsLoading(false);
          }
        }
      }
    };
    fetchNews();
  }, [interestsData, NEWS_API_KEY]);


  const handlePostCreated = () => {
    refetchPosts();
  };

  const loadMorePosts = () => {
    if (postsLoading || isLoadingMorePosts || !postsData) return;
    setIsLoadingMorePosts(true);
    fetchMore({
      variables: { offset: postsData.posts.length },
      updateQuery: (prevResult: GetFeedPostsData, { fetchMoreResult }: { fetchMoreResult?: GetFeedPostsData }) => {
        setIsLoadingMorePosts(false);
        if (!fetchMoreResult || fetchMoreResult.posts.length === 0) return prevResult;
        return { posts: [...prevResult.posts, ...fetchMoreResult.posts] };
      },
    }).catch((err: unknown) => {
        setIsLoadingMorePosts(false);
        console.error("Error fetching more posts:", err);
    });
  };

  const posts = postsData?.posts || [];

  


  return (
    <div style={{ padding: 24, background: 'linear-gradient(135deg, #f8fafc 0%, #1e293b 100%)', minHeight: '100vh', color: '#1e293b' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <CreatePostForm onPostCreated={handlePostCreated} />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '32px 0 24px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: 8, color: '#f43f5e' }}>Activity Feed</h2>

        {(postsLoading && posts.length === 0) && <p style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading feed...</p>}
        {postsError && <p style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>Error loading posts: {postsError.message}</p>}

        {/* News Section */}
        {newsLoading && <p style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading relevant news...</p>}
        {newsError && <p style={{ textAlign: 'center', padding: 20, color: '#f59e42' }}>Could not load news: {newsError}</p>}
        {newsArticles.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8', marginBottom: 16 }}>Relevant News For You</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {newsArticles.map(article => <NewsArticleItem key={article.url} article={article} />)}
            </div>
            <hr style={{ margin: '40px 0', border: 0, borderTop: '1.5px solid #e2e8f0' }} />
          </div>
        )}

        {posts.length === 0 && !postsLoading && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No posts or news in the feed yet. Be the first to share something!</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {posts.map((post: Post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>

        {!postsLoading && !isLoadingMorePosts && postsData && postsData.posts.length > 0 && postsData.posts.length % 10 === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={loadMorePosts}
              style={{ padding: '14px 36px', background: 'linear-gradient(90deg, #f43f5e 0%, #be185d 100%)', color: '#fff', fontWeight: 700, borderRadius: 10, border: 'none', boxShadow: '0 2px 8px rgba(244,63,94,0.10)', fontSize: 18, cursor: isLoadingMorePosts ? 'not-allowed' : 'pointer', opacity: isLoadingMorePosts ? 0.6 : 1, transition: 'background 0.2s, transform 0.1s' }}
              disabled={isLoadingMorePosts}
            >
              {isLoadingMorePosts ? 'Loading...' : 'Load More Posts'}
            </button>
          </div>
        )}
        {isLoadingMorePosts && <p style={{ textAlign: 'center', padding: 16, color: '#64748b' }}>Loading more posts...</p>}
      </div>
    </div>
  );
};

export default FeedPage;
