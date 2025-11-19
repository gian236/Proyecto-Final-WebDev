// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Job from "./pages/Job";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";

function OnboardingWrapper() {
  const { userId } = useParams();
  const navigate = useNavigate();
  return <Onboarding userId={parseInt(userId)} onComplete={() => navigate("/profile")} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/service/:serviceId" element={<Job />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding/:userId" element={<OnboardingWrapper />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
