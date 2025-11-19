import React from "react";
import { Navbar as BsNavbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NavbarComponent = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <BsNavbar bg="light" expand="lg" className="shadow-sm fixed-top">
      <Container>
        <BsNavbar.Brand href="/">ServiLink</BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/home">Servicios</Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link href="/profile">Mi Perfil</Nav.Link>
                <NavDropdown title={user?.name || 'Usuario'} id="user-dropdown">
                  <NavDropdown.Item onClick={handleLogout}>
                    Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link href="/register">Regístrate</Nav.Link>
                <Nav.Link href="/login">Iniciar Sesión</Nav.Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default NavbarComponent;
