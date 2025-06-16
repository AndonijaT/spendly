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
    signOut,
    getAuth
} from 'firebase/auth';
import {
    collection,
    getDocs,
    getDoc,
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

declare global {
    interface Window {
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setName(firebaseUser.displayName || '');
                setEmail(firebaseUser.email || '');
                setPhotoURL(firebaseUser.photoURL || '/default-avatar.png');
                setMfaEnabled(multiFactor(firebaseUser).enrolledFactors.length > 0);
                checkForPendingInvites(firebaseUser.uid);
            }
        });
        return () => unsubscribe();
    }, []);
useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
        const snap = await getDocs(collection(db, `users/${user.uid}/notifications`));
        snap.forEach(doc => {
            const data = doc.data();
            if (data.type === 'invite_response') {
                toast.info(`📬 ${data.fromEmail} ${data.status} your invite.`);
            }
        });
    };

    checkNotifications();
}, [user]);

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

    await addDoc(collection(db, `users/${inviteData.fromUid}/notifications`), {
        type: 'invite_response',
        status,
        fromEmail,
        timestamp: serverTimestamp(),
    });
};




   const handleAccept = async () => {
    await updateDoc(inviteRef, { status: 'accepted' });
    await updateDoc(doc(db, `users/${uid}`), {
        sharedWith: arrayUnion(inviteData.fromUid),
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
                <button onClick={handleAccept} style={{ marginRight: '1rem' }}>✅ Accept</button>
                <button onClick={handleDecline}>❌ Decline</button>
            </div>
        ),
        { autoClose: false }
    );
};


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
        } catch {
            toast.error('Failed to upload photo.');
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

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
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
            setupRecaptcha();
            const session = await multiFactor(user).getSession();
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            const verificationId = await phoneAuthProvider.verifyPhoneNumber(
                { phoneNumber, session },
                window.recaptchaVerifier!
            );
            setVerificationId(verificationId);
            toast.success('SMS code sent.');
        } catch (err: any) {
            console.error('SMS send failed:', err);
            toast.error(err.message);
        }
    };

    const verifyCodeAndEnable2FA = async () => {
        try {
            const cred = PhoneAuthProvider.credential(verificationId, code);
            const assertion = PhoneMultiFactorGenerator.assertion(cred);
            await multiFactor(auth.currentUser!).enroll(assertion, 'Phone Number');
            setMfaEnabled(true);
            toast.success('2FA enabled successfully!');
        } catch (err: any) {
            console.error('Failed to enable 2FA:', err);
            toast.error('Code invalid or failed to enroll 2FA.');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out.');
            window.location.href = '/';
        } catch {
            toast.error('Sign out failed.');
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
                            <input value={name} onChange={(e) => setName(e.target.value)} />
                        </label>
                        <label>
                            Profile Photo:
                            <input type="file" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} />
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

            <div className="account-section">
                <h3>Two-Factor Authentication</h3>
                {mfaEnabled ? (
                    <p>2FA is enabled.</p>
                ) : (
                    <>
                        <input
                            type="tel"
                            placeholder="Phone Number (e.g. +386...)"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <button onClick={sendVerificationCode}>Send Code</button>
                        <input
                            type="text"
                            placeholder="Enter Code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button onClick={verifyCodeAndEnable2FA}>Verify & Enable</button>
                        <div id="recaptcha-container" />
                    </>
                )}
            </div>

            <div className="account-section">
                <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
            </div>

            <div className="account-section">
                <h3>Collaborate</h3>
                <p>Invite someone to co-manage your account.</p>
                <input
                    type="email"
                    placeholder="Enter email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button onClick={handleInvite}>Send Invite</button>
                <p>{inviteStatus}</p>
            </div>
        </div>
    );
}
