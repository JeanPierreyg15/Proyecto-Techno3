import { useState, useDeferredValue, useCallback, useEffect, useMemo, useRef } from "react";
import { FaSearch, FaSortAmountDown } from "react-icons/fa";
import { getApiUrl, config } from "config";
import { getBlogHref, getBlogImageUrl, matchesBlogSearch } from "src/utils/blog";
import type Blog from "src/models/Blog";
import { createPortal } from "react-dom";
import BlogList from "./BlogList";

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [blog, setBlog] = useState<Blog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // contiene y muestra las 5 primeras coincidencias(blogs) en el buscador
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLocaleLowerCase();

    return blog
      .filter((b) => matchesBlogSearch(b, term))
      .slice(0, 5);
  }, [blog, searchTerm]);

  // evita que React bloquee mientras se escribe
  const deferredSearch = useDeferredValue(searchTerm);

  // funcion estable para evitar renders innecesarios
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      setIsOpenSearch(value.trim().length > 0);

      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    },
    []
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortOrder(e.target.value as "asc" | "desc");
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const apiUrlBlogs = getApiUrl(config.endpoints.blogs.list);

    const fetchBlogs = async () => {
      try {
        const res = await fetch(apiUrlBlogs, { signal: controller.signal });

        if (!res.ok) throw new Error("HTTP error blogs!");

        const data = await res.json();
        const blogData = Array.isArray(data) ? data : data.data || [];

        setBlog(blogData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError("Error al cargar blogs");
        }
      }
    };

    fetchBlogs();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideSearch = searchContainerRef.current && !searchContainerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideSearch && isOutsideDropdown) {
        setIsOpenSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <section className="container mx-auto p-4 md:p-10 lg:px-24">
      <p className="text-teal-700 text-3xl md:text-4xl font-bold mb-6">
        Todos los artículos
      </p>

      <div className="mb-8">
        {/* BUSCADOR */}
        <div ref={searchContainerRef} className="relative group mb-3">
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full border-2 border-gray-300 rounded-xl px-5 py-3.5 pr-12 text-gray-700 placeholder-gray-400 
              bg-white shadow-sm
              focus:outline-none focus:border-teal-700 focus:shadow-[0_0_0_3px_rgba(15,118,110,0.1)]
              hover:border-teal-600 transition-all duration-300"
          />

          <FaSearch className="absolute right-4 top-4 text-gray-400 transition-colors duration-300 group-focus-within:text-teal-700" />

          {/* Aquí salen los 5 blogs sugeridos*/}
          {isOpenSearch && suggestions.length > 0 && createPortal(
            <ul
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
              className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.10)] overflow-hidden z-40 max-h-[420px] overflow-y-auto p-2"
            >
              {suggestions.map((blog) => (
                <li key={blog.id}>
                  <a href={getBlogHref(blog.link)} className="group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-teal-50">
                    <div className="w-14 h-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img src={getBlogImageUrl(blog.miniatura)} alt={blog.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-gray-900 font-bold text-base leading-snug line-clamp-1 group-hover:text-teal-700 transition-colors">{blog.titulo}</h4>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{blog.subtitulo1}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>,
            document.body
          )}
        </div>

        <div className="flex items-center justify-end md:justify-start pl-1">
          <div className="flex items-center gap-2 group cursor-pointer relative">
            <FaSortAmountDown className="text-teal-700 group-hover:text-teal-900 transition-colors" />

            <label
              htmlFor="sortOrder"
              className="text-sm font-bold text-gray-700 cursor-pointer group-hover:text-teal-800"
            >
              Ordenar por fecha de publicación:
            </label>

            <div className="relative">
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={handleSortChange}
                className="appearance-none bg-transparent border-none text-sm font-medium text-teal-700 
                           cursor-pointer focus:ring-0 focus:outline-none py-1 pr-6 hover:text-teal-900 transition-colors"
              >
                <option value="desc">Más recientes primero</option>
                <option value="asc">Más antiguos primero</option>
              </select>

              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-2.5 h-2.5 text-teal-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BlogList searchTerm={deferredSearch} sortOrder={sortOrder} />
    </section>
  );
};

export default BlogPage;