import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  updateProfile,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import '../styles/AccountPage.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { useLanguage } from '../context/LanguageContext';
import { getDoc } from 'firebase/firestore';
import type { UserInfo } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { arrayRemove } from 'firebase/firestore';

declare global {
  interface Window {
    grecaptcha: any;
    recaptchaVerifier?: RecaptchaVerifier;
  }
}


export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const { t } = useLanguage();
  const [sharedWithUsers, setSharedWithUsers] = useState<{ email: string; uid: string }[]>([]);

  const [isPasswordUser, setIsPasswordUser] = useState(false);

  useEffect(() => {
    let unsubscribeShared: () => void;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setName(firebaseUser.displayName || '');
        setEmail(firebaseUser.email || '');
        setPhotoURL(firebaseUser.photoURL || '/default-avatar.png');
        setMfaEnabled(multiFactor(firebaseUser).enrolledFactors.length > 0);
        checkForPendingInvites(firebaseUser.uid);

        const usesPassword = firebaseUser.providerData.some(
          (provider: UserInfo) => provider.providerId === 'password'
        );
        setIsPasswordUser(usesPassword);

        unsubscribeShared = onSnapshot(doc(db, `users/${firebaseUser.uid}`), async (userSnap) => {
          const data = userSnap.data();
          const sharedWith = data?.sharedWith || [];

          const collaborators = await Promise.all(sharedWith.map(async (uid: string) => {
            const userDoc = await getDoc(doc(db, `users/${uid}`));
            return userDoc.exists()
              ? { uid, email: userDoc.data().email }
              : null;
          }));

          setSharedWithUsers(collaborators.filter(Boolean) as { uid: string; email: string }[]);
        });
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeShared) unsubscribeShared();
    };
  }, []);



  // const fetchSharedUserInfo = async (uid: string) => {
  //   const userDocRef = doc(db, `users/${uid}`);
  //   const userSnap = await getDoc(userDocRef); // ✅ Use getDoc, not getDocs

  //   const data = userSnap.data();
  //   const sharedWith = data?.sharedWith;

  //   if (sharedWith && sharedWith.length > 0) {
  //     const sharedUid = sharedWith[0]; // assuming 1:1 collaboration
  //     const sharedUserRef = doc(db, `users/${sharedUid}`);
  //     const sharedUserSnap = await getDoc(sharedUserRef);

  //     if (sharedUserSnap.exists()) {
  //       setSharedWithUser({
  //         uid: sharedUid,
  //         email: sharedUserSnap.data().email,
  //       });
  //     }
  //   } else {
  //     setSharedWithUser(null);
  //   }
  // };


  const checkForPendingInvites = async (uid: string) => {
    const invites = await getDocs(collection(db, `users/${uid}/incomingInvites`));
    const pending = invites.docs.find(doc => doc.data().status === 'pending');
    if (!pending) return;

    const inviteData = pending.data();
    const inviteRef = doc(db, `users/${uid}/incomingInvites/${pending.id}`);
    const notifyInviter = async (status: 'accepted' | 'declined') => {
      const authUser = auth.currentUser;

      if (!inviteData.fromUid) {
        console.error('Missing fromUid, cannot send notification');
        return;
      }

      const fromEmail = authUser?.email ?? email ?? 'unknown@user.com';
      const localTimestamp = new Date();

      //save to Firestore
      await addDoc(collection(db, `users/${inviteData.fromUid}/notifications`), {
        type: 'invite_response',
        status,
        fromEmail,
        timestamp: localTimestamp, // keep consistent with local history
      });

      toast.info(`${fromEmail} ${status} your invite.`);


    };





    const handleAccept = async () => {
      await updateDoc(inviteRef, { status: 'accepted' });

      // add the inviter to current users sharedWith
      await updateDoc(doc(db, `users/${uid}`), {
        sharedWith: arrayUnion(inviteData.fromUid),
      });

      // add current user to inviter's sharedWith (2 -directional shari)
      await updateDoc(doc(db, `users/${inviteData.fromUid}`), {
        sharedWith: arrayUnion(uid),
      });

      await notifyInviter('accepted');
      toast.dismiss();
      toast.success(`Now sharing with ${inviteData.fromEmail}`);
    };


    const handleDecline = async () => {
      await updateDoc(inviteRef, { status: 'declined' });
      await notifyInviter('declined');
      toast.dismiss();
      toast.info('Invite declined.');
    };


    toast.info(
      ({ closeToast }) => (
        <div>
          <p>📩 Invite from <strong>{inviteData.fromEmail}</strong></p>
          <button onClick={() => { handleAccept(); closeToast(); }} style={{ marginRight: '1rem' }}>✅ Accept</button>
          <button onClick={() => { handleDecline(); closeToast(); }}>❌ Decline</button>
        </div>
      ),
      { autoClose: false }
    );

  };


  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);

    try {
      const imageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      await updateProfile(user, { photoURL: url });
      await auth.currentUser?.reload(); // reload to reflect changes
      const refreshedUser = auth.currentUser;

      setPhotoURL(refreshedUser?.photoURL || url); // refresh ui
      toast.success('Profile photo updated!');
    } catch (error: any) {
      console.error('Upload error:', error.message || error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };






  const handleSave = async () => {
    if (!auth.currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      toast.success('Name updated!');
      setEditing(false);
    } catch {
      toast.error('Error saving changes.');
    }
  };

  const handleInvite = async () => {
    try {
      const allUsers = await getDocs(collection(db, 'users'));
      const targetDoc = allUsers.docs.find(doc => doc.data().email === inviteEmail);
      if (!targetDoc) throw new Error('User not found');

      const targetUid = targetDoc.id;
      await addDoc(collection(db, `users/${targetUid}/incomingInvites`), {
        fromUid: user.uid,
        fromEmail: user.email,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      setInviteStatus(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: any) {
      console.error(err);
      setInviteStatus(err.message || 'Failed to send invite');
    }
  };


  const handleStopCollaborating = async (collaboratorUid: string) => {
    if (!user) return;

    const currentRef = doc(db, `users/${user.uid}`);
    const sharedRef = doc(db, `users/${collaboratorUid}`);

    try {
      await updateDoc(currentRef, {
        sharedWith: arrayRemove(collaboratorUid),
      });

      await updateDoc(sharedRef, {
        sharedWith: arrayRemove(user.uid),
      });

      setSharedWithUsers(prev => prev.filter(u => u.uid !== collaboratorUid));
      toast.success('Collaboration ended.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to stop collaboration.');
    }
  };

  const reauthenticateUser = async () => {
    const password = prompt('Re-enter your password:');
    if (!user?.email || !password) throw new Error('Password required.');
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const sendVerificationCode = async () => {
    if (!user || !phoneNumber) return;

    try {
      await user.reload();
      await reauthenticateUser();

      // Clean up previous verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }

      // Ensure container is visible
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        toast.error('reCAPTCHA container missing. Please refresh the page.');
        return;
      }

      // Create verifier ONCE
      const verifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: (response: string) => {
            console.log('reCAPTCHA solved:', response);
          },
          'expired-callback': () => {
            console.warn('reCAPTCHA expired.');
          },
        }
      );



      window.recaptchaVerifier = verifier;
      await verifier.render();

      const session = await multiFactor(user).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      const verificationIdResult = await phoneAuthProvider.verifyPhoneNumber(
        {
          phoneNumber,
          session,
        },
        verifier
      );

      setVerificationId(verificationIdResult);
      toast.success('SMS code sent.');
    } catch (err: any) {
      console.error('SMS send failed:', err);
      toast.error(err.message || 'Failed to send SMS code.');
    }
  };




  const verifyCodeAndEnable2FA = async () => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      const assertion = PhoneMultiFactorGenerator.assertion(cred);
      if (!auth.currentUser) throw new Error('User not authenticated.');
      await multiFactor(auth.currentUser).enroll(assertion, 'Phone Number');
      setMfaEnabled(true);
      toast.success('2FA enabled successfully!');
    } catch (err: any) {
      console.error('Failed to enable 2FA:', err);
      toast.error('Code invalid or failed to enroll 2FA.');
    }
  };


  const handleDeleteAccount = () => {
    confirmAlert({
      title: 'Delete Your Account',
      message: '⚠️ Are you sure you want to permanently delete your account? This action cannot be undone.',
      buttons: [
        {
          label: 'Yes, Delete',
          onClick: async () => {
            try {
              if (!user?.email) throw new Error('Missing user email');
              const password = prompt('Re-enter your password to confirm:');
              if (!password) return;

              const credential = EmailAuthProvider.credential(user.email, password);
              await reauthenticateWithCredential(user, credential);
              await user.delete();
              toast.success('Account deleted.');
              window.location.href = '/';
            } catch (err: any) {
              toast.error(err.message || 'Failed to delete account.');
            }
          }
        },
        {
          label: 'Cancel',
          onClick: () => toast.info('Deletion cancelled')
        }
      ]
    });
  };

  console.log('Current user:', user);

  return (
    <div className="account-page">
      <div id="recaptcha-container" />

      <h2>{t('account.myAccount') || 'My Account'}</h2>

      <div className="account-header">
<div className="profile-image">
  {(!photoURL || photoURL === '/default-avatar.png') ? (
    <span className="fallback-text">{t('account.profilePhotoAlt') || 'Add picture'}</span>
  ) : (
    <img src={photoURL} alt={t('account.profilePhotoAlt') || 'Add picture'} />
  )}
</div>
        <div className="info">
          <h3>{name || t('account.defaultName') || 'Your Name'}</h3>
          <p>{email}</p>
        </div>
      </div>

      <div className="account-section collaborate-section">
        <div className="section-header">
          <h3>{t('account.personalDetails') || 'Personal Details'}</h3>
          {!editing && <button onClick={() => setEditing(true)}>{t('edit') || 'Edit'}</button>}
        </div>
        {editing && (
          <div className="edit-form">
            <label>
              {t('account.fullName') || 'Full Name'}:
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              {t('account.profilePhoto') || 'Profile Photo'}:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
              />
            </label>
            <label>
              {t('email') || 'Email'}:
              <input type="email" value={email} disabled />
            </label>
            <div className="action-buttons">
              <button className="save-btn" onClick={handleSave} disabled={uploading}>
                {uploading ? t('uploading') || 'Uploading...' : t('save') || 'Save'}
              </button>
              <button className="cancel-btn" onClick={() => setEditing(false)}>
                {t('cancel') || 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      {isPasswordUser && (
        <div className="account-section collaborate-section twofa-section">
          <h3>{t('account.twofaTitle') || 'Two-Factor Authentication'}</h3>
          {mfaEnabled ? (
            <p>{t('account.twofaEnabled') || '✅ 2FA is enabled on your account.'}</p>
          ) : (
            <>
              <div className="twofa-input-row">
                <input
                  type="tel"
                  placeholder={t('account.phonePlaceholder') || 'Phone Number (e.g. +386...)'}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button onClick={sendVerificationCode}>
                  {t('account.sendCode') || 'Send Code'}
                </button>
              </div>
              <div className="twofa-input-row">
                <input
                  type="text"
                  placeholder={t('account.enterCode') || 'Enter Code'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={verifyCodeAndEnable2FA}>
                  {t('account.verifyEnable') || 'Verify & Enable'}
                </button>
              </div>
            </>
          )}
        </div>
      )}


      <div className="account-section collaborate-section">
        <h3>{t('account.collaborateTitle') || 'Collaborate'}</h3>

        {sharedWithUsers.length > 0 && (
          <>
            <p className="collab-description">{t('account.currentlySharing') || 'You are currently sharing with'}:</p>
            <ul className="collab-list">
              {sharedWithUsers.map(({ email, uid }) => (
                <li key={uid} className="collab-item">
                  <strong>{email}</strong>
                  <button
                    className="collab-button stop-collab-button"
                    onClick={() => handleStopCollaborating(uid)}
                  >
                    {t('account.stopCollaborating') || 'Stop Collaborating'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="collab-input-group">
          <p className="collab-description">
            {t('account.collabDescription') || "Want to track finances with a partner, friend, or family member?..."}
          </p>
          <input
            type="email"
            className="collab-input"
            placeholder={t('account.emailPlaceholder') || 'e.g. partner@email.com'}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button className="collab-button" onClick={handleInvite}>
            {t('sendInvite') || 'Send Invite'}
          </button>
          {inviteStatus && <p className="invite-status">{inviteStatus}</p>}
        </div>
      </div>


      <div className="account-buttons">
        <button className="delete-account-outlined-btn" onClick={handleDeleteAccount}>
          <span className="delete-icon">❌</span> {t('account.deleteAccount') || 'Delete My Account'}
        </button>
      </div>
    </div>
  );
}