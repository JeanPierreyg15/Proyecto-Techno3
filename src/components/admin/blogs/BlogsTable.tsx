import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaEdit, FaEye, FaBookOpen, FaSyncAlt, FaDownload, FaChevronDown, FaFilePdf, FaFileExcel, FaFileCsv } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AddBlogModal from "./AddBlogModel";
import { config, getApiUrl } from "config";
import Swal from "sweetalert2";
import { sanitizaHtml } from "src/utils/blog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import LoadingComponent from "src/components/admin/ui/LoadingComponent";
import { SearchInput } from "src/components/admin/ui/SearchInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "src/components/admin/ui/Table";
import { TablePagination } from "src/components/admin/ui/TablePagination";

interface Blog {
  id: number;
  titulo: string;
  subtitulo1: string;
  subtitulo2: string;
  subtitulo3: string;
  imagenes: { ruta_imagen: string }[];
  video_id?: string;
  video_titulo?: string;
  created_at?: string | null;
  parrafos: { parrafo: string }[];
  nombre_producto?: string;
  etiqueta?: {
    popup_button_color?: string;
    popup_text_color?: string;
    popup_button_text?: string;
  };
}

const getImageUrl = (ruta?: string) => {
  if (!ruta) return "";
  if (/^(https?:)?\/\//.test(ruta)) return ruta;
  return `${String(getApiUrl("")).replace(/\/+$/, "")}/${ruta.replace(/^\/+/, "")}`;
};

// Parse manual para evitar desfases por zona horaria
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "FECHA DE PUBLICACIÓN";
  const [year, month, day] = dateString.split(/[- :T]/);
  return `${day}-${month}-${year}`;
};

interface BlogCardProps {
  blog: Blog;
  deleting: boolean;
  onPreview: (b: Blog) => void;
  onEdit: (b: Blog) => void;
  onDelete: (id: number) => void;
}

