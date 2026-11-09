// src/components/blog/CardBlog.tsx

import React from "react";
import type Blog from "src/models/Blog";
import { config } from "config";
import { getBlogHref, getBlogImageUrl } from "src/utils/blog";

interface CardBlogProps {
  blog: Blog;
}

const CardBlog: React.FC<CardBlogProps> = React.memo(({ blog }) => {

  const imageUrl = getBlogImageUrl(blog.miniatura);

  const altText = blog.titulo || "Imagen del blog";

  return (
    <a
      href={getBlogHref(blog.link)}
      title="Ver detalles del blog"
      className="mb-6 block group"
    >
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm 
                      transition-all duration-400 ease-out
                      hover:shadow-[0_15px_40px_-12px_rgba(0,120,111,0.25)] hover:-translate-y-1 hover:border-teal-300/60">
        <div className="flex flex-col md:flex-row min-w-0">
          <div className="md:w-1/3 w-full p-4 md:p-6 flex items-center justify-center min-w-0">
            <figure className="w-full h-48 md:h-56 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={altText}
                title={altText}
                loading="lazy"
                decoding="async"
                width={350}
                height={280}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </figure>
          </div>
          <div className="md:w-2/3 w-full p-6 md:p-8 flex flex-col justify-center min-w-0">
            {blog.nombre_producto && (
              <div className="mb-4">
                <span className="inline-block bg-teal-700 text-white text-sm font-medium px-4 py-1.5 rounded-md
                                 transition-all duration-300 group-hover:bg-teal-800 group-hover:shadow-md">
                  {blog.nombre_producto}
                </span>
              </div>
            )}
            <h3 className="text-teal-700 text-xl md:text-2xl font-bold mb-3 leading-tight transition-colors duration-300 group-hover:text-teal-800 break-words">
              {blog.subtitulo1}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed mb-4 break-words">
              {blog.subtitulo2}
            </p>
            {blog.created_at && (
              <p className="text-gray-500 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {(() => {
                  const parts = blog.created_at.split(/[- :T]/);
                  const year = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const day = parseInt(parts[2]);
                  return new Date(year, month, day).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                })()}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
});


export default CardBlog;