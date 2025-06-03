import { useState } from 'react';
import { collection, getDocs, query, where, updateDoc, addDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';
import './../styles/SetCategoryBudgetModal.css';
import { format } from 'date-fns';

export default function SetCategoryBudgetModal({ onClose }: { onClose: () => void }) {
    const [category, setCategory] = useState('');
    const [limit, setLimit] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [type, setType] = useState<'income' | 'expense'>('expense');

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user || !category || !limit) {
            toast.error('Missing fields');
            return;
        }

        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const q = query(budgetsRef, where('category', '==', category));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docRef = doc(db, 'users', user.uid, 'budgets', snapshot.docs[0].id);
            await updateDoc(docRef, {
                limit: Number(limit),
                currency,
                type,
                month: format(new Date(), 'yyyy-MM') 

            });
            toast.success(`Updated budget for ${category}`);
        } else {
            await addDoc(budgetsRef, {
                category,
                limit: Number(limit),
                currency,
                type,
                month: format(new Date(), 'yyyy-MM'), 
            });
            toast.success(`Created new budget for ${category}`);
        }

        onClose();
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h2>Set Category Budget</h2>

                <label>
                    Category:
                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">-- Select Category --</option>
                        <option value="groceries">Groceries</option>
                        <option value="home">Home</option>
                        <option value="eating out">Eating Out</option>
                        <option value="food delivery">Food Delivery</option>
                        <option value="coffee">Coffee</option>
                        <option value="car">Car</option>
                        <option value="health">Health</option>
                        <option value="sport">Sport</option>
                        <option value="subscriptions">Subscriptions</option>
                        <option value="tech">Tech</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="personal">Personal</option>
                        <option value="clothing">Clothing</option>
                        <option value="gifts">Gifts</option>
                        <option value="education">Education</option>
                        <option value="business">Business</option>
                        <option value="charity">Charity</option>
                        <option value="pets">Pets</option>
                    </select>
                </label>

                <label>
                    Limit:
                    <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} required />
                </label>
                <label>
                    Currency:
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        <option value="EUR">€ EUR</option>
                        <option value="USD">$ USD</option>
                        <option value="MKD">MKD</option>
                    </select>
                </label>
               

                <div className="form-buttons">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose} className="cancel">Cancel</button>
                </div>
            </div>
        </div>
    );
}
