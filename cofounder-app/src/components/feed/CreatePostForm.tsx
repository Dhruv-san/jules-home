import React, { useState, useCallback } from 'react';
import { useNhostClient } from '@nhost/react';
import { useMutation, gql } from '@apollo/client';

// GraphQL Mutation (ensure this matches what's defined for use, or define it here)
const CREATE_POST_MUTATION = gql`
  mutation CreatePost(
    $contentText: String,
    $imageUrls: jsonb, # Array of strings
    $videoUrl: String
  ) {
    insert_posts_one(
      object: {
        content_text: $contentText,
        image_urls: $imageUrls,
        video_url: $videoUrl
        # user_id is set by Hasura permission preset
      }
    ) {
      id # Return ID of new post
      # Potentially return more fields if needed for immediate cache update or display
    }
  }
`;

interface CreatePostFormProps {
  onPostCreated: () => void; // Callback to refresh feed or update UI
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const nhost = useNhostClient();
  const [contentText, setContentText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Overall progress, or for individual files

  const [createPost, { loading: creatingPost, error: createPostError }] = useMutation(CREATE_POST_MUTATION);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setImageFiles(prev => [...prev, ...filesArray]); // Allow adding more images

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      newPreviews.forEach(url => { // Revoke old URL if it's from a removed file to prevent memory leaks
        if (!imagePreviews.includes(url)) URL.revokeObjectURL(url);
      });
      return newPreviews;
    });
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoFile(file);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview); // Revoke old preview
      }
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contentText.trim() && imageFiles.length === 0 && !videoFile) {
      alert('Please add some content, images, or a video to your post.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0); // Reset progress

    let uploadedImageUrls: string[] = [];
    let uploadedVideoUrl: string | null = null;

    try {
      // Upload images
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          // Nhost storage path: e.g., public/posts_media/user_id/filename
          // For simplicity, using a generic path. User ID scoping is better.
          const { fileMetadata, error: uploadError } = await nhost.storage.upload({
            file,
            bucketId: 'default', // Or your specific bucket
            // name: `posts_media/${nhost.auth.getUser()?.id}/${file.name}` // Example for user-scoped path
          });

          if (uploadError) throw uploadError;
          if (fileMetadata) {
            // Construct public URL. Path depends on your storage rules and how Nhost constructs them.
            // Typically it's something like: `${NHOST_STORAGE_URL}/o/${fileMetadata.id}/${fileMetadata.name}`
            // Or using getPublicUrl:
            const publicUrl = nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
            uploadedImageUrls.push(publicUrl);
          }
          setUploadProgress(Math.round(((i + 1) / (imageFiles.length + (videoFile ? 1 : 0))) * 100));
        }
      }

      // Upload video
      if (videoFile) {
        const { fileMetadata, error: uploadError } = await nhost.storage.upload({
          file: videoFile,
          bucketId: 'default',
        });
        if (uploadError) throw uploadError;
        if (fileMetadata) {
          uploadedVideoUrl = nhost.storage.getPublicUrl({ fileId: fileMetadata.id });
        }
        setUploadProgress(100);
      }

      // Create post entry in database
      await createPost({
        variables: {
          contentText: contentText.trim() || null, // Send null if empty
          imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
          videoUrl: uploadedVideoUrl,
        },
      });

      // Reset form
      setContentText('');
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFile(null);
      setVideoPreview(null);
      onPostCreated(); // Callback to parent (e.g., FeedPage to refetch posts)

    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Create New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[80px]"
            rows={3}
          />
        </div>

        {/* Image Uploads */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Upload Images (Max 5)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 disabled:opacity-50"
            disabled={imageFiles.length >= 5 || isUploading}
          />
          {imageFiles.length >= 5 && <p className="text-xs text-yellow-400 mt-1">Maximum 5 images allowed.</p>}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {imagePreviews.map((previewUrl, index) => (
              <div key={index} className="relative group">
                <img src={previewUrl} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                  disabled={isUploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Video Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Upload Video (1 only)</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
            disabled={!!videoFile || isUploading}
          />
          {videoPreview && (
            <div className="mt-3 relative group w-full max-w-xs">
              <video src={videoPreview} controls className="w-full h-auto rounded-md max-h-48" />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove video"
                disabled={isUploading}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-rose-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <p className="text-xs text-slate-300 text-center mt-1">{uploadProgress}% uploaded</p>
          </div>
        )}

        {createPostError && (
          <p className="text-sm text-red-400">Error creating post: {createPostError.message}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isUploading || creatingPost || (!contentText.trim() && imageFiles.length === 0 && !videoFile)}
            className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : (creatingPost ? 'Posting...' : 'Create Post')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
