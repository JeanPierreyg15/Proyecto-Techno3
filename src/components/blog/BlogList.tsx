import { useEffect, useState, useMemo, useCallback } from "react";
import CardBlog from "./CardBlog";
import type Blog from "src/models/Blog";
import { getApiUrl, config } from "config";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { matchesBlogSearch } from "src/utils/blog";

interface BlogListProps {
  searchTerm: string;
  sortOrder: "asc" | "desc";
}

const BlogList = ({ searchTerm, sortOrder }: BlogListProps) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Resetear página cuando cambia búsqueda u orden
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  // Fetch de blogs
  useEffect(() => {
    const controller = new AbortController();
    const apiUrlBlogs = getApiUrl(config.endpoints.blogs.list);

    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiUrlBlogs, { signal: controller.signal });

        if (!res.ok) throw new Error("HTTP error blogs!");

        const data = await res.json();
        const blogData = Array.isArray(data) ? data : data.data || [];

        setBlogs(blogData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Error al cargar blogs");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchBlogs();

    return () => controller.abort();
  }, []);

  // Filtrado y ordenamiento
  const filteredAndSortedBlogs = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const filtered = blogs.filter((blog) =>
      matchesBlogSearch(blog, term));

    // copiar array antes de sort para evitar mutación
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;

      if (dateA !== dateB) {
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }

      return sortOrder === "desc" ? idB - idA : idA - idB;
    });

    return sorted;
  }, [blogs, searchTerm, sortOrder]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedBlogs.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedBlogs.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedBlogs, currentPage]);

  // Handlers optimizados
  const goPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  return (
    <>
      {loading ? (
        <p className="text-center text-teal-800 py-10 font-medium">
          Cargando artículos...
        </p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : filteredAndSortedBlogs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {currentItems.map((blog) => (
            <CardBlog key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <p className="text-center text-teal-800 py-10 font-medium">
          {searchTerm.trim()
            ? "No se encontraron resultados para tu búsqueda."
            : "Aún no hay artículos publicados."}
        </p>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-10 mb-4">

          <button
            onClick={goPrev}
            disabled={currentPage === 1}
            className={`${currentPage === 1
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer hover:bg-teal-50 hover:-translate-y-0.5 hover:shadow-md"
              }
              p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600
              transition-all duration-300 ease-out`}
            aria-label="Página anterior"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageToShow = i + 1;

            if (totalPages > 5) {
              if (currentPage > 3 && currentPage < totalPages - 2)
                pageToShow = currentPage - 2 + i;
              else if (currentPage >= totalPages - 2)
                pageToShow = totalPages - 4 + i;
            }

            return (
              <button
                key={i}
                onClick={() => setCurrentPage(pageToShow)}
                className={`min-w-[40px] px-3 py-2 border rounded-lg text-sm font-medium cursor-pointer
                transition-all duration-300 ease-out
                ${currentPage === pageToShow
                    ? "bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-200"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-teal-50 hover:border-teal-300 hover:-translate-y-0.5 hover:shadow-sm"
                  }`}
              >
                {pageToShow}
              </button>
            );
          })}

          <button
            onClick={goNext}
            disabled={currentPage === totalPages}
            className={`${currentPage === totalPages
              ? "opacity-40 cursor-not-allowed"
              : "cursor-pointer hover:bg-teal-50 hover:-translate-y-0.5 hover:shadow-md"
              }
              p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600
              transition-all duration-300 ease-out`}
            aria-label="Página siguiente"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </>
  );
};

export default BlogList;