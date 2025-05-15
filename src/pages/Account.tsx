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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import '../styles/AccountPage.css';

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        recaptchaWidgetId?: number;
    }
}

function Account() {
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setName(firebaseUser.displayName || '');
                setEmail(firebaseUser.email || '');
                setPhotoURL(firebaseUser.photoURL || '/default-avatar.png');
                setMfaEnabled(multiFactor(firebaseUser).enrolledFactors.length > 0);
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

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
            auth, // ✅ first argument = Auth instance
            'recaptcha-container', // ✅ second = DOM element ID
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
                await reauthenticateUser(); // must re-authenticate before getting MFA session

                setupRecaptcha();

                const session = await multiFactor(user).getSession(); // ← this creates MFA session
                const phoneOptions = {
                    phoneNumber,
                    session,
                };

                const phoneAuthProvider = new PhoneAuthProvider(auth);
                const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneOptions, window.recaptchaVerifier!);
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

        return (
            <div className="account-page">
                <h2>My Account</h2>

                <div className="account-header">
                    <img src={photoURL || '/default-avatar.png'} alt="Profile" className="profile-image" />
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
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                            </label>
                            <label>
                                Profile Photo:
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
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

                <div className="account-section">
                    <h3>Two-Factor Authentication (Optional)</h3>
                    {mfaEnabled ? (
                        <p>✅ 2FA is enabled on your account.</p>
                    ) : (
                        <>
                            <input
                                type="tel"
                                placeholder="Phone Number (e.g. +386...)"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <button onClick={sendVerificationCode}>Send Verification Code</button>

                            <input
                                type="text"
                                placeholder="Enter SMS Code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            <button onClick={verifyCodeAndEnable2FA}>Verify & Enable 2FA</button>
                            <div id="recaptcha-container" style={{ height: '100px' }} />
                        </>
                    )}
                </div>
            </div>
        );
    }

    export default Account;
