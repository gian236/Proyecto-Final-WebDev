import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import FeaturedWorks from "./components/FeaturedWorks";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <FeaturedWorks />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}

export default App;
