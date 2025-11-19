import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";

const HowItWorks = () => {
  const stepsRef = useRef([]);
  stepsRef.current = [];

  const addToRefs = (el) => {
    if (el && !stepsRef.current.includes(el)) {
      stepsRef.current.push(el);
    }
  };

  useEffect(() => {
    let ctx = gsap.context(() => {
      stepsRef.current.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top bottom-=100",
              toggleActions: "play none none reverse",
              batch: true
            },
            delay: i * 0.2,
          }
        );
      });
    });
    
    return () => ctx.revert(); // Cleanup on unmount
  }, []);

  const steps = [
    { img: "/images/search.jpg", title: "Encuentra un servicio" },
    { img: "/images/contact.jpg", title: "Contacta al profesional" },
    { img: "/images/hire.jpg", title: "Confirma y paga el trabajo" },
  ];

  return (
    <section className="py-20 bg-white text-center max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold mb-12 text-gray-800">
        Cómo funciona
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step, i) => (
          <div key={i} ref={addToRefs} className="gsap-animated flex flex-col items-center">
            <img
              src={step.img}
              alt={step.title}
              className="w-full md:w-80 h-80 object-cover rounded-2xl mb-4 shadow-lg"
            />
            <h3 className="text-xl font-medium text-gray-700">{step.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
