import React, { useState, useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';

interface ProfilePictureEditorProps {
  currentPhotoURL?: string;
  onSave: (photoURL: string) => Promise<void>;
  loading?: boolean;
  compact?: boolean;
}

const ProfilePictureEditor: React.FC<ProfilePictureEditorProps> = ({
  currentPhotoURL,
  onSave,
  loading = false,
  compact = false
}) => {
  const [previewURL, setPreviewURL] = useState<string | undefined>(currentPhotoURL);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    try {
      setError(null);

      // Convert to base64 (for local preview and storage)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        setPreviewURL(base64String);

        // Save to Firebase
        setIsSaving(true);
        try {
          await onSave(base64String);
          setError(null);
        } catch (err) {
          setError('Failed to save photo. Please try again.');
          setPreviewURL(currentPhotoURL);
        } finally {
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setError(null);
      setIsSaving(true);
      await onSave('');
      setPreviewURL(undefined);
    } catch (err) {
      setError('Failed to remove photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const photoSize = compact ? '80px' : '120px';
  const photoBorderWidth = compact ? '2px' : '2px';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: compact ? '1rem' : '1.5rem',
      flexWrap: 'wrap'
    }}>
      {/* Preview */}
      <div style={{
        width: photoSize,
        height: photoSize,
        minWidth: photoSize,
        borderRadius: '50%',
        backgroundColor: '#222',
        border: `${photoBorderWidth} solid #333`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {previewURL ? (
          <img
            src={previewURL}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            color: '#666',
            fontSize: compact ? '0.75rem' : '0.9rem',
            textAlign: 'center',
            padding: '0.5rem'
          }}>
            No photo
          </div>
        )}
      </div>

      {/* Buttons container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '0.5rem' : '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          gap: compact ? '0.5rem' : '0.75rem'
        }}>
          <button
            onClick={handleUploadClick}
            disabled={loading || isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: compact ? '0.5rem 0.75rem' : '0.75rem 1rem',
              backgroundColor: '#C8956B',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || isSaving ? 'not-allowed' : 'pointer',
              opacity: loading || isSaving ? 0.7 : 1,
              fontSize: compact ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            <Upload size={16} />
            {isSaving ? 'Saving...' : 'Upload'}
          </button>

          {previewURL && (
            <button
              onClick={handleRemovePhoto}
              disabled={loading || isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: compact ? '0.5rem 0.75rem' : '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '4px',
                cursor: loading || isSaving ? 'not-allowed' : 'pointer',
                opacity: loading || isSaving ? 0.7 : 1,
                fontSize: compact ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              <Trash2 size={16} />
              Remove
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: compact ? '0.8rem' : '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ProfilePictureEditor;
