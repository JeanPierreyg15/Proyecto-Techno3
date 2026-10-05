import { useState, useEffect, lazy } from "react";
import logoTami from "@images/logos/logo-estatico-100x116.webp";
import navLinks from "@data/navlinks.data";
import { IoClose, IoMenu } from "react-icons/io5";
import ActiveLink from "./ActiveLink";

const SideMenu = lazy(() => import("../sideMenu/SideMenu"));

interface NavBarProps {
  forceSolid?: boolean;
}

function NavBar({ forceSolid = false }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 50);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    setIsScrolled(window.scrollY > 50);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed w-full top-0 z-50
        transition-[background-color,box-shadow] duration-300 ease-in-out
        ${isScrolled || forceSolid ? "bg-[#07625b] shadow-lg" : "bg-transparent shadow-none"}
      `}
    >
      <div className="max-w-[1834px] mx-auto px-4 md:py-6 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" title="Ir a la sección de inicio">
              <img
                src={logoTami.src}
                alt="Logo de Tami"
                title="Tami logo"
                width="64"
                height="74"
                className="h-18 md:h-25 w-auto object-contain"
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
            </a>
          </div>

          {/* Enlaces de escritorio */}
          <nav className="hidden lg:flex justify-center flex-grow">
            <ul className="flex items-center space-x-12">
              {navLinks.map((item) => (
                <li key={item.url}>
                  <ActiveLink
                    href={item.url}
                    title={`Ir a la sección de ${item.texto}`}
                  >
                    {item.texto}
                  </ActiveLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Login y menú móvil */}
          <div className="flex items-center">
            <a
              href="/auth/sign-in"
              title="Ir a la sección de inicio de sesión"
              className="hidden lg:block bg-white rounded-md py-3 px-8 text-[#07625b] font-bold text-lg hover:bg-gray-200 transition-colors"
            >
              LOGIN
            </a>

            <div className="lg:hidden ml-4">
              <button
                className="w-12 h-12 flex items-center justify-center text-white"
                title={isOpen ? "Cerrar Menú" : "Abrir Menú"}
                aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <IoClose size={32} /> : <IoMenu size={32} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SideMenu
        links={navLinks}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </header>
  );
}

export default NavBar;