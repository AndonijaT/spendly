import './../styles/Home.css';
import usePageTitle from '../hooks/usePageTitle';


function Home() {
     usePageTitle('Home');
    return (
        <div className="home">
            <div className="hero">
                <video className="bg-video" autoPlay muted loop>
                    <source src="/video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                <div className="hero-text">
                    <h1>The smarter way to manage money</h1>
                    <p>Spendly helps you track every expense, plan smarter budgets, and achieve your savings goals — all in one beautifully simple app.</p>
                    <button className="cta-button">Get started</button>
                </div>
            </div>
        </div>
    );
}

export default Home;