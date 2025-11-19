import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { FaUser, FaBriefcase, FaEdit, FaTrash, FaPlus, FaStar, FaMoneyBillWave, FaSave, FaTimes, FaChartLine, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaCheckCircle, FaTimesCircle, FaCamera } from "react-icons/fa";
import { API_URL } from "../api/client";

export default function Profile() {
    const navigate = useNavigate();
    const { user: authUser, updateUser } = useAuth();
    const isVendor = authUser?.role === 'vendor' || authUser?.role === 'vendedor';

    const [activeTab, setActiveTab] = useState(isVendor ? "services" : "jobs");
    const [services, setServices] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [showAddService, setShowAddService] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [skills, setSkills] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [selectedSkillsToAdd, setSelectedSkillsToAdd] = useState([]);

    const [userData, setUserData] = useState({
        name: authUser?.name || "",
        email: authUser?.email || "",
        phone: authUser?.phone || "",
        address: authUser?.address || "",
        avatar: authUser?.profile_picture_url || "",
    });

    const [profileForm, setProfileForm] = useState({ ...userData });
    const [serviceForm, setServiceForm] = useState({
        title: "",
        description: "",
        price: "",
        skill_id: "",
        image_url: "",
    });

    useEffect(() => {
        if (!authUser?.id) return;
        if (isVendor) {
            fetchUserServices();
            fetchSkills();
            fetchUserSkills();
        }
        fetchUserJobs();
    }, [authUser?.id, isVendor]);

    const fetchUserServices = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/${authUser?.id}/services`);
            if (!res.ok) throw new Error("Error al cargar servicios");
            const data = await res.json();
            console.log("Services loaded:", data);
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching services:", err);
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserJobs = async () => {
        setLoading(true);
        try {
            const endpoint = isVendor ? `${API_URL}/users/${authUser?.id}/jobs-as-vendor` : `${API_URL}/users/${authUser?.id}/jobs-as-contractor`;
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Error al cargar trabajos");
            const data = await res.json();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error:", err);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSkills = async () => {
        try {
            const res = await fetch(`${API_URL}/skills/`);
            if (!res.ok) throw new Error("Error al cargar skills");
            const data = await res.json();
            setSkills(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    const fetchUserSkills = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${authUser?.id}/skills`);
            if (!res.ok) throw new Error("Error al cargar user skills");
            const data = await res.json();
            console.log("User skills loaded:", data);
            setUserSkills(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error:", err);
        }
    };

    const handleAddSkills = async () => {
        try {
            for (const skillId of selectedSkillsToAdd) {
                await fetch(`${API_URL}/users/${authUser?.id}/skills/${skillId}`, { method: "POST" });
            }
            fetchUserSkills();
            setShowSkillsModal(false);
            setSelectedSkillsToAdd([]);
            alert("Skills agregadas exitosamente");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al agregar skills");
        }
    };

    const handleRemoveSkill = async (skillId) => {
        if (!window.confirm("¿Eliminar esta skill?")) return;
        try {
            const res = await fetch(`${API_URL}/users/${authUser?.id}/skills/${skillId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar skill");
            fetchUserSkills();
            alert("Skill eliminada");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al eliminar skill");
        }
    };

    const handleDeleteService = async (serviceId) => {
        if (!window.confirm("¿Eliminar este servicio?")) return;
        try {
            const res = await fetch(`${API_URL}/services/${serviceId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar servicio");
            fetchUserServices();
            alert("Servicio eliminado");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al eliminar servicio");
        }
    };

    const handleEditService = (service) => {
        setEditingService(service.id);
        setServiceForm({
            title: service.title,
            description: service.description,
            price: service.price,
            skill_id: service.skill_id || "",
            image_url: service.image_url || "",
        });
    };

    const handleUpdateService = async (serviceId) => {
        try {
            const res = await fetch(`${API_URL}/services/${serviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: serviceForm.title,
                    description: serviceForm.description,
                    price: parseFloat(serviceForm.price),
                    skill_id: parseInt(serviceForm.skill_id),
                    image_url: serviceForm.image_url || null,
                }),
            });
            if (!res.ok) throw new Error("Error al actualizar servicio");
            setEditingService(null);
            fetchUserServices();
            alert("Servicio actualizado");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al actualizar servicio");
        }
    };

    const handleAddService = async () => {
        try {
            const res = await fetch(`${API_URL}/services/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: serviceForm.title,
                    description: serviceForm.description,
                    price: parseFloat(serviceForm.price),
                    skill_id: parseInt(serviceForm.skill_id),
                    vendor_id: authUser?.id || 1,
                    is_active: true,
                    image_url: serviceForm.image_url || null,
                }),
            });
            if (!res.ok) throw new Error("Error al crear servicio");
            setShowAddService(false);
            setServiceForm({ title: "", description: "", price: "", skill_id: "", image_url: "" });
            fetchUserServices();
            alert("Servicio creado");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al crear servicio");
        }
    };

    const handleServiceImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Selecciona una imagen válida');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Imagen muy grande. Máximo 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setServiceForm(prev => ({ ...prev, image_url: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Selecciona una imagen válida');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Imagen muy grande. Máximo 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            setUserData(prev => ({ ...prev, avatar: base64String }));
            if (window.confirm('¿Guardar nueva foto de perfil?')) {
                setLoading(true);
                try {
                    const res = await fetch(`${API_URL}/users/${authUser?.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ profile_picture_url: base64String }),
                    });
                    if (!res.ok) throw new Error("Error al actualizar foto");
                    const updatedUser = await res.json();
                    updateUser(updatedUser);
                    alert("Foto actualizada");
                } catch (err) {
                    console.error("Error:", err);
                    alert("Error al actualizar foto");
                    setUserData(prev => ({ ...prev, avatar: authUser?.profile_picture_url || "" }));
                } finally {
                    setLoading(false);
                }
            } else {
                setUserData(prev => ({ ...prev, avatar: authUser?.profile_picture_url || "" }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/users/${authUser?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: profileForm.name,
                    email: profileForm.email,
                    phone: profileForm.phone,
                    address: profileForm.address,
                }),
            });
            if (!res.ok) throw new Error("Error al actualizar perfil");
            const updatedUser = await res.json();
            setUserData({ ...updatedUser, avatar: updatedUser.profile_picture_url || "" });
            updateUser(updatedUser);
            setEditingProfile(false);
            alert("Perfil actualizado");
        } catch (err) {
            console.error("Error:", err);
            alert("Error al actualizar perfil");
        }
    };

    const handleUpdateJobStatus = async (jobId, newStatus) => {
        try {
            let url = `${API_URL}/jobs/${jobId}/status?status=${newStatus}`;
            let body = null;

            if (newStatus === 'en_progreso') {
                url = `${API_URL}/jobs/${jobId}/accept`;
                body = JSON.stringify({ user_id: authUser.id });
            } else if (newStatus === 'completado') {
                url = `${API_URL}/jobs/${jobId}/complete`;
                body = JSON.stringify({ user_id: authUser.id });
            }

            const options = {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            };
            if (body) options.body = body;

            const res = await fetch(url, options);
            if (!res.ok) throw new Error("Error al actualizar estado");

            const data = await res.json();

            if (newStatus === 'completado' && data.status !== 'completado') {
                alert("Has confirmado la finalización. Esperando a la otra parte.");
            } else {
                alert("Estado actualizado exitosamente");
            }

            fetchUserJobs();
        } catch (err) {
            console.error("Error:", err);
            alert("Error al actualizar estado");
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pendiente: { color: "bg-yellow-100 text-yellow-800", icon: <FaCheckCircle />, text: "Pendiente" },
            en_progreso: { color: "bg-blue-100 text-blue-800", icon: <FaCheckCircle />, text: "En Progreso" },
            completado: { color: "bg-green-100 text-green-800", icon: <FaCheckCircle />, text: "Completado" },
            cancelado: { color: "bg-red-100 text-red-800", icon: <FaTimesCircle />, text: "Cancelado" },
        };
        const badge = badges[status] || badges.pendiente;
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.icon}
                <span className="ml-1">{badge.text}</span>
            </span>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                                {userData.avatar ? (
                                    <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <FaUser className="text-white text-5xl" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-50 transition-colors">
                                <FaCamera />
                                <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                            </label>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            {editingProfile ? (
                                <div className="space-y-3">
                                    <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-4 py-2 rounded-lg text-gray-900" placeholder="Nombre" />
                                    <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-4 py-2 rounded-lg text-gray-900" placeholder="Email" />
                                    <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-2 rounded-lg text-gray-900" placeholder="Teléfono" />
                                    <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full px-4 py-2 rounded-lg text-gray-900" placeholder="Dirección" />
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateProfile} className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center">
                                            <FaSave className="mr-2" /> Guardar
                                        </button>
                                        <button onClick={() => { setEditingProfile(false); setProfileForm(userData); }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold mb-2">{userData.name}</h1>
                                    <p className="text-blue-100 mb-4 capitalize">{authUser?.role === 'vendor' ? 'Vendedor' : 'Contratador'}</p>
                                    <div className="space-y-2 text-sm">
                                        {userData.email && <p className="flex items-center justify-center md:justify-start"><FaEnvelope className="mr-2" /> {userData.email}</p>}
                                        {userData.phone && <p className="flex items-center justify-center md:justify-start"><FaPhone className="mr-2" /> {userData.phone}</p>}
                                        {userData.address && <p className="flex items-center justify-center md:justify-start"><FaMapMarkerAlt className="mr-2" /> {userData.address}</p>}
                                    </div>
                                    <button onClick={() => { setEditingProfile(true); setProfileForm(userData); }} className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center mx-auto md:mx-0">
                                        <FaEdit className="mr-2" /> Editar Perfil
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="flex border-b">
                        {isVendor && (
                            <>
                                <button onClick={() => setActiveTab("services")} className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "services" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
                                    <FaBriefcase className="inline mr-2" /> Servicios
                                </button>
                                <button onClick={() => setActiveTab("skills")} className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "skills" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
                                    <FaStar className="inline mr-2" /> Skills
                                </button>
                            </>
                        )}
                        <button onClick={() => setActiveTab("jobs")} className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "jobs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
                            <FaChartLine className="inline mr-2" /> {isVendor ? 'Trabajos Recibidos' : 'Mis Contrataciones'}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    {/* Services Tab */}
                    {activeTab === "services" && isVendor && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Mis Servicios</h2>
                                <button onClick={() => { setShowAddService(true); setServiceForm({ title: "", description: "", price: "", skill_id: "", image_url: "" }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                                    <FaPlus className="mr-2" /> Agregar Servicio
                                </button>
                            </div>

                            {showAddService && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                                    <h3 className="text-xl font-bold mb-4">Nuevo Servicio</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <input type="text" placeholder="Título" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        <input type="number" placeholder="Precio" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        <select value={serviceForm.skill_id} onChange={(e) => setServiceForm({ ...serviceForm, skill_id: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">Selecciona una skill</option>
                                            {userSkills.map((us) => (<option key={us.skill.id} value={us.skill.id}>{us.skill.name}</option>))}
                                        </select>
                                    </div>
                                    <textarea placeholder="Descripción" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4" rows="3" />
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto del Servicio (Opcional)</label>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors border border-gray-300">
                                                <FaPlus className="mr-2" /> Seleccionar Imagen
                                                <input type="file" accept="image/*" onChange={handleServiceImageChange} className="hidden" />
                                            </label>
                                            {serviceForm.image_url && (
                                                <div className="flex items-center gap-2">
                                                    <img src={serviceForm.image_url} alt="Preview" className="h-16 w-16 object-cover rounded-lg border-2 border-gray-300" />
                                                    <button onClick={() => setServiceForm({ ...serviceForm, image_url: "" })} className="text-red-600 hover:text-red-700">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleAddService} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            <FaSave className="mr-2" /> Guardar
                                        </button>
                                        <button onClick={() => setShowAddService(false)} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                            <FaTimes className="mr-2" /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                            ) : services.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <FaBriefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No tienes servicios publicados</h3>
                                    <p className="mt-1 text-gray-500">Comienza agregando tu primer servicio.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {services.map((service) => (
                                        <div key={service.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
                                            {editingService === service.id ? (
                                                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
                                                    <h4 className="font-bold text-gray-900 mb-3">Editar Servicio</h4>
                                                    <input type="text" value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Título" />
                                                    <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Descripción" />
                                                    <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Precio" />
                                                    <select value={serviceForm.skill_id} onChange={(e) => setServiceForm({ ...serviceForm, skill_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-blue-500" required>
                                                        <option value="">Selecciona una skill</option>
                                                        {userSkills.map((us) => (<option key={us.skill.id} value={us.skill.id}>{us.skill.name}</option>))}
                                                    </select>
                                                    <div className="mb-3">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Foto del Servicio</label>
                                                        <div className="flex items-center gap-2">
                                                            <label className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors border border-gray-300 text-xs">
                                                                <FaPlus className="mr-1 text-xs" /> Cambiar
                                                                <input type="file" accept="image/*" onChange={handleServiceImageChange} className="hidden" />
                                                            </label>
                                                            {serviceForm.image_url && (
                                                                <div className="flex items-center gap-2">
                                                                    <img src={serviceForm.image_url} alt="Preview" className="h-12 w-12 object-cover rounded-lg border-2 border-gray-300" />
                                                                    <button onClick={() => setServiceForm({ ...serviceForm, image_url: "" })} className="text-red-600 hover:text-red-700 text-xs">
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleUpdateService(service.id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                                            <FaSave className="mr-1" /> Guardar
                                                        </button>
                                                        <button onClick={() => setEditingService(null)} className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
                                                            <FaTimes className="mr-1" /> Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer overflow-hidden relative" onClick={() => navigate(`/service/${service.id}`)}>
                                                        {service.image_url ? (
                                                            <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FaBriefcase className="text-white text-3xl opacity-50" />
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="cursor-pointer" onClick={() => navigate(`/service/${service.id}`)}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">{service.title}</h3>
                                                                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                                                                    <FaStar className="text-yellow-400 text-xs mr-1" />
                                                                    <span className="text-xs font-semibold text-yellow-700">{service.avg_rating ? service.avg_rating.toFixed(1) : "New"}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                                                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{service.skill?.name || "General"}</span>
                                                                <div className="flex items-center text-green-600 font-bold">
                                                                    <FaMoneyBillWave className="mr-1 text-sm" /> ${service.price}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/service/${service.id}`); }} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                                                <FaEdit className="mr-1" /> Ver/Editar
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }} className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                                                                <FaTrash className="mr-1" /> Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Jobs Tab */}
                    {activeTab === "jobs" && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">{isVendor ? 'Trabajos Recibidos' : 'Mis Contrataciones'}</h2>
                            {loading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <FaChartLine className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">{isVendor ? 'No tienes trabajos recibidos' : 'No has contratado servicios'}</h3>
                                    <p className="mt-1 text-gray-500">{isVendor ? 'Los trabajos aparecerán aquí cuando alguien contrate tus servicios.' : 'Explora servicios y contrata profesionales.'}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobs.map((job) => (
                                        <div key={job.id} onClick={() => navigate(`/service/${job.service?.id}`)} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 p-6 cursor-pointer">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">{job.service?.title || 'Servicio'}</h3>
                                                        {getStatusBadge(job.status)}
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-2">{job.service?.description || 'Sin descripción'}</p>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center"><FaUser className="mr-2" /> {isVendor ? `Cliente: ${job.contractor_user?.name}` : `Vendedor: ${job.vendor_user?.name}`}</span>
                                                        <span className="flex items-center"><FaMoneyBillWave className="mr-2" /> ${job.total_amount}</span>
                                                        {job.start_date && <span className="flex items-center"><FaCalendar className="mr-2" /> {new Date(job.start_date).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                {isVendor && job.status !== 'completado' && job.status !== 'cancelado' && (
                                                    <div className="mt-4 md:mt-0 md:ml-4 flex gap-2">
                                                        {job.status === 'pendiente' && (
                                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job.id, 'en_progreso'); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                                                Iniciar Trabajo
                                                            </button>
                                                        )}
                                                        {job.status === 'en_progreso' && (
                                                            <button onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job.id, 'completado'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                                                Marcar Completado
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job.id, 'cancelado'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                                {!isVendor && job.status === 'en_progreso' && (
                                                    <div className="mt-4 md:mt-0 md:ml-4 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job.id, 'completado'); }}
                                                            disabled={job.client_confirmed}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {job.client_confirmed ? "Esperando confirmación..." : "Marcar Completado"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills Tab */}
                    {activeTab === "skills" && isVendor && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Mis Habilidades</h2>
                                <button onClick={() => setShowSkillsModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
                                    <FaPlus className="mr-2" /> Agregar Skill
                                </button>
                            </div>
                            {userSkills.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                    <FaStar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No tienes skills asignadas</h3>
                                    <p className="mt-1 text-gray-500">Agrega tus habilidades para poder crear servicios.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {userSkills.map((us) => (
                                        <div key={us.skill.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <FaStar className="text-yellow-500 mr-2" />
                                                        <h3 className="font-bold text-gray-900">{us.skill.name}</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{us.skill.description}</p>
                                                </div>
                                                <button onClick={() => handleRemoveSkill(us.skill.id)} className="ml-2 text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar skill">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showSkillsModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-2xl font-bold text-gray-900">Agregar Skills</h3>
                                            <button onClick={() => { setShowSkillsModal(false); setSelectedSkillsToAdd([]); }} className="text-gray-400 hover:text-gray-600">
                                                <FaTimes className="text-2xl" />
                                            </button>
                                        </div>
                                        <p className="text-gray-600 mb-4">Selecciona las habilidades que deseas agregar a tu perfil</p>
                                        <div className="space-y-2 mb-6">
                                            {skills.filter(s => !userSkills.some(us => us.skill.id === s.id)).map((skill) => (
                                                <label key={skill.id} className="flex items-start p-3 hover:bg-blue-50 rounded-lg cursor-pointer border border-transparent hover:border-blue-200 transition-all">
                                                    <input type="checkbox" checked={selectedSkillsToAdd.includes(skill.id)} onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSkillsToAdd([...selectedSkillsToAdd, skill.id]);
                                                        } else {
                                                            setSelectedSkillsToAdd(selectedSkillsToAdd.filter(id => id !== skill.id));
                                                        }
                                                    }} className="mt-1 mr-3 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{skill.name}</p>
                                                        <p className="text-sm text-gray-600">{skill.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={handleAddSkills} disabled={selectedSkillsToAdd.length === 0} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">
                                                Agregar {selectedSkillsToAdd.length > 0 && `(${selectedSkillsToAdd.length})`}
                                            </button>
                                            <button onClick={() => { setShowSkillsModal(false); setSelectedSkillsToAdd([]); }} className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium">
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
