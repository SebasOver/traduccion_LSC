import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  IconoInicio,
  IconoTraducir,
  IconoExplorar,
  IconoConfiguracion,
  IconoMenu,
  IconoCerrar,
} from './Iconos.jsx';

const ENLACES = [
  { to: '/', etiqueta: 'Inicio', Icono: IconoInicio, fin: true },
  { to: '/traducir', etiqueta: 'Traducir', Icono: IconoTraducir },
  { to: '/explorar', etiqueta: 'Explorar', Icono: IconoExplorar },
];

function Marca() {
  return (
    <div className="marca-sidebar">
      <span className="marca-icono" aria-hidden="true">LSC</span>
      <span>Traductor LSC</span>
    </div>
  );
}

function EnlaceNav({ to, etiqueta, Icono, fin, onClick }) {
  return (
    <NavLink
      to={to}
      end={fin}
      onClick={onClick}
      className={({ isActive }) => (isActive ? 'enlace-nav activo' : 'enlace-nav')}
    >
      <Icono />
      <span>{etiqueta}</span>
    </NavLink>
  );
}

// Estructura de navegación de toda la app: sidebar en escritorio, barra
// inferior + menú deslizable en móvil. El contenido de cada página vive en
// <Outlet/>.
export default function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  // Cierra el menú móvil al cambiar de página
  useEffect(() => setMenuAbierto(false), [ubicacion.pathname]);

  return (
    <div className="app-shell">
      <aside className="barra-lateral">
        <Marca />
        <nav className="nav-principal" aria-label="Navegación principal">
          {ENLACES.map((enlace) => (
            <EnlaceNav key={enlace.to} {...enlace} />
          ))}
        </nav>
        <EnlaceNav to="/configuracion" etiqueta="Configuración" Icono={IconoConfiguracion} />
      </aside>

      <header className="barra-superior-movil">
        <Marca />
        <button
          type="button"
          className="boton-menu"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
        >
          <IconoMenu />
        </button>
      </header>

      {menuAbierto && (
        <div className="menu-movil-fondo" onClick={() => setMenuAbierto(false)}>
          <nav
            className="menu-movil"
            aria-label="Menú principal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-movil-encabezado">
              <Marca />
              <button
                type="button"
                className="boton-menu"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
              >
                <IconoCerrar />
              </button>
            </div>
            {ENLACES.map((enlace) => (
              <EnlaceNav key={enlace.to} {...enlace} onClick={() => setMenuAbierto(false)} />
            ))}
            <EnlaceNav
              to="/configuracion"
              etiqueta="Configuración"
              Icono={IconoConfiguracion}
              onClick={() => setMenuAbierto(false)}
            />
          </nav>
        </div>
      )}

      <main className="contenido-principal">
        <Outlet />
      </main>

      <nav className="barra-inferior-movil" aria-label="Navegación principal">
        {ENLACES.map((enlace) => (
          <EnlaceNav key={enlace.to} {...enlace} />
        ))}
      </nav>
    </div>
  );
}
