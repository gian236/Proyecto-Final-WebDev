// src/pages/Onboarding.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Onboarding({ userId, onComplete }) {
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [services, setServices] = useState([{ title: "", description: "", price: "", skill_id: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Traer skills desde backend
  useEffect(() => {
    fetch("http://localhost:8000/skills/")
      .then(res => res.json())
      .then(data => setSkills(data))
      .catch(() => setError("No se pudieron cargar las skills"));
  }, []);

  // Manejo de selección de skills
  const handleSkillChange = (skillId) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Manejo de cambios en servicios
  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const newServices = [...services];
    newServices[index][name] = value;
    setServices(newServices);
  };

  // Agregar un servicio extra
  const addService = () => {
    setServices([...services, { title: "", description: "", price: "", skill_id: "" }]);
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Asociar todas las skills en un solo POST
      if (selectedSkills.length > 0) {
        const res = await fetch(`http://localhost:8000/users/${userId}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill_ids: selectedSkills }), // <-- enviamos objeto con skill_ids
        });

        if (!res.ok) throw new Error("No se pudieron asignar las skills");
      }

      // 2️⃣ Crear servicios
      for (let service of services) {
        if (!service.title || !service.price || !service.skill_id) continue;
        await fetch("http://localhost:8000/services/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: userId,
            title: service.title,
            description: service.description,
            price: parseFloat(service.price),
            skill_id: parseInt(service.skill_id),
            is_active: true,
          }),
        });
      }

      // 3️⃣ Obtener datos del usuario y guardar sesión
      const userRes = await fetch(`http://localhost:8000/users/${userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        login("fake-jwt-token", userData);
      }

      // 4️⃣ Finalizar onboarding
      onComplete();
    } catch (err) {
      console.error(err);
      setError("Hubo un error al guardar los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Bienvenido, configura tu perfil de vendedor</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Selección de skills */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Selecciona tus habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(skills) && skills.map(skill => (
              <label
                key={skill.id}
                className={`px-3 py-1 rounded-full border cursor-pointer ${selectedSkills.includes(skill.id) ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
              >
                <input
                  type="checkbox"
                  value={skill.id}
                  className="hidden"
                  checked={selectedSkills.includes(skill.id)}
                  onChange={() => handleSkillChange(skill.id)}
                />
                {skill.name}
              </label>
            ))}
          </div>
        </div>

        {/* Servicios iniciales */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Servicios iniciales</h3>
          {services.map((service, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <input
                type="text"
                name="title"
                placeholder="Título del servicio"
                value={service.title}
                onChange={(e) => handleServiceChange(index, e)}
                className="w-full mb-2 p-2 border rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Descripción"
                value={service.description}
                onChange={(e) => handleServiceChange(index, e)}
                className="w-full mb-2 p-2 border rounded"
              />
              <input
                type="number"
                name="price"
                placeholder="Precio"
                value={service.price}
                onChange={(e) => handleServiceChange(index, e)}
                className="w-full mb-2 p-2 border rounded"
                required
              />
              <select
                name="skill_id"
                value={service.skill_id}
                onChange={(e) => handleServiceChange(index, e)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecciona skill</option>
                {Array.isArray(skills) && skills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            </div>
          ))}

          <button type="button" onClick={addService} className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            + Agregar otro servicio
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Finalizar configuración"}
        </button>
      </form>
    </div>
  );
}
