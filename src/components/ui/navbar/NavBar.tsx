import { useState, useEffect, lazy, Suspense } from "react";
import logoTami from "@images/logos/logo-estatico-100x116.webp";
import navLinks from "@data/navlinks.data";
import { IoClose, IoMenu } from "react-icons/io5";
import ActiveLink from "./ActiveLink";
import type { SocialLink } from "../../../types/contacto.interface";

const SideMenu = lazy(() => import("../sideMenu/SideMenu"));

interface NavBarProps {
  forceSolid?: boolean;
  socialMediaLinks: SocialLink[];
}

function NavBar({ forceSolid = false, socialMediaLinks }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const solid = isScrolled || forceSolid;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        backgroundColor: solid ? "#07625b" : "transparent",
        boxShadow: solid ? "0 10px 15px -3px rgb(0 0 0 / 0.1)" : "none",
      }}
      className="fixed top-0 z-50 w-full transition-[background-color,box-shadow] duration-300 ease-in-out"
    >
      <div className="max-w-[1834px] mx-auto px-4 sm:px-6 lg:px-8 md:py-6">
        <div className="flex items-center justify-between h-24">
          <a href="/" title="Ir a la sección de inicio" className="flex-shrink-0">
            <img
              src={logoTami.src}
              alt="Logo de Tami"
              width="64"
              height="74"
              className="h-18 md:h-25 w-auto object-contain"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </a>

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

          <div className="flex items-center">
            <a
              href="/auth/sign-in"
              title="Ir a la sección de inicio de sesión"
              className="hidden lg:block bg-white rounded-md py-3 px-8 text-[#07625b] font-bold text-lg hover:bg-gray-200 transition-colors"
            >
              LOGIN
            </a>

            <button
              className="lg:hidden ml-4 w-12 h-12 flex items-center justify-center text-white"
              title={isOpen ? "Cerrar Menú" : "Abrir Menú"}
              aria-label={isOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {isOpen ? <IoClose size={32} /> : <IoMenu size={32} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <Suspense fallback={null}>
          <SideMenu
            socialMediaLinks={socialMediaLinks}
            links={navLinks}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </header>
  );
}

export default NavBar;