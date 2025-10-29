import React from "react";
import { Carousel } from "react-bootstrap";

const FeaturedWorks = () => {
  const works = [
    { img: "/images/work1.jpg", title: "Jardinería profesional" },
    { img: "/images/work2.jpg", title: "Plomería rápida" }, // esta imagen requiere Attribution
    { img: "/images/work3.jpg", title: "Pintura de interiores" },
  ];

  return (
    <section className="py-20 bg-white text-center max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold mb-12 text-gray-800">Trabajos destacados</h2>
      <Carousel>
        {works.map((w, i) => (
          <Carousel.Item key={i}>
            <img className="d-block w-full h-96 object-cover rounded-2xl" src={w.img} alt={w.title} />
            <Carousel.Caption>
              <h3 className="text-xl font-semibold">{w.title}</h3>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>
    </section>
  );
};

export default FeaturedWorks;
