// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FaSearch,
  FaFilter,
  FaStar,
  FaSortAmountDown,
  FaMoneyBillWave,
  FaBriefcase,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaUser
} from "react-icons/fa";
import { API_URL } from "../api/client";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [services, setServices] = useState([]);
  const [skills, setSkills] = useState([]); // All available skills/categories
  const [selectedCategories, setSelectedCategories] = useState([]); // Selected category IDs
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [totalResults, setTotalResults] = useState(0);

  // Fetch all skills/categories
  const fetchSkills = async () => {
    try {
      const res = await fetch(`${API_URL}/skills/`);
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setSkills([]);
    }
  };

  // Fetch services with filters
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: query || "",
        sort_by: sortBy,
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(minRating && { min_rating: minRating }),
      });

      const res = await fetch(`${API_URL}/services/search?${params}`);
      if (!res.ok) throw new Error("Error en la solicitud al backend");
      let data = await res.json();
      data = Array.isArray(data) ? data : [];

      // Filter by selected categories (client-side)
      if (selectedCategories.length > 0) {
        data = data.filter(service => {
          // Check if service has skill_id or skill object
          const serviceSkillId = service.skill_id || service.skill?.id;
          return selectedCategories.includes(serviceSkillId);
        });
      }

      setTotalResults(data.length);
      setServices(data);
      setCurrentPage(1); // Reset to first page on new search
    } catch (err) {
      console.error("Error al buscar servicios:", err);
      setServices([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchServices();
  }, []);

  // Re-fetch when categories change
  useEffect(() => {
    if (skills.length > 0) {
      fetchServices();
    }
  }, [selectedCategories]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  // Toggle category selection
  const toggleCategory = (skillId) => {
    setSelectedCategories(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSortBy("relevance");
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = services.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(services.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get skill name by ID
  const getSkillName = (skillId) => {
    const skill = skills.find(s => s.id === skillId);
    return skill ? skill.name : "General";
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            Encuentra el Servicio Perfecto
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora entre cientos de profesionales listos para ayudarte con tu próximo proyecto.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <FaFilter className="mr-2 text-blue-600" />
                  Filtros
                </h2>
                {(selectedCategories.length > 0 || minPrice || maxPrice || minRating || query) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    <FaTimes className="mr-1" />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorías</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {skills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(skill.id)}
                        onChange={() => toggleCategory(skill.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{skill.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Rango de Precio</h3>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Calificación Mínima</h3>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Cualquier calificación</option>
                  <option value="4">⭐ 4 estrellas o más</option>
                  <option value="3">⭐ 3 estrellas o más</option>
                  <option value="2">⭐ 2 estrellas o más</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ordenar por</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                  <option value="rating_desc">Mejor Calificados</option>
                </select>
              </div>

              <button
                onClick={fetchServices}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                <FaFilter className="mr-2" />
                Aplicar Filtros
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 text-xl" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, descripción o categoría..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-lg"
                  />
                </div>
              </form>
            </div>

            {/* Results Count */}
            {!loading && (
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold">{indexOfFirstItem + 1}</span> -
                  <span className="font-semibold"> {Math.min(indexOfLastItem, totalResults)}</span> de
                  <span className="font-semibold"> {totalResults}</span> resultados
                </p>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(catId => (
                      <span
                        key={catId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {getSkillName(catId)}
                        <button
                          onClick={() => toggleCategory(catId)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Results Section */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : currentServices.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                <FaSearch className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No se encontraron servicios</h3>
                <p className="mt-1 text-gray-500">Intenta ajustar tus filtros o busca con otros términos.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {currentServices.map((s) => (
                    <div
                      key={s.id}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => navigate(`/service/${s.id}`)}
                    >
                      {/* Card Header */}
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <FaBriefcase className="text-white text-4xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                        {s.skill && (
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                            <span className="text-xs font-semibold text-gray-700">{s.skill.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        {/* Vendor Profile Picture and Title */}
                        <div className="flex items-start mb-3">
                          {/* Vendor Avatar */}
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-12 h-12 rounded-full border-2 border-gray-200 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden">
                              {s.vendor?.profile_picture_url ? (
                                <img
                                  src={s.vendor.profile_picture_url}
                                  alt={s.vendor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FaUser className="text-white text-lg" />
                              )}
                            </div>
                          </div>

                          {/* Title and Vendor Name */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {s.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Por {s.vendor?.name || "Vendedor"}
                            </p>
                          </div>

                          {/* Rating Badge */}
                          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg ml-2 flex-shrink-0">
                            <FaStar className="text-yellow-400 text-xs mr-1" />
                            <span className="text-xs font-semibold text-yellow-700">
                              {s.avg_rating ? s.avg_rating.toFixed(1) : "Nuevo"}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                          {s.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-green-600 font-bold text-xl">
                              <FaMoneyBillWave className="mr-1 text-sm" />
                              ${s.price}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/service/${s.id}`);
                            }}
                            className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-300 shadow-sm hover:shadow-md"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm'
                        } transition-colors`}
                    >
                      <FaChevronLeft />
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === pageNumber
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm'
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm'
                        } transition-colors`}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
