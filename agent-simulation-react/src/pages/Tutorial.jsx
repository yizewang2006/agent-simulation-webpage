import Header from "../components/shared/Header.jsx";
import Footer from "../components/shared/Footer.jsx";
import "../styles/simulation.css";

export default function Tutorial() {
  return (
    <div className="simulation-page">
      <Header title="Tutorial" />
      <main className="landing-content">
        <h1 className="landing-title">Tutorial / Manual</h1>
      </main>
      <Footer />
    </div>
  );
}
