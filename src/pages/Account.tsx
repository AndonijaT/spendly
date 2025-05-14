// src/pages/Account.tsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import '../styles/AccountPage.css';

function Account() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setName(firebaseUser.displayName || '');
        setEmail(firebaseUser.email || '');
        setPhotoURL(firebaseUser.photoURL || '/default-avatar.png');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const imageRef = ref(storage, `profile-images/${user.uid}`);

    try {
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      await updateProfile(user, { photoURL: url });
      setPhotoURL(url);
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: name });
        toast.success('Name updated successfully!');
        setEditing(false);
      } catch (err) {
        console.error('Error updating profile:', err);
        toast.error('Error saving changes.');
      }
    }
  };

  return (
    <div className="account-page">
      <h2>My Account</h2>

      <div className="account-header">
        <img src={photoURL} alt="Profile" className="profile-image" />
        <div className="info">
          <h3>{name || 'Your Name'}</h3>
          <p>{email}</p>
        </div>
      </div>

      <div className="account-section">
        <div className="section-header">
          <h3>Personal Details</h3>
          {!editing && <button onClick={() => setEditing(true)}>Edit</button>}
        </div>

        {editing && (
          <div className="edit-form">
            <label>
              Full Name:
              <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </label>

            <label>
              Profile Photo:
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            <label>
              Email:
              <input type="email" value={email} disabled />
            </label>

            <div className="action-buttons">
              <button className="save-btn" onClick={handleSave} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;
