// src/pages/Home.jsx
import React, { useEffect, useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
            const params = new URLSearchParams({
            query: query || "",  // 👈 asegura que query nunca sea null
            sort_by: sortBy,
            ...(minPrice && { min_price: minPrice }),
            ...(maxPrice && { max_price: maxPrice }),
            ...(minRating && { min_rating: minRating }),
            });


      const res = await fetch(`http://localhost:8000/services/search?${params}`);
      if (!res.ok) throw new Error("Error en la solicitud al backend");
      const data = await res.json();

      // Asegurar que sea un array
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al buscar servicios:", err);
      setServices([]); // previene crash en map()
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Buscar Servicios
      </h1>

      {/* 🧭 Filtros */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-white p-4 rounded-2xl shadow"
      >
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border rounded-xl p-2 col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="number"
          placeholder="Precio mínimo"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border rounded-xl p-2"
        />
        <input
          type="number"
          placeholder="Precio máximo"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border rounded-xl p-2"
        />

        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="border rounded-xl p-2"
        >
          <option value="">Rating mínimo</option>
          <option value="1">⭐ 1+</option>
          <option value="2">⭐ 2+</option>
          <option value="3">⭐ 3+</option>
          <option value="4">⭐ 4+</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-xl p-2"
        >
          <option value="relevance">Relevancia</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="rating_desc">Rating más alto</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white rounded-xl p-2 hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>

      {/* 📦 Resultados */}
      {loading ? (
        <p className="text-center text-gray-500">Cargando...</p>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-500">No se encontraron resultados</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white shadow-md rounded-2xl p-4 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-blue-600">{s.title}</h3>
              <p className="text-gray-700 mt-1">{s.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                Skill ID: {s.skill_id || "N/A"}
              </p>
              <p className="text-lg font-semibold text-green-600 mt-2">
                ${s.price}
              </p>
              <p className="text-yellow-500">
                ⭐ {s.avg_rating ? s.avg_rating.toFixed(1) : "0.0"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