const BlogCard = ({ blog, deleting, onPreview, onEdit, onDelete }: BlogCardProps) => {
  const img = blog.imagenes?.[0]?.ruta_imagen;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden min-w-0">
      <div className="flex gap-3 p-3">
        {img ? (
          <img
            src={getImageUrl(img)}
            alt={blog.titulo}
            loading="lazy"
            className="w-20 h-20 shrink-0 object-cover rounded-lg border border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-400 italic text-center px-1">
            Sin imagen
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">#{blog.id}</span>
            <span className="text-[11px] text-gray-400">
              {blog.created_at ? formatDate(blog.created_at) : ""}
            </span>
          </div>
          <p className="font-medium text-gray-800 dark:text-gray-100 line-clamp-2 break-words">
            {blog.titulo}
          </p>
          <div className="flex flex-wrap gap-1">
            <span className="bg-teal-100 text-teal-800 py-0.5 px-2 rounded-full text-[11px] font-medium truncate max-w-full">
              {blog.subtitulo1 || "Sin subtítulo"}
            </span>
            {blog.nombre_producto && (
              <span className="bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-full text-[11px] font-medium truncate max-w-full">
                {blog.nombre_producto}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
        <button
          type="button"
          aria-label={`Ver detalles del blog ${blog.id}`}
          onClick={() => onPreview(blog)}
          className="flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-teal-600 active:bg-teal-50 dark:active:bg-gray-700 cursor-pointer"
        >
          <FaEye size={16} /> Ver
        </button>
        <button
          type="button"
          aria-label={`Editar blog ${blog.id}`}
          onClick={() => onEdit(blog)}
          className="flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-yellow-600 active:bg-yellow-50 dark:active:bg-gray-700 cursor-pointer"
        >
          <FaEdit size={16} /> Editar
        </button>
        <button
          type="button"
          aria-label={`Eliminar blog ${blog.id}`}
          onClick={() => onDelete(blog.id)}
          disabled={deleting}
          className="flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-red-500 active:bg-red-50 dark:active:bg-gray-700 disabled:opacity-50 cursor-pointer"
        >
          {deleting ? <AiOutlineLoading3Quarters className="animate-spin" size={16} /> : <FaTrash size={16} />}
          Eliminar
        </button>
      </div>
    </div>
  );
};


interface BlogPreviewProps {
  blog: Blog | null;
  onClose: () => void;
}

const BlogPreview: React.FC<BlogPreviewProps> = ({ blog, onClose }) => {
  // Bloquea el scroll del fondo y permite cerrar con Escape
  useEffect(() => {
    if (!blog) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [blog, onClose]);

  if (!blog) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del blog"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-8"
    >
      <div className="relative w-full max-w-6xl max-h-[95dvh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-b from-[#041019] to-[#003E56]">
        {/* Cabecera */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700/50 bg-black/30">
          <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
            <FaEye className="text-teal-400" />
            Vista Previa Web
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="flex items-center justify-center w-11 h-11 text-white hover:text-red-400 transition-colors bg-gray-800 hover:bg-gray-700 rounded-full cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-2 md:p-10 custom-scrollbar">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-200 p-4 md:p-12 mx-auto max-w-5xl">
            {/* Título y subtítulos */}
            <div className="mb-6 md:mb-10 text-center md:text-left">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-[#00B6FF] mb-3 break-words font-garet">
                {blog.titulo.toUpperCase()}
              </h2>
              {blog.subtitulo1 && (
                <h3 className="text-lg md:text-xl font-bold text-black mb-3 break-words">
                  {blog.subtitulo1.toUpperCase()}
                </h3>
              )}
              {blog.subtitulo2 && (
                <p className="text-base md:text-lg font-semibold text-black break-words">
                  {blog.subtitulo2}
                </p>
              )}
            </div>

            {/* Fecha */}
            <div className="flex justify-center md:justify-start mb-8 md:mb-12">
              <div className="inline-block px-4 md:px-6 py-2 bg-[#00B6FF] text-white text-sm md:text-base font-semibold rounded-full shadow-md">
                {formatDate(blog.created_at)}
              </div>
            </div>

            {/* Secciones */}
            <div className="space-y-8 md:space-y-16">
              {blog.parrafos?.map((p, i) => (
                <section key={i} className="mb-4 md:mb-12">
                  <div className={`flex flex-col md:flex-row ${i % 2 === 1 ? "md:flex-row-reverse" : ""} gap-4 md:gap-8 items-center`}>
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                      <article className="prose prose-sm md:prose-base lg:prose-lg text-gray-700 text-left md:text-justify leading-relaxed break-words">
                        <div
                          className="text-sm md:text-base whitespace-pre-line break-words"
                          dangerouslySetInnerHTML={{ __html: sanitizaHtml(p.parrafo) }}
                        />
                      </article>
                    </div>

                    {blog.imagenes?.[i]?.ruta_imagen && (
                      <div className="relative w-full md:w-1/2 h-48 md:h-72 lg:h-96 overflow-hidden rounded-lg md:rounded-xl shadow-md flex justify-center items-center bg-gray-50">
                        <img
                          src={getImageUrl(blog.imagenes[i].ruta_imagen)}
                          alt={blog.titulo}
                          loading="lazy"
                          className="w-full h-full object-contain md:transition-transform md:duration-300 md:hover:scale-105"
                        />
                      </div>
                    )}
                  </div>
                </section>
              ))}

              <div className="flex justify-center mb-8 md:mb-12">
                <a
                  id="btn-ver-producto"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-full sm:w-auto text-center font-bold py-3 px-8 rounded-lg shadow-lg md:transition-all md:duration-300 md:hover:scale-105"
                  style={{
                    backgroundColor: blog.etiqueta?.popup_button_color || "#22c55e",
                    color: blog.etiqueta?.popup_text_color || "#ffffff",
                  }}
                >
                  {blog.etiqueta?.popup_button_text?.trim() || "Ver Producto"}
                </a>
              </div>

              {blog.video_id?.trim() && (
                <section className="rounded-lg md:rounded-xl shadow-md py-4 md:py-8 px-3 md:px-12 bg-gray-50 mt-8 md:mt-12 border border-gray-100">
                  <h1 className="text-lg md:text-xl lg:text-2xl text-[#00B6FF] font-bold mb-4 md:mb-6 text-center md:text-left break-words">
                    {blog.video_titulo || "Video relacionado"}
                  </h1>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${blog.video_id.trim()}`}
                      title={blog.video_titulo || "Video relacionado"}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogsTable = () => {
  const [data, setData] = useState<Blog[]>([]);
  const [filteredData, setFilteredData] = useState<Blog[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const prevSearchTermRef = useRef("");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingDeleteId, setLoadingDeleteId] = useState<number | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const itemsPerPage = 5;

  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const exportRows = () =>
    data.map((blog) => ({
      ID: blog.id,
      Titulo: blog.titulo,
      Subtitulo: blog.subtitulo1,
      Producto: blog.nombre_producto ?? "Sin producto",
      Fecha: blog.created_at ? new Date(blog.created_at).toLocaleDateString() : "N/A",
    }));

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "blogs_reporte.csv";
    link.click();
    setIsExportOpen(false);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Blogs");
    XLSX.writeFile(workbook, "blogs_reporte.xlsx");
    setIsExportOpen(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Blogs", 14, 15);
    autoTable(doc, {
      head: [["ID", "Titulo", "Subtitulo", "Producto", "Fecha"]],
      body: exportRows().map((r) => [r.ID, r.Titulo, r.Subtitulo, r.Producto, r.Fecha]),
      startY: 20,
    });
    doc.save("blogs_reporte.pdf");
    setIsExportOpen(false);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(config.endpoints.blogs.list));
      const result = await response.json();

      if (Array.isArray(result?.data)) {
        setData(result.data);
        setFilteredData(result.data);
      } else {
        console.warn("⚠️ 'data' no es un array válido:", result?.data);
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredData(data);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredData(
        data.filter(
          (blog) =>
            (blog.titulo ?? "").toLowerCase().includes(term) ||
            (blog.subtitulo2 ?? "").toLowerCase().includes(term) ||
            (blog.nombre_producto ?? "").toLowerCase().includes(term) ||
            blog.id.toString().includes(searchTerm)
        )
      );
    }

    if (searchTerm !== prevSearchTermRef.current) {
      setCurrentPage(1);
    }
    prevSearchTermRef.current = searchTerm;
  }, [searchTerm, data]);

  const handleBlogAdded = () => {
    fetchData();
    setIsAddModalOpen(false);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    const confirmResult = await Swal.fire({
      title: "¿Estás seguro de que deseas eliminar este blog?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#14b8a6",
      cancelButtonColor: "#ef4444",
    });

    if (confirmResult.isConfirmed) {
      setLoadingDeleteId(id);
      try {
        const response = await fetch(getApiUrl(config.endpoints.blogs.delete(id)), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          setData((prev) => prev.filter((item) => item.id !== id));
          await Swal.fire({
            title: "Eliminado",
            text: "Blog eliminado exitosamente",
            icon: "success",
            confirmButtonColor: "#14b8a6",
          });
        } else {
          await Swal.fire({
            title: "Error",
            text: "Error al eliminar el blog",
            icon: "error",
            confirmButtonColor: "#14b8a6",
          });
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
        await Swal.fire({
          title: "Error",
          text: "Error al conectar con el servidor",
          icon: "error",
          confirmButtonColor: "#14b8a6",
        });
      } finally {
        setLoadingDeleteId(null);
      }
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);

  const openEditModal = (blog: Blog) => {
    setEditBlog(blog);
    setIsAddModalOpen(true);
  };

  const handlePreview = (blog: Blog) => setSelectedBlog(blog);
  const closePreview = () => setSelectedBlog(null);

  if (isLoading) return <LoadingComponent message="cargando blogs" />;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
      <div className="mb-4 md:mb-6">
        <p className="text-gray-500 text-sm mb-1 font-medium">
          Administración <span className="mx-1 font-normal">&gt;</span>{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">Gestión de Blogs</span>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-4 sm:px-8 py-5 md:py-6 rounded-t-2xl">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2 text-white">
                <FaBookOpen />
                <span>Gestión de Blog</span>
              </h2>
              <p className="text-teal-50 mt-1 md:mt-2 text-sm md:text-lg">
                Administra todas las publicaciones del blog de tu empresa
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 items-center">
              {/* Exportar */}
              <div className="relative text-left" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isExportOpen}
                  className="relative flex items-center justify-center w-full sm:min-w-[160px] min-h-[44px] pl-9 pr-8 bg-teal-50 dark:bg-white text-teal-700 dark:text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-50 transition-all duration-300 rounded-lg text-sm font-bold shadow-sm border border-teal-200 dark:border-white cursor-pointer"
                >
                  <FaDownload className="absolute left-3 h-4 w-4" />
                  <span>Exportar</span>
                  <FaChevronDown className={`absolute right-3 h-3 w-3 transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
                </button>

                {isExportOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 origin-top-left sm:origin-top-right bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  >
                    <div className="py-1">
                      <button onClick={exportToPDF} role="menuitem" className="flex w-full items-center px-4 min-h-[44px] text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-700 cursor-pointer">
                        <FaFilePdf className="mr-3 h-5 w-5 text-red-500" />
                        PDF
                      </button>
                      <button onClick={exportToExcel} role="menuitem" className="flex w-full items-center px-4 min-h-[44px] text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-700 cursor-pointer">
                        <FaFileExcel className="mr-3 h-5 w-5 text-green-600" />
                        Excel
                      </button>
                      <button onClick={exportToCSV} role="menuitem" className="flex w-full items-center px-4 min-h-[44px] text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-gray-700 cursor-pointer">
                        <FaFileCsv className="mr-3 h-5 w-5 text-blue-500" />
                        CSV
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Añadir blog */}
              <button
                type="button"
                onClick={openAddModal}
                className="relative flex items-center justify-center w-full sm:min-w-[160px] min-h-[44px] pl-9 pr-3 bg-teal-600 text-white hover:bg-teal-700 transition-all duration-300 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Añadir Blog
              </button>
            </div>
          </div>
        </div>

        {/* Búsqueda y contador */}
        <div className="p-4 sm:p-8 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
            <SearchInput placeholder="Buscar blogs..." value={searchTerm} onChange={setSearchTerm} />
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 border-2 border-teal-500 dark:border-teal-600 hover:bg-teal-50 dark:hover:bg-gray-600 transition-all duration-300 px-5 min-h-[44px] rounded-full text-sm font-bold w-full sm:w-auto justify-center shadow-sm cursor-pointer"
            >
              <FaSyncAlt className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div className="flex items-center justify-between bg-teal-50 dark:bg-gray-700 p-3 md:p-4 rounded-xl border border-teal-100 dark:border-gray-600 shadow-sm">
            <div className="text-sm font-medium text-teal-700 dark:text-teal-300 flex items-center gap-2">
              <span className="bg-teal-500 text-white text-sm font-bold py-1 px-3 rounded-full">
                {filteredData.length}
              </span>
              {filteredData.length === 1 ? "publicación encontrada" : "publicaciones encontradas"}
            </div>
          </div>
        </div>

        {/* Vista tabla (desktop / tablet) */}
        <div className="hidden md:block px-8 pb-6">
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  {["ID", "TÍTULO", "SUBTÍTULO", "PRODUCTO", "IMAGEN", "ACCIÓN"].map((head, i) => (
                    <TableHead key={i} className="font-bold tracking-wide uppercase text-xs">
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((blog) => (
                    <TableRow key={blog.id} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <TableCell className="whitespace-nowrap text-teal-700">#{blog.id}</TableCell>
                      <TableCell className="px-6 py-4 font-medium max-w-[250px] truncate">
                        <span title={blog.titulo}>{blog.titulo}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4 max-w-[250px] truncate">
                        <div title={blog.subtitulo1}>
                          <span className="bg-teal-100 text-teal-800 py-1 px-3 rounded-full text-xs font-medium">
                            {blog.subtitulo1 ? blog.subtitulo1 : "Sin subtítulo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 max-w-[250px] truncate">
                        <div title={blog.nombre_producto ?? ""}>
                          {blog.nombre_producto ? (
                            <span className="bg-emerald-100 text-emerald-800 py-1 px-3 rounded-full text-xs font-medium">
                              {blog.nombre_producto}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin producto</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center">
                          {blog.imagenes?.[0]?.ruta_imagen ? (
                            <img
                              src={getImageUrl(blog.imagenes[0].ruta_imagen)}
                              alt={blog.titulo}
                              className="w-14 h-14 object-cover rounded-lg shadow-md border border-gray-200"
                            />
                          ) : (
                            <span className="text-sm text-gray-400 italic">Sin imagen</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3 items-center">
                          <button
                            className="p-2 rounded-full hover:bg-teal-100 text-teal-500 transition-colors duration-200 border border-transparent hover:border-teal-200 cursor-pointer"
                            title="Ver Detalles"
                            aria-label="Ver detalles"
                            onClick={() => handlePreview(blog)}
                          >
                            <FaEye size={18} />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-yellow-100 text-yellow-500 transition-colors duration-200 border border-transparent hover:border-yellow-200 cursor-pointer"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => openEditModal(blog)}
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors duration-200 border border-transparent hover:border-red-200 cursor-pointer"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => handleDelete(blog.id)}
                            disabled={loadingDeleteId === blog.id}
                          >
                            {loadingDeleteId === blog.id ? (
                              <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                            ) : (
                              <FaTrash size={18} />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="bg-teal-50 p-6 rounded-full">
                          <FaBookOpen className="h-10 w-10 text-teal-300" />
                        </div>
                        <p className="text-xl font-medium text-gray-600 mt-4">
                          {searchTerm ? "No se encontraron blogs que coincidan con tu búsqueda" : "No hay blogs registrados"}
                        </p>
                        <p className="text-gray-400 max-w-md mx-auto">
                          {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando publicaciones a tu blog con el botón 'Añadir Blog'"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Vista mobile */}
        <div className="md:hidden px-3 sm:px-6 pb-4 space-y-3">
          {currentItems.length > 0 ? (
            currentItems.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                deleting={loadingDeleteId === blog.id}
                onPreview={handlePreview}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <div className="bg-teal-50 p-6 rounded-full">
                <FaBookOpen className="h-10 w-10 text-teal-300" />
              </div>
              <p className="text-lg font-medium text-gray-600 mt-2 text-center">
                {searchTerm ? "No se encontraron blogs que coincidan con tu búsqueda" : "No hay blogs registrados"}
              </p>
              <p className="text-gray-400 text-sm text-center max-w-xs">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza agregando publicaciones a tu blog con el botón 'Añadir Blog'"}
              </p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {filteredData.length > 0 && (
          <TablePagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
        )}
      </div>

      <AddBlogModal
        onBlogAdded={handleBlogAdded}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditBlog(null);
        }}
        blogToEdit={editBlog}
      />
      {selectedBlog && <BlogPreview blog={selectedBlog} onClose={closePreview} />}
    </div>
  );
};

export default BlogsTable;