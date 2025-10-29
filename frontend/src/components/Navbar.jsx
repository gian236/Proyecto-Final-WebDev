import React from "react";
import { Navbar as BsNavbar, Container, Nav } from "react-bootstrap";

const NavbarComponent = () => {
  return (
    <BsNavbar bg="light" expand="lg" className="shadow-sm fixed-top">
      <Container>
        <BsNavbar.Brand href="#">ServiLink</BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="#services">Servicios</Nav.Link>
            <Nav.Link href="#register">Regístrate</Nav.Link>
            <Nav.Link href="#login">Iniciar Sesión</Nav.Link>
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default NavbarComponent;
