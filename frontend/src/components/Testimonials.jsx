const Testimonials = () => {
  const testimonials = [
    { name: "Ana R.", text: "Excelente servicio, muy rápido y confiable." },
    { name: "Carlos M.", text: "Profesionales muy atentos y amables." },
    { name: "Lucía P.", text: "Recomendado, encontré al plomero perfecto." },
  ];

  return (
    <section className="py-20 bg-gray-50 text-center max-w-6xl mx-auto">
      <h2 className="text-3xl font-semibold mb-12 text-gray-800">Testimonios</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-xl transition-all"
          >
            <p className="text-gray-600 mb-4">"{t.text}"</p>
            <h4 className="text-gray-800 font-semibold">{t.name}</h4>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
