/**
 * @file SideMenu.tsx
 * @description Componente de menú lateral para la navegación en dispositivos móviles (clic en icono de usuario → dashboard + botón de login destacado)
 */

import { lazy, useEffect, useState } from "react";
// import Swal from "sweetalert2"; // Se usará importación dinámica
import apiClient from "src/services/apiClient";
import { config } from "config";
import NavSocialMediaLink from "./NavSocialMediaLink";
import userIcon from "@icons/icon_user.webp";

const NavLink = lazy(() => import("../navbar/NavLink"));

interface NavLink {
  url: string;
  texto: string;
  title?: string;
}

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
}

interface UserInfo {
  name: string;
  role: string;
}

const SideMenu = ({ isOpen, onClose, links }: SideMenuProps) => {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userInfoStr = localStorage.getItem("userInfo");

    if (token && userInfoStr) {
      try {
        const userInfo: UserInfo = JSON.parse(userInfoStr);
        setUser(userInfo);
      } catch {
        setUser({ name: "Usuario", role: "Usuario" });
      }
    } else if (token) {
      setUser({ name: "Usuario", role: "Usuario" });
    } else {
      setUser(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const userInfoStr = localStorage.getItem("userInfo");

      if (token && userInfoStr) {
        try {
          const userInfo: UserInfo = JSON.parse(userInfoStr);
          setUser(userInfo);
        } catch {
          setUser({ name: "Usuario", role: "Usuario" });
        }
      } else if (token) {
        setUser({ name: "Usuario", role: "Usuario" });
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const handleEscape = (e: any) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    const { default: Swal } = await import("sweetalert2");
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas cerrar sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.post(config.endpoints.auth.logout);
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        setUser(null);
        window.location.href = "/";
      }
    }
  };

  const handleUserClick = () => {
    if (user) {
      window.location.href = "/admin/inicio";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div
        className="fixed right-0 top-[72px] w-[85vw] max-w-[300px] h-[calc(100vh-100px)] shadow-2xl z-50 overflow-y-auto rounded-l-2xl
               bg-[#0F766E]/95 backdrop-blur-sm
               transition-transform duration-300 ease-in-out px-1 py-6
               border border-emerald-800/80"
      >
        <nav className="space-y-0">
          {links.map((item, index) => (
            <div key={index} className="border-b border-white/20 last:border-b-0">
              <div className="block py-3 text-center text-white font-medium text-lg hover:bg-white/10 transition-colors rounded-lg mx-2">
                <NavLink
                  isForNavBar={false}
                  to={item.url}
                  title={item.title || `Ir a ${item.texto}`}
                >
                  {item.texto}
                </NavLink>
              </div>
            </div>
          ))}
        </nav>

        <div className="my-1 border-t border-white/30 w-4/5 mx-auto" />



        <div className="pt-2">
          {!user ? (
            <div className="text-center">
              <NavLink
                isForNavBar={false}
                to="/auth/sign-in"
                title="Iniciar sesión en Tami Maquinarias"
              >
                <div
                  className="inline-block w-4/5 mx-auto bg-white text-[#0F766E] font-bold py-3 rounded-xl 
                             shadow-md hover:shadow-lg hover:bg-teal-50 active:scale-95 
                             transition-all duration-200"
                >
                  INICIAR SESIÓN
                </div>
              </NavLink>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div
                className="flex justify-center mb-2 cursor-pointer hover:scale-105 transition-transform"
                onClick={handleUserClick}
                title="Ir al panel de administración"
              >
                <img
                  src={userIcon.src}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain"
                  alt="Icono de usuario"
                  loading="lazy"
                />
              </div>
              <p className="text-white font-bold text-lg">{user.name}</p>
              <p className="text-white font-bold text-lg capitalize">{user.role}</p>
              <button
                onClick={handleLogout}
                className="w-4/5 mx-auto text-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 transition-all duration-300 py-3 rounded-xl font-bold text-white text-sm shadow-sm hover:shadow"
              >
                CERRAR SESIÓN
              </button>
            </div>
          )}
        </div>

        {/* --- ESPACIO DE SEPARACIÓN AJUSTABLE --- */}
        <div className="mt-8" id="spacer-social-networks"></div>
        {/* --------------------------------------- */}

        <div className="my-6 border-t border-white/30 w-4/5 mx-auto" />
        <div className="py-1">
          <p className="font-semibold text-center text-white text-lg mb-4">
            Síguenos
          </p>
          <div className="flex flex-wrap justify-center gap-4 px-2">
            {socialMediaLinks.map((item, index) => (
              <NavSocialMediaLink
                key={index}
                image={item.image.src}
                url={item.url}
                socialMediaName={item.socialMediaName}
                imageTitle={item.imageTitle}
                linkTitle={item.linkTitle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;
