import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";


const services = [
  { img: "/images/service1.svg", name: "Plomería" },
  { img: "/images/service2.svg", name: "Limpieza" },
  { img: "/images/service3.svg", name: "Pintura" },
  { img: "/images/service4.svg", name: "Carpintería" },
];

const Services = () => {
  const servicesRef = useRef([]);
  servicesRef.current = [];

  const addToRefs = (el) => {
    if (el && !servicesRef.current.includes(el)) {
      servicesRef.current.push(el);
    }
  };

  useEffect(() => {
    let ctx = gsap.context(() => {
      servicesRef.current.forEach((el, i) => {
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
            delay: i * 0.15,
          }
        );
      });
    });
    
    return () => ctx.revert(); // Cleanup on unmount
  }, []);

  return (
    <section id="services" className="py-20 bg-gray-50 text-center">
      <h2 className="text-3xl font-semibold mb-12 text-gray-800">
        Servicios populares
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {services.map((s, i) => (
          <div
            key={i}
            ref={addToRefs}
            className="gsap-animated bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all"
          >
            <img
              src={s.img}
              alt={s.name}
              className="w-full h-64 md:h-72 object-cover"
            />
            <p className="text-gray-700 text-lg py-4">{s.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
