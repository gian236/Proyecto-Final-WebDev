import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Hero = () => {
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Animaciones GSAP al montar
    gsap.fromTo(
      titleRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", immediateRender: false }
    );

    gsap.fromTo(
      subtitleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power3.out", immediateRender: false }
    );

    gsap.fromTo(
      buttonRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, delay: 0.6, ease: "back.out(1.7)", immediateRender: false }
    );
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video de fondo */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

      {/* Overlay oscuro */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40 pointer-events-none"></div>

      {/* Contenido del Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 text-center">
        <h1 ref={titleRef} className="text-5xl md:text-6xl font-bold mb-4">
          Encuentra tu trabajador ideal
        </h1>
        <p ref={subtitleRef} className="text-lg md:text-xl max-w-xl mb-6">
          Conecta con profesionales de servicios domésticos y técnicos de manera rápida, segura y confiable.
        </p>
        <button
          ref={buttonRef}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-all duration-300"
        >
          Comienza ahora
        </button>
      </div>
    </section>
  );
};

export default Hero;
