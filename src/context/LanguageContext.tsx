import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'sl';

interface LangContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        balance: 'Balance',
        income: 'Income',
        expense: 'Expense',
        cash: 'Cash',
        card: 'Card',
        add: 'Add',
        cancel: 'Cancel',
        addTransaction: 'Add Transaction',
        method: 'Method',
        amount: 'Amount (€)',
        category: 'Category',
        type: 'Type',
        salary: 'Salary',
        donation: 'Donation',
        other: 'Other',
        transactionHistory: 'Transaction History',
        close: 'Close',
        settings: 'Settings',
        language: 'Language',
        currency: 'Currency',
        erase: 'Erase All Transactions',
        privacy: 'Privacy Policy',
        terms: 'Terms of Use',
        userNotLoggedIn: "User not logged in",
        transactionAdded: "Transaction added!",
        errorSaving: "Error saving.",
        choose: "Choose",
        source: "Source",
        scholarship: "Scholarship",
        groceries: "Groceries",
        home: "Home",
        "eating out": "Eating Out",
        "food delivery": "Food Delivery",
        coffee: "Coffee",
        car: "Car",
        health: "Health",
        sport: "Sport",
        subscriptions: "Subscriptions",
        tech: "Tech",
        entertainment: "Entertainment",
        personal: "Personal",
        clothing: "Clothing",
        gifts: "Gifts",
        education: "Education",
        business: "Business",
        charity: "Charity",
        pets: "Pets",
        confirmErase: "Are you sure?",
eraseSuccess: "All transactions erased.",
yes: "Yes",
ok: "OK"


    },
    sl: {
        balance: 'Stanje',
        income: 'Prihodek',
        expense: 'Strošek',
        cash: 'Gotovina',
        card: 'Kartica',
        add: 'Dodaj',
        cancel: 'Prekliči',
        addTransaction: 'Dodaj transakcijo',
        method: 'Način',
        amount: 'Znesek (€)',
        category: 'Kategorija',
        type: 'Tip',
        salary: 'Plača',
        donation: 'Donacija',
        other: 'Drugo',
        transactionHistory: 'Zgodovina transakcij',
        close: 'Zapri',
        settings: 'Nastavitve',
        language: 'Jezik',
        currency: 'Valuta',
        erase: 'Izbriši vse transakcije',
        privacy: 'Politika zasebnosti',
        terms: 'Pogoji uporabe',
        userNotLoggedIn: "Uporabnik ni prijavljen",
        transactionAdded: "Transakcija dodana!",
        errorSaving: "Napaka pri shranjevanju.",
        choose: "Izberi",
        source: "Vir",
        scholarship: "Štipendija",
        deleteAll: "Izbriši vse transakcije",
        deleteAllConfirm: "Ali ste prepričani, da želite izbrisati vse transakcije?",
        deleteAllSuccess: "Vse transakcije so izbrisane.",
        deleteAllError: "Napaka pri brisanju transakcij.",
        deleteAllWarning: "To dejanje je nepovratno. Ste prepričani?",
        deleteAllWarningTitle: "Opozorilo",
        deleteAllWarningMessage: "To dejanje je nepovratno. Ste prepričani, da želite izbrisati vse transakcije?",
        deleteAllWarningConfirm: "Da, izbriši vse",
        deleteAllWarningCancel: "Prekliči",
        deleteAllWarningSuccess: "Vse transakcije so izbrisane.",
        deleteAllWarningError: "Napaka pri brisanju transakcij.",
        groceries: "Živila",
        home: "Dom",
        "eating out": "Jesti zunaj",
        "food delivery": "Dostava hrane",
        coffee: "Kava",
        car: "Avto",
        health: "Zdravje",
        sport: "Šport",
        subscriptions: "Naročnine",
        tech: "Tehnologija",
        entertainment: "Zabava",
        personal: "Osebno",
        clothing: "Oblačila",
        gifts: "Darila",
        education: "Izobraževanje",
        business: "Posel",
        charity: "Dobrodelnost",
        pets: "Hišni ljubljenčki",
        confirmErase: "Ali ste prepričani?",
eraseSuccess: "Vse transakcije so bile izbrisane.",
yes: "Da",
ok: "V redu"

    }
};

const LanguageContext = createContext<LangContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const t = (key: string) => translations[language][key] || key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
