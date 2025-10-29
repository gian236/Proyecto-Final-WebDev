import React from "react";
import { Accordion } from "react-bootstrap";

const FAQ = () => {
  const faqs = [
    { q: "¿Cómo contrato un profesional?", a: "Busca el servicio que necesitas, revisa perfiles y contacta al profesional." },
    { q: "¿Qué métodos de pago hay?", a: "Puedes pagar directamente en efectivo o usar la plataforma para pagos seguros." },
    { q: "¿Puedo contratar servicios recurrentes?", a: "Sí, puedes programar servicios semanales o mensuales según tu necesidad." },
  ];

  return (
    <section className="py-20 bg-gray-50 max-w-4xl mx-auto">
      <h2 className="text-3xl font-semibold mb-12 text-center text-gray-800">Preguntas frecuentes</h2>
      <Accordion>
        {faqs.map((f, i) => (
          <Accordion.Item eventKey={i.toString()} key={i}>
            <Accordion.Header>{f.q}</Accordion.Header>
            <Accordion.Body>{f.a}</Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQ;
