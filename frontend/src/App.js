// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding"; // nueva pantalla

function OnboardingWrapper() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return <Onboarding userId={parseInt(userId)} onComplete={() => navigate("/home")} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLoginSuccess={() => window.location.href = "/home"} />} />
        <Route path="/onboarding/:userId" element={<OnboardingWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
