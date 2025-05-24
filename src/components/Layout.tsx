import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import AuthHandler from './AuthHandler'; // ✅ import it

function Layout() {
    return (
        <>
            <AuthHandler /> {/* ✅ this will handle sign-in results */}
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    );
}

export default Layout;
