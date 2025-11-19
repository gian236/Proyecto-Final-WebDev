// src/pages/Job.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import {
    FaStar,
    FaMoneyBillWave,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaBriefcase,
    FaArrowLeft,
    FaCheckCircle,
    FaClock,
    FaTag,
    FaEdit,
    FaTrash,
    FaSave,
    FaTimes
} from "react-icons/fa";

export default function Job() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        price: "",
        skill_id: "",
        image_url: "",
    });
    const [userSkills, setUserSkills] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [userJob, setUserJob] = useState(null);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [showHireModal, setShowHireModal] = useState(false);
    const [hireDate, setHireDate] = useState("");

    // Check if current user is the owner of this service
    const isOwner = authUser && service && authUser.id === service.vendor.id;

    useEffect(() => {
        fetchServiceDetails();
        fetchReviews();
        if (authUser) {
            fetchUserSkills();
        }
    }, [serviceId, authUser]);

    useEffect(() => {
        if (authUser && service) {
            checkUserJob();
        }
    }, [authUser, service]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`http://localhost:8000/reviews/service/${serviceId}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    const checkUserJob = async () => {
        if (!authUser) return;
        try {
            let url = `http://localhost:8000/jobs/contractor/${authUser.id}`;
            if (isOwner) {
                url = `http://localhost:8000/jobs/vendor/${authUser.id}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const jobs = await res.json();
                const job = jobs
                    .filter(j => j.service.id === parseInt(serviceId))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                if (job) setUserJob(job);
            }
        } catch (err) {
            console.error("Error checking user job:", err);
        }
    };

    const fetchUserSkills = async () => {
        if (!authUser) return;
        try {
            const res = await fetch(`http://localhost:8000/users/${authUser.id}/skills`);
            if (!res.ok) throw new Error('Error al cargar skills');
            const data = await res.json();
            setUserSkills(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error al cargar skills del usuario:', err);
            setUserSkills([]);
        }
    };

    const fetchServiceDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/services/${serviceId}`);
            if (!res.ok) {
                throw new Error("No se pudo cargar el servicio");
            }
            const data = await res.json();
            setService(data);
            setEditForm({
                title: data.title,
                description: data.description,
                price: data.price,
                skill_id: data.skill_id || "",
                image_url: data.image_url || "",
            });
        } catch (err) {
            console.error("Error al cargar servicio:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContactVendor = () => {
        setShowContactModal(true);
    };

    const handleHireClick = () => {
        if (!authUser) {
            alert("Debes iniciar sesión para contratar");
            navigate("/login");
            return;
        }
        if (userJob && userJob.status !== 'cancelado' && userJob.status !== 'completado') {
            alert("Ya tienes un contrato activo para este servicio.");
            return;
        }
        setShowHireModal(true);
    };

    const confirmHire = async () => {
        if (!hireDate) {
            alert("Por favor selecciona una fecha");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/jobs/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contractor_id: authUser.id,
                    vendor_id: service.vendor.id,
                    service_id: service.id,
                    status: "pendiente",
                    start_date: hireDate,
                    end_date: hireDate,
                    total_amount: service.price
                })
            });

            if (!res.ok) throw new Error("Error al contratar");

            const job = await res.json();
            setUserJob(job);
            setShowHireModal(false);
            alert("¡Solicitud enviada! Espera a que el vendedor acepte.");
        } catch (err) {
            console.error("Error hiring service:", err);
            alert("No se pudo contratar el servicio");
        }
    };

    const handleAcceptJob = async () => {
        if (!userJob) return;
        try {
            const res = await fetch(`http://localhost:8000/jobs/${userJob.id}/accept`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: authUser.id })
            });
            if (!res.ok) throw new Error("Error al aceptar");
            const updatedJob = await res.json();
            setUserJob(updatedJob);
            alert("Has aceptado el trabajo.");
        } catch (err) {
            console.error(err);
            alert("Error al aceptar el trabajo");
        }
    };

    const handleCompleteJob = async () => {
        if (!userJob) return;
        try {
            const res = await fetch(`http://localhost:8000/jobs/${userJob.id}/complete`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: authUser.id })
            });
            if (!res.ok) throw new Error("Error al completar");
            const updatedJob = await res.json();
            setUserJob(updatedJob);
            if (updatedJob.status === 'completado') {
                alert("¡Trabajo completado exitosamente!");
            } else {
                alert("Has confirmado la finalización. Esperando a la otra parte.");
            }
        } catch (err) {
            console.error(err);
            alert("Error al completar el trabajo");
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!userJob) return;

        try {
            const res = await fetch("http://localhost:8000/reviews/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_id: userJob.id,
                    rating: parseInt(newReview.rating),
                    comment: newReview.comment
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error al enviar reseña");
            }

            await fetchReviews();
            await fetchServiceDetails();
            setNewReview({ rating: 5, comment: "" });
            alert("¡Gracias por tu reseña!");
        } catch (err) {
            console.error("Error submitting review:", err);
            alert(err.message);
        }
    };

    const handleEditService = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`http://localhost:8000/services/${serviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editForm.title,
                    description: editForm.description,
                    price: parseFloat(editForm.price),
                    skill_id: parseInt(editForm.skill_id),
                    image_url: editForm.image_url,
                }),
            });
            if (!res.ok) throw new Error("Error al actualizar servicio");
            await fetchServiceDetails();
            setIsEditing(false);
            alert("Servicio actualizado exitosamente");
        } catch (err) {
            console.error("Error al actualizar servicio:", err);
            alert("No se pudo actualizar el servicio");
        }
    };

    const handleDeleteService = async () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este servicio?")) return;

        try {
            const res = await fetch(`http://localhost:8000/services/${serviceId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar servicio");
            alert("Servicio eliminado exitosamente");
            navigate("/profile");
        } catch (err) {
            console.error("Error al eliminar servicio:", err);
            alert("No se pudo eliminar el servicio");
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen font-sans">
                <Navbar />
                <div className="pt-24 flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="bg-gray-50 min-h-screen font-sans">
                <Navbar />
                <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center py-16 bg-white rounded-2xl border border-red-200">
                        <h3 className="text-lg font-medium text-red-900">Error al cargar el servicio</h3>
                        <p className="mt-1 text-red-600">{error || "Servicio no encontrado"}</p>
                        <button
                            onClick={() => navigate("/home")}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" /> Volver a búsqueda
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/home")}
                    className="mb-6 inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                    <FaArrowLeft className="mr-2" /> Volver a búsqueda
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Service Header */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            {/* Hero Image/Gradient */}
                            {/* Hero Image/Gradient */}
                            <div className="h-64 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center relative overflow-hidden">
                                {service.image_url ? (
                                    <img
                                        src={service.image_url}
                                        alt={service.title}
                                        className="w-full h-full object-cover absolute inset-0"
                                    />
                                ) : (
                                    <FaBriefcase className="text-white text-6xl opacity-30" />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24">
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                className="text-3xl font-bold text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg w-full mb-2 placeholder-white/70"
                                                placeholder="Título del servicio"
                                            />
                                            {/* Image Upload in Edit Mode */}
                                            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                alert("La imagen no debe superar los 5MB");
                                                                return;
                                                            }
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setEditForm({ ...editForm, image_url: reader.result });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50"
                                                />
                                                {editForm.image_url && (
                                                    <button
                                                        onClick={() => setEditForm({ ...editForm, image_url: "" })}
                                                        className="text-white hover:text-red-300"
                                                        title="Eliminar imagen"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{service.title}</h1>
                                    )}
                                    {service.skill && (
                                        <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mt-2">
                                            <FaTag className="text-white text-sm mr-2" />
                                            <span className="text-white text-sm font-medium">{service.skill.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-lg">
                                            <FaStar className="text-yellow-400 mr-2" />
                                            <span className="text-lg font-bold text-yellow-700">
                                                {service.avg_rating ? service.avg_rating.toFixed(1) : "Nuevo"}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-green-600">
                                            <FaMoneyBillWave className="mr-2 text-xl" />
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                    className="text-3xl font-bold border-2 border-green-300 rounded-lg px-3 py-1 w-32"
                                                    placeholder="Precio"
                                                />
                                            ) : (
                                                <span className="text-3xl font-bold">${service.price}</span>
                                            )}
                                        </div>
                                    </div>
                                    {service.is_active && !isEditing && (
                                        <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                            <FaCheckCircle className="mr-2" />
                                            <span className="font-medium">Disponible</span>
                                        </div>
                                    )}
                                    {isEditing && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <FaSave className="mr-2" />
                                                Guardar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditForm({
                                                        title: service.title,
                                                        description: service.description,
                                                        price: service.price,
                                                        skill_id: service.skill_id || "",
                                                        image_url: service.image_url || "",
                                                    });
                                                }}
                                                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                            >
                                                <FaTimes className="mr-2" />
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción del Servicio</h2>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="6"
                                            placeholder="Descripción del servicio"
                                        />
                                    ) : (
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {service.description || "Sin descripción disponible"}
                                        </p>
                                    )}
                                </div>

                                {/* Reviews Section */}
                                <div className="border-t border-gray-200 mt-8 pt-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Reseñas y Calificaciones</h2>

                                    {/* Reviews List */}
                                    <div className="space-y-6 mb-8">
                                        {reviews.length > 0 ? (
                                            reviews.map((review) => (
                                                <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                                                    <div className="flex items-center mb-2">
                                                        <div className="flex text-yellow-400 mr-2">
                                                            {[...Array(5)].map((_, i) => (
                                                                <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">{review.comment}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">Aún no hay reseñas para este servicio.</p>
                                        )}
                                    </div>

                                    {/* Add Review Form */}
                                    {!isOwner && userJob && userJob.status === 'completado' && (
                                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Escribe una reseña</h3>
                                            <form onSubmit={handleSubmitReview}>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                                                    <div className="flex space-x-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                type="button"
                                                                key={star}
                                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                                className={`text-2xl focus:outline-none transition-colors ${star <= newReview.rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                                                                    }`}
                                                            >
                                                                <FaStar />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Comentario</label>
                                                    <textarea
                                                        value={newReview.comment}
                                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        rows="3"
                                                        placeholder="Comparte tu experiencia..."
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    Publicar Reseña
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {!isOwner && !userJob && (
                                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                                            <p className="text-gray-600">Contrata este servicio para poder dejar una reseña.</p>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 mt-6 pt-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Detalles Adicionales</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center text-gray-600 mb-1">
                                                    <FaClock className="mr-2 text-sm" />
                                                    <span className="text-sm font-medium">Publicado</span>
                                                </div>
                                                <p className="text-gray-900 font-semibold">
                                                    {new Date(service.created_at).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-center text-gray-600 mb-1">
                                                    <FaTag className="mr-2 text-sm" />
                                                    <span className="text-sm font-medium">Categoría</span>
                                                </div>
                                                {isEditing && isOwner ? (
                                                    <select
                                                        value={editForm.skill_id}
                                                        onChange={(e) => setEditForm({ ...editForm, skill_id: e.target.value })}
                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                                                        required
                                                    >
                                                        <option value="">Selecciona una skill</option>
                                                        {userSkills.map((us) => (
                                                            <option key={us.skill.id} value={us.skill.id}>
                                                                {us.skill.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-gray-900 font-semibold">
                                                        {service.skill?.name || "General"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {isOwner ? (
                                // Owner View - Management Options
                                <>
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                                        <h3 className="text-xl font-bold mb-2">Tu Servicio</h3>

                                        {/* Job Status for Owner */}
                                        {userJob && (
                                            <div className="mb-4 bg-white/10 p-3 rounded-lg">
                                                <p className="text-sm font-semibold mb-1">Estado del Trabajo Actual:</p>
                                                <p className="text-lg font-bold capitalize mb-2">{userJob.status.replace('_', ' ')}</p>

                                                {userJob.status === 'pendiente' && (
                                                    <button
                                                        onClick={handleAcceptJob}
                                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded font-bold text-sm mb-2"
                                                    >
                                                        Aceptar Trabajo
                                                    </button>
                                                )}

                                                {userJob.status === 'en_progreso' && (
                                                    <button
                                                        onClick={handleCompleteJob}
                                                        disabled={userJob.vendor_confirmed}
                                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold text-sm disabled:opacity-50"
                                                    >
                                                        {userJob.vendor_confirmed ? "Esperando cliente..." : "Marcar Completado"}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-indigo-100 text-sm mb-4">
                                            Gestiona tu servicio desde aquí
                                        </p>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Precio actual</span>
                                                <span className="text-2xl font-bold">${service.price}</span>
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <button
                                                onClick={handleEditService}
                                                className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors duration-300 shadow-lg hover:shadow-xl mb-3"
                                            >
                                                <FaEdit className="inline mr-2" />
                                                Editar Servicio
                                            </button>
                                        )}
                                        <button
                                            onClick={handleDeleteService}
                                            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors duration-300"
                                        >
                                            <FaTrash className="inline mr-2" />
                                            Eliminar Servicio
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Estadísticas</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Calificación</span>
                                                <div className="flex items-center">
                                                    <FaStar className="text-yellow-400 mr-1" />
                                                    <span className="font-bold text-gray-900">
                                                        {service.avg_rating ? service.avg_rating.toFixed(1) : "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Estado</span>
                                                <span className={`font-bold ${service.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                                                    {service.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Customer View - Hire Options
                                <>
                                    {/* Action Card */}
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white mb-6">
                                        <h3 className="text-xl font-bold mb-2">
                                            {userJob ? "Estado del Servicio" : "¿Listo para contratar?"}
                                        </h3>

                                        {userJob && userJob.status !== 'completado' && userJob.status !== 'cancelado' ? (
                                            <div className="space-y-4">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                                                    <p className="text-sm opacity-80">Estado actual:</p>
                                                    <p className="text-xl font-bold capitalize">{userJob.status.replace('_', ' ')}</p>
                                                </div>

                                                {/* Status Logic */}
                                                {userJob.status === 'pendiente' && (
                                                    <div className="bg-yellow-500/20 p-2 rounded text-sm border border-yellow-500/30">
                                                        Esperando aceptación del vendedor
                                                    </div>
                                                )}

                                                {userJob.status === 'en_progreso' && (
                                                    <button
                                                        onClick={handleCompleteJob}
                                                        disabled={
                                                            (authUser && authUser.id === userJob.contractor_id && userJob.client_confirmed) ||
                                                            (authUser && authUser.id === userJob.vendor_id && userJob.vendor_confirmed)
                                                        }
                                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {(authUser && authUser.id === userJob.contractor_id && userJob.client_confirmed) ||
                                                            (authUser && authUser.id === userJob.vendor_id && userJob.vendor_confirmed)
                                                            ? "Esperando confirmación..."
                                                            : "Marcar como Completado"
                                                        }
                                                    </button>
                                                )}

                                                {userJob.status === 'completado' && (
                                                    <div className="bg-green-500/20 p-2 rounded text-sm flex items-center justify-center border border-green-500/30">
                                                        <FaCheckCircle className="mr-2" /> Completado
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-blue-100 text-sm mb-4">
                                                    Contrata este servicio ahora y comienza tu proyecto
                                                </p>
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm">Precio del servicio</span>
                                                        <span className="text-2xl font-bold">${service.price}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleHireClick}
                                                    className="w-full bg-white text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-bold transition-colors duration-300 shadow-lg hover:shadow-xl"
                                                >
                                                    Contratar Ahora
                                                </button>
                                                <p className="text-xs text-blue-100 text-center mt-3">
                                                    Pago seguro y protegido
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Vendor Card */}
                                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Sobre el Vendedor</h3>

                                        <div className="flex items-center mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                                {service.vendor.profile_picture_url ? (
                                                    <img
                                                        src={service.vendor.profile_picture_url}
                                                        alt={service.vendor.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    service.vendor.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <h4 className="text-lg font-bold text-gray-900">{service.vendor.name}</h4>
                                                <p className="text-sm text-gray-500 capitalize">{service.vendor.role}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center text-gray-600">
                                                <FaEnvelope className="mr-3 text-blue-500" />
                                                <span className="text-sm break-all">{service.vendor.email}</span>
                                            </div>
                                            {service.vendor.phone && (
                                                <div className="flex items-center text-gray-600">
                                                    <FaPhone className="mr-3 text-green-500" />
                                                    <span className="text-sm">{service.vendor.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleContactVendor}
                                            className="w-full border-2 border-blue-600 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                                        >
                                            Contactar Vendedor
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Información de Contacto</h3>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center text-gray-600 mb-2">
                                    <FaEnvelope className="mr-3 text-blue-500" />
                                    <span className="text-sm font-medium">Email</span>
                                </div>
                                <a href={`mailto:${service.vendor.email}`} className="text-blue-600 hover:underline">
                                    {service.vendor.email}
                                </a>
                            </div>
                            {service.vendor.phone && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center text-gray-600 mb-2">
                                        <FaPhone className="mr-3 text-green-500" />
                                        <span className="text-sm font-medium">Teléfono</span>
                                    </div>
                                    <a href={`tel:${service.vendor.phone}`} className="text-blue-600 hover:underline">
                                        {service.vendor.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Hire Modal */}
            {showHireModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                        <button
                            onClick={() => setShowHireModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Contratación</h3>
                        <p className="text-gray-600 mb-6">
                            Selecciona la fecha para realizar el servicio. El vendedor deberá aceptar la solicitud.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha del Servicio</label>
                            <input
                                type="date"
                                value={hireDate}
                                onChange={(e) => setHireDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowHireModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmHire}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
