// src/pages/Landing.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import HowItWorks from "../components/HowItWorks";
import FeaturedWorks from "../components/FeaturedWorks";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="Landing">
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
