import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import './../styles/ReviewsSection.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Navigation } from 'swiper/modules'; // ← ADD Navigation
import 'swiper/css';

type Review = {
    id: string;
    name: string;
    comment: string;
    timestamp?: { seconds: number };
};

export default function ReviewsSection() {
    const [comment, setComment] = useState('');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [user, setUser] = useState(() => auth.currentUser);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Review[];
            setReviews(data);
        };

        fetchReviews();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !comment.trim()) return;

        await addDoc(collection(db, 'reviews'), {
            uid: user.uid,
            name: user.displayName || user.email,
            comment,
            timestamp: serverTimestamp(),
        });

        setComment('');
        const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const updated = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Review[];
        setReviews(updated);
    };

    return (
        <section className="reviews-section">
            <h2>Why our users use this app</h2>

            <Swiper
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView={3}
                loop
                autoplay={{ delay: 4000 }}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                modules={[EffectCoverflow, Autoplay, Navigation]}
                className="review-carousel"
            ><div className="swiper-button-prev custom-arrow">←</div>
<div className="swiper-button-next custom-arrow">→</div>

                {reviews.map((r) => (
                    <SwiperSlide key={r.id} className="review-slide">
                        <div className="review-card">
                            <strong>{r.name}</strong>
                            <p>{r.comment}</p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {user ? (
                <form onSubmit={handleSubmit} className="review-form">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Leave your review..."
                        rows={3}
                        required
                    />
                    <button type="submit">Submit Review</button>
                </form>
            ) : (
                <p className="guest-note">Log in to leave a review.</p>
            )}
        </section>
    );
}
