import { config } from "../../../../config.ts";
import apiClient from "../../../services/apiClient.ts";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { validateImage } from "../../../utils/imageValidation.ts";
import Swal from "sweetalert2";
import { IoMdCloseCircle } from "react-icons/io";
import RichTextEditor, { type RichTextEditorHandle } from "../productos/RichTextEditor.tsx";
import InsertLinkModal from "../ui/insertLinkModal.tsx";
import ProductLinkModal from "../ui/productLinkModal.tsx";

/* ============================ Tipos ============================ */
interface ImagenAdicional {
  imagen: File | null;
  parrafo: string;
  img_alt: string;
  img_nombre: string;
  img_tittle: string;
  url?: string;
  id?: number | string;
}

interface BlogPOST {
  titulo: string;
  link: string;
  subtitulo1: string; // Párrafo corto
  subtitulo2: string; // Descripción
  video_titulo: string;
  video_url: string;
  producto_id: number | string;
  created_at: string;
  miniatura: File | string | null;
  miniatura_nombre: string;
  miniatura_alt: string;
  miniatura_tittle: string;
  hero_image: File | string | null;
  hero_image_nombre: string;
  hero_image_alt: string;
  hero_image_tittle: string;
  imagenes: ImagenAdicional[];
  etiqueta: {
    meta_titulo: string;
    meta_descripcion: string;
    popup_button_text: string;
    popup_button_color: string;
    popup_text_color: string;
  };
}

interface AddBlogModalProps {
  onBlogAdded: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  blogToEdit?: any;
}

type Errors = Record<string, string>;
type MetaKind = "nombre" | "alt" | "tittle";

/* ====== Límites centralizados ====== */
const LENGTHS = {
  titulo: 255,
  link: 255,
  parrafo: 255, // subtitulo1
  descripcion: 500, // subtitulo2
  videoTitulo: 255,
  videoUrl: 255,
  metaTitulo: 255,
  metaDescripcion: 500,
  popupButtonText: 50,
  imagenMeta: 120, // nombre/alt/título de miniatura e imagen principal
};

/** Si el backend NO exige alt/título en las imágenes de sección, pásalo a false. */
const SECTION_IMG_META_REQUIRED = true;
const DRAFT_KEY = "tami:blog-draft:v1";
const META_KEY = { nombre: "img_nombre", alt: "img_alt", tittle: "img_tittle" } as const;

/* ============================ Utilidades ============================ */
const isValidUrl = (value: string) => {
  try {
    const u = new URL(value);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
};

const noAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slugify = (s: string) =>
  noAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, LENGTHS.link);
const cleanLinkInput = (s: string) =>
  noAccents(s).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
const stripHtml = (h: string) => h.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const today = () => new Date().toISOString().split("T")[0];

const emptySection = (): ImagenAdicional => ({
  imagen: null,
  parrafo: "",
  img_alt: "",
  img_nombre: "",
  img_tittle: "",
});

const emptyForm = (): BlogPOST => ({
  titulo: "",
  link: "",
  subtitulo1: "",
  subtitulo2: "",
  video_url: "",
  video_titulo: "",
  producto_id: "",
  created_at: today(),
  miniatura: null,
  miniatura_nombre: "",
  miniatura_alt: "",
  miniatura_tittle: "",
  hero_image: null,
  hero_image_nombre: "",
  hero_image_alt: "",
  hero_image_tittle: "",
  imagenes: [emptySection(), emptySection()],
  etiqueta: {
    meta_titulo: "",
    meta_descripcion: "",
    popup_button_text: "",
    popup_button_color: "#47ce36",
    popup_text_color: "#ffffff",
  },
});

// Asegura 2 secciones para el blog
const normalizeImagenes = (imagenes: any[] = [], blogToEdit: any): ImagenAdicional[] => {
  const base: ImagenAdicional[] = imagenes.map((img: any, index: number) => {
    const raw = img.ruta_imagen || "";
    return {
      imagen: null,
      parrafo: blogToEdit?.parrafos?.[index]?.parrafo || "",
      img_alt: img.img_alt || "",
      img_nombre: img.img_nombre || "",
      img_tittle: img.img_tittle || "",
      url: raw ? (raw.startsWith("http") ? raw : `${import.meta.env.PUBLIC_API_URL}${raw}`) : "",
      id: img.id || img.imagen_id,
    };
  });
  while (base.length < 2) base.push(emptySection());
  return base;
};

/* ---- Borrador (solo textos; los archivos no se pueden guardar) ---- */
const toDraft = (f: BlogPOST) => ({
  titulo: f.titulo,
  link: f.link,
  subtitulo1: f.subtitulo1,
  subtitulo2: f.subtitulo2,
  video_titulo: f.video_titulo,
  video_url: f.video_url,
  producto_id: String(f.producto_id ?? ""),
  miniatura_nombre: f.miniatura_nombre,
  miniatura_alt: f.miniatura_alt,
  miniatura_tittle: f.miniatura_tittle,
  hero_image_nombre: f.hero_image_nombre,
  hero_image_alt: f.hero_image_alt,
  hero_image_tittle: f.hero_image_tittle,
  etiqueta: f.etiqueta,
  imagenes: f.imagenes.map(({ parrafo, img_alt, img_nombre, img_tittle }) => ({
    parrafo,
    img_alt,
    img_nombre,
    img_tittle,
  })),
});
const EMPTY_DRAFT = JSON.stringify(toDraft(emptyForm()));

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
};

/* ============================ Validación ============================ */
const validate = (f: BlogPOST, isEdit: boolean) => {
  const errors: Errors = {};
  const keys: string[] = [];
  let total = 0;
  const check = (key: string, bad: boolean, msg: string) => {
    total++;
    keys.push(key);
    if (bad) errors[key] = msg;
  };

  // El orden de estas comprobaciones = orden visual del formulario
  check("titulo", !f.titulo.trim(), "El título es obligatorio.");
  check("link", !slugify(f.link), "El link permanente es obligatorio.");
  check("created_at", !f.created_at, "La fecha es obligatoria.");
  check("producto_id", !f.producto_id, "Selecciona un producto.");
  if (!isEdit) check("miniatura", !f.miniatura, "La miniatura es obligatoria.");
  if (!isEdit) check("hero_image", !f.hero_image, "La imagen principal es obligatoria.");
  check("subtitulo1", !f.subtitulo1.trim(), "El párrafo corto es obligatorio.");
  check("subtitulo2", !f.subtitulo2.trim(), "La descripción es obligatoria.");
  f.imagenes.forEach((s, i) => {
    check(`img_${i}`, !s.imagen && !s.id, "Sube la imagen de esta sección.");
    if (SECTION_IMG_META_REQUIRED) {
      check(`tit_${i}`, !s.img_tittle.trim(), "El título de la imagen es obligatorio.");
      check(`alt_${i}`, !s.img_alt.trim(), "El alt de la imagen es obligatorio.");
    }
    check(`par_${i}`, !stripHtml(s.parrafo), "El párrafo de la sección es obligatorio.");
  });
  check("video_titulo", !f.video_titulo.trim(), "El título del video es obligatorio.");
  check(
    "video_url",
    !isValidUrl(f.video_url),
    f.video_url ? "Ingresa una URL válida (https://...)." : "La URL del video es obligatoria.",
  );
  return { errors, total, keys };
};

/* ============================ Subcomponentes ============================ */
interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  count?: number;
  max?: number;
  softMax?: number;
  softHint?: string;
  className?: string;
  children: ReactNode;
}

const Field = ({ id, label, required, error, hint, count, max, softMax, softHint, className = "", children }: FieldProps) => {
  const overSoft = softMax !== undefined && count !== undefined && count > softMax;
  return (
    <div
      id={`field-${id}`}
      className={`form-input scroll-mt-24 [&_input]:!rounded-xl [&_textarea]:!rounded-xl [&_select]:!rounded-xl ${className} ${
        error ? "[&_input]:!border-red-500 [&_textarea]:!border-red-500 [&_select]:!border-red-500" : ""
      }`}
    >
      <label htmlFor={id} className="font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      <div className="flex justify-between gap-2 mt-1 text-xs min-h-4">
        <span
          role={error ? "alert" : undefined}
          className={error ? "text-red-600 dark:text-red-400" : overSoft ? "text-amber-600" : "text-gray-500"}
        >
          {error || (overSoft ? softHint : hint)}
        </span>
        {max !== undefined && count !== undefined && (
          <span className={overSoft ? "text-amber-600" : "text-gray-400 dark:text-gray-500"}>
            {count}/{max}
          </span>
        )}
      </div>
    </div>
  );
};

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  max?: number;
  type?: string;
  placeholder?: string;
  hint?: string;
  softMax?: number;
  softHint?: string;
  rows?: number;
  className?: string;
}

const TextField = ({ rows, type = "text", ...p }: TextFieldProps) => {
  const common = {
    id: p.id,
    value: p.value,
    maxLength: p.max,
    placeholder: p.placeholder,
    onBlur: p.onBlur,
    "aria-invalid": !!p.error,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => p.onChange(e.target.value),
  };
  return (
    <Field
      id={p.id}
      label={p.label}
      required={p.required}
      error={p.error}
      hint={p.hint}
      softMax={p.softMax}
      softHint={p.softHint}
      className={p.className}
      max={p.max}
      count={p.max !== undefined ? p.value.length : undefined}
    >
      {rows ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
    </Field>
  );
};

const Section = ({
  id,
  title,
  desc,
  children,
  className = "",
}: {
  id: string;
  title: string;
  desc?: string;
  children: ReactNode;
  className?: string;
}) => (
  <section
    id={id}
    className={`scroll-mt-24 bg-white dark:bg-gray-800/40 p-5 rounded-3xl border border-gray-200/70 dark:border-gray-700/60 shadow-sm transition-shadow hover:shadow-md ${className}`}
  >
    <header className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
      <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400">{title}</h3>
      {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
    </header>
    {children}
  </section>
);

interface ImageUploaderProps {
  id: string;
  label: string;
  required?: boolean;
  value: File | string | null | undefined;
  kind: "miniatura" | "webpOnly";
  recs: string[];
  error?: string;
  onPick: (f: File) => void;
  onRemove: () => void;
}

const ImageUploader = ({ id, label, required, value, kind, recs, error, onPick, onRemove }: ImageUploaderProps) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (value instanceof File) {
      const u = URL.createObjectURL(value);
      setSrc(u);
      return () => URL.revokeObjectURL(u);
    }
    setSrc(typeof value === "string" && value ? (value.startsWith("http") ? value : `${config.apiUrl}${value}`) : "");
  }, [value]);

  const handlePick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateImage(f, kind)) onPick(f);
    e.target.value = ""; // permite volver a elegir el mismo archivo
  };

  return (
    <div id={`field-${id}`} className="scroll-mt-24">
      <span className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <div className="relative group">
        <input id={`${id}-file`} type="file" accept="image/*" className="hidden" onChange={handlePick} />
        <label
          htmlFor={`${id}-file`}
          className={`cursor-pointer block text-center border-2 border-dashed rounded-2xl p-4 bg-white dark:bg-gray-900 transition-colors ${
            error
              ? "border-red-400 bg-red-50 dark:bg-red-900/10"
              : "border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-gray-800"
          }`}
        >
          {src ? (
            <div className="relative flex justify-center">
              <img src={src} alt={`Vista previa: ${label}`} className="h-40 object-cover rounded shadow-md" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-teal-500 text-white px-3 py-1 rounded text-sm font-semibold">Cambiar imagen</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <span className="font-medium text-gray-500 dark:text-gray-400">Click aquí para subir la imagen</span>
              <ul className="text-xs text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 w-full space-y-0.5 text-left">
                <li>💡 Recomendación:</li>
                {recs.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </label>
        {src && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar imagen"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white"
          >
            ×
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

interface ImageMetaProps {
  ids: Record<MetaKind, string>;
  values: Record<MetaKind, string>;
  max: number;
  requiredAltTitle?: boolean;
  onChange: (k: MetaKind, v: string) => void;
  err: (k: string) => string | undefined;
  touch: (k: string) => void;
}

const ImageMeta = ({ ids, values, max, requiredAltTitle, onChange, err, touch }: ImageMetaProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mt-4">
    <TextField
      id={ids.nombre}
      label="Nombre de la imagen"
      value={values.nombre}
      max={max}
      className="md:col-span-2 lg:col-span-1"
      onChange={(v) => onChange("nombre", v)}
    />
    <TextField
      id={ids.tittle}
      label="Título de la imagen"
      required={requiredAltTitle}
      value={values.tittle}
      max={max}
      error={err(ids.tittle)}
      onBlur={() => touch(ids.tittle)}
      onChange={(v) => onChange("tittle", v)}
    />
    <TextField
      id={ids.alt}
      label="Alt de la imagen"
      required={requiredAltTitle}
      value={values.alt}
      max={max}
      hint="Describe brevemente lo que se ve en la imagen"
      error={err(ids.alt)}
      onBlur={() => touch(ids.alt)}
      onChange={(v) => onChange("alt", v)}
    />
  </div>
);

/* ============================ Componente principal ============================ */
const AddBlogModal = ({ onBlogAdded, isOpen: propIsOpen, onClose, blogToEdit }: AddBlogModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [formData, setFormData] = useState<BlogPOST>(emptyForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [linkManual, setLinkManual] = useState(false);
  const [eliminarMiniatura, setEliminarMiniatura] = useState(false);
  const [eliminarHeroImage, setEliminarHeroImage] = useState(false);

  // Modales de enlaces
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductLinkModalOpen, setIsProductLinkModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [link, setLink] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");

  const editorRefs = useRef<(RichTextEditorHandle | null)[]>([]);
  const draftReady = useRef(true);

  const isEdit = !!blogToEdit;
  const handleClose = onClose ? onClose : () => setIsOpen(false);

  /* ---- Helpers de estado ---- */
  const set = (patch: Partial<BlogPOST>) => setFormData((p) => ({ ...p, ...patch }));
  const setEtiqueta = (patch: Partial<BlogPOST["etiqueta"]>) =>
    setFormData((p) => ({ ...p, etiqueta: { ...p.etiqueta, ...patch } }));
  const setSection = (i: number, patch: Partial<ImagenAdicional>) =>
    setFormData((p) => ({ ...p, imagenes: p.imagenes.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }));

  /* ---- Validación en vivo ---- */
  const { errors, total, keys } = useMemo(() => validate(formData, isEdit), [formData, isEdit]);
  const errorKeys = Object.keys(errors);
  const done = total - errorKeys.length;
  const err = (k: string) => (submitted || touched[k] ? errors[k] : undefined);
  // Validación progresiva: al entrar a un campo, los anteriores que sigan incompletos se marcan en rojo
  const touchBefore = (fieldId: string) => {
    const idx = keys.indexOf(fieldId);
    if (idx <= 0) return;
    setTouched((t) => {
      const n = { ...t };
      keys.slice(0, idx).forEach((k) => (n[k] = true));
      return n;
    });
  };

  /* ---- Sincroniza apertura controlada ---- */
  useEffect(() => {
    if (propIsOpen !== undefined) setIsOpen(propIsOpen);
  }, [propIsOpen]);

  /* ---- Al abrir: carga productos y datos iniciales ---- */
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const { data } = await apiClient.get(config.endpoints.productos.list);
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.productos)
              ? data.data.productos
              : [];
        setProductos(lista);
      } catch (e) {
        console.error("🚫 Error en FETCH productos:", e);
        setProductos([]);
      }
    })();

    setTouched({});
    setSubmitted(false);
    setDraftSaved(false);
    setEliminarMiniatura(false);
    setEliminarHeroImage(false);

    if (blogToEdit) {
      draftReady.current = false; // nunca guardar borradores al editar
      setLinkManual(true);
      setFormData({
        titulo: blogToEdit.titulo || "",
        link: blogToEdit.link || "",
        subtitulo1: blogToEdit.subtitulo1 || "",
        subtitulo2: blogToEdit.subtitulo2 || "",
        video_url: blogToEdit.video_url || "",
        video_titulo: blogToEdit.video_titulo || "",
        producto_id: blogToEdit.producto_id ? String(blogToEdit.producto_id) : "",
        created_at: blogToEdit.created_at ? blogToEdit.created_at.split(/[ T]/)[0] : today(),
        miniatura: blogToEdit.miniatura || null,
        miniatura_nombre: blogToEdit.miniatura_nombre || "",
        miniatura_alt: blogToEdit.miniatura_alt || "",
        miniatura_tittle: blogToEdit.miniatura_tittle || "",
        hero_image: blogToEdit.hero_image || null,
        hero_image_nombre: blogToEdit.hero_image_nombre || "",
        hero_image_alt: blogToEdit.hero_image_alt || "",
        hero_image_tittle: blogToEdit.hero_image_tittle || "",
        imagenes: normalizeImagenes(blogToEdit.imagenes || [], blogToEdit),
        etiqueta: {
          meta_titulo: blogToEdit.etiqueta?.meta_titulo || "",
          meta_descripcion: blogToEdit.etiqueta?.meta_descripcion || "",
          popup_button_text: blogToEdit.etiqueta?.popup_button_text || "",
          popup_button_color: blogToEdit.etiqueta?.popup_button_color || "#47ce36",
          popup_text_color: blogToEdit.etiqueta?.popup_text_color || "#ffffff",
        },
      });
      return;
    }

    // Creación: ¿hay un borrador pendiente?
    setLinkManual(false);
    setFormData(emptyForm());
    const draft = readDraft();
    if (!draft) {
      draftReady.current = true;
      return;
    }
    draftReady.current = false;
    Swal.fire({
      icon: "question",
      title: "Tienes un borrador sin guardar",
      text: "¿Quieres continuar donde lo dejaste? (las imágenes deberás subirlas de nuevo)",
      showCancelButton: true,
      confirmButtonText: "Recuperar borrador",
      cancelButtonText: "Empezar de cero",
    }).then((r) => {
      if (r.isConfirmed) {
        const base = emptyForm();
        setFormData({
          ...base,
          ...draft,
          imagenes: base.imagenes.map((s, i) => ({ ...s, ...(draft.imagenes?.[i] || {}) })),
        });
        setLinkManual(!!draft.link);
      } else {
        clearDraft();
      }
      draftReady.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, blogToEdit]);

  /* ---- En edición: si el blog solo trae el nombre del producto, resolver el id ---- */
  useEffect(() => {
    if (!blogToEdit || formData.producto_id || !productos.length) return;
    const p = productos.find((x) => x.nombre === blogToEdit.nombre_producto);
    if (p) set({ producto_id: String(p.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, blogToEdit, formData.producto_id]);

  /* ---- Autoguardado de borrador (solo creación) ---- */
  useEffect(() => {
    if (!isOpen || isEdit || !draftReady.current) return;
    const payload = JSON.stringify(toDraft(formData));
    if (payload === EMPTY_DRAFT) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, payload);
        setDraftSaved(true);
      } catch {
        /* storage lleno o bloqueado: se ignora */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [formData, isOpen, isEdit]);

  /* ---- Navegación ---- */
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToError = (key: string) => {
    document.getElementById(`field-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => document.getElementById(key)?.focus({ preventScroll: true }), 350);
  };

  const groups = [
    { id: "sec-general", label: "General", keys: ["titulo", "link", "created_at", "producto_id"] },
    { id: "sec-seo", label: "SEO", keys: [] as string[] },
    { id: "sec-miniatura", label: "Miniatura", keys: ["miniatura"] },
    { id: "sec-hero", label: "Imagen principal", keys: ["hero_image"] },
    { id: "sec-textos", label: "Textos", keys: ["subtitulo1", "subtitulo2"] },
    ...formData.imagenes.map((_, i) => ({
      id: `sec-s${i}`,
      label: `Sección ${i + 1}`,
      keys: [`img_${i}`, `tit_${i}`, `alt_${i}`, `par_${i}`],
    })),
    { id: "sec-video", label: "Video", keys: ["video_titulo", "video_url"] },
    { id: "sec-boton", label: "Botón", keys: [] as string[] },
  ];

  /* ---- Sección activa (resalta el chip mientras haces scroll) ---- */
  const [activeId, setActiveId] = useState("sec-general");
  const idsKey = groups.map((g) => g.id).join("|");
  useEffect(() => {
    if (!isOpen) return;
    const els = idsKey
      .split("|")
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActiveId(en.target.id)),
      { rootMargin: "-15% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isOpen, idsKey]);
  useEffect(() => {
    document.getElementById(`chip-${activeId}`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeId]);

  /* ---- Título y link ---- */
  const onTitleChange = (v: string) => {
    set({ titulo: v, ...(!linkManual && !isEdit ? { link: slugify(v) } : {}) });
  };
  const onLinkChange = (v: string) => {
    setLinkManual(v !== ""); // si lo vacía, vuelve a autogenerarse
    set({ link: cleanLinkInput(v).slice(0, LENGTHS.link) });
  };

  /* ---- Enlaces dentro del editor ---- */
  const requireSelection = (index: number) => {
    const selected = editorRefs.current[index]?.getSelectedText() ?? "";
    if (!selected) {
      Swal.fire("Selecciona texto", "Selecciona texto para enlazar.", "warning");
      return null;
    }
    setActiveIndex(index);
    setSelectedText(selected);
    return selected;
  };
  const handleInsertLinkClick = (index: number) => {
    if (requireSelection(index)) setIsModalOpen(true);
  };
  const handleProductLinkClick = (index: number) => {
    if (requireSelection(index)) setIsProductLinkModalOpen(true);
  };
  const handleAddProduct = () => {
    if (activeIndex === null) return;
    if (!selectedProductId) {
      Swal.fire("ID de producto vacío", "Selecciona un producto.", "error");
      return;
    }
    // Se busca el producto elegido en el modal (no el producto relacionado del blog)
    const producto = productos.find((p) => String(p.id) === String(selectedProductId));
    if (!producto) {
      Swal.fire("Producto no encontrado", "No se encontró el producto.", "error");
      return;
    }
    if (!producto.link) {
      Swal.fire("Producto sin enlace", "El producto seleccionado no tiene un enlace válido.", "error");
      return;
    }
    editorRefs.current[activeIndex]?.insertLink(`/catalogo-maquinarias/detalle?link=${producto.link}`);
    setIsProductLinkModalOpen(false);
    setSelectedText("");
    setSelectedProductId("");
    setActiveIndex(null);
  };
  const handleAddLink = () => {
    if (activeIndex === null) return;
    if (!link.trim() || !isValidUrl(link.trim())) {
      Swal.fire("Enlace inválido", "Ingresa una URL válida.", "error");
      return;
    }
    editorRefs.current[activeIndex]?.insertLink(link.trim());
    setIsModalOpen(false);
    setLink("");
    setSelectedText("");
    setActiveIndex(null);
  };

  /* ---- Envío ---- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (errorKeys.length) {
      scrollToError(errorKeys[0]);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: `Faltan ${errorKeys.length} campo(s) obligatorio(s)`,
        showConfirmButton: false,
        timer: 3500,
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = isEdit ? `${config.endpoints.blogs.list}/${blogToEdit.id}` : config.endpoints.blogs.create;
      const fd = new FormData();
      const { etiqueta: et } = formData;

      fd.append("titulo", formData.titulo);
      fd.append("link", formData.link.replace(/^-+|-+$/g, ""));
      fd.append("subtitulo1", formData.subtitulo1);
      fd.append("subtitulo2", formData.subtitulo2);
      fd.append("video_url", formData.video_url || "");
      fd.append("video_titulo", formData.video_titulo || "");
      fd.append("meta_titulo", et.meta_titulo);
      fd.append("meta_descripcion", et.meta_descripcion);
      fd.append("producto_id", formData.producto_id.toString());
      fd.append("popup_button_text", et.popup_button_text || "");
      fd.append("popup_button_color", et.popup_button_color || "#47ce36");
      fd.append("popup_text_color", et.popup_text_color || "#ffffff");
      if (formData.created_at) fd.append("created_at", formData.created_at);

      if (formData.miniatura instanceof File) fd.append("miniatura", formData.miniatura);
      if (isEdit && eliminarMiniatura && !(formData.miniatura instanceof File)) fd.append("eliminar_miniatura", "1");
      // NOTA: nombres de campo asumidos para el backend; ajustar si espera otras claves.
      fd.append("miniatura_nombre", formData.miniatura_nombre || "");
      fd.append("miniatura_alt", formData.miniatura_alt || "");
      fd.append("miniatura_tittle", formData.miniatura_tittle || "");

      if (formData.hero_image instanceof File) fd.append("hero_image", formData.hero_image);
      if (isEdit && eliminarHeroImage && !(formData.hero_image instanceof File)) fd.append("eliminar_hero_image", "1");
      fd.append("hero_image_nombre", formData.hero_image_nombre || "");
      fd.append("hero_image_alt", formData.hero_image_alt || "");
      fd.append("hero_image_tittle", formData.hero_image_tittle || "");

      formData.imagenes.forEach((item) => {
        fd.append("imagen_tipo[]", item.imagen instanceof File ? "file" : "existing");
        fd.append("img_alt[]", item.img_alt || "");
        fd.append("img_nombre[]", item.img_nombre || "");
        fd.append("img_tittle[]", item.img_tittle || "");
        if (item.imagen instanceof File) fd.append("imagenes[]", item.imagen);
        else if (item.id) fd.append("imagen_ids[]", item.id.toString());
        fd.append("parrafos[]", item.parrafo || "");
      });

      if (isEdit) fd.append("_method", "PUT");

      const response = await apiClient.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });

      await Swal.fire({
        icon: "success",
        title: isEdit ? "Blog actualizado con éxito" : "Blog creado con éxito",
        text: `El blog "${response.data?.data?.titulo ?? formData.titulo}" ha sido ${
          isEdit ? "actualizado" : "creado"
        } correctamente.`,
        confirmButtonColor: "#3085d6",
      });
      clearDraft();
      setIsOpen(false);
      onBlogAdded();
    } catch (error: any) {
      console.error("Error al enviar el blog:", error);
      const serverErrors = error.response?.data?.errors;
      const lines: string[] = serverErrors
        ? Object.entries(serverErrors).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
        : [error.response?.data?.message || error.message || "Ocurrió un error al procesar la solicitud."];

      Swal.fire({
        icon: "error",
        title: "No se pudo guardar el blog",
        html: `<div style="text-align:left">${lines.map((l) => `• ${esc(l)}`).join("<br>")}</div>`,
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pct = total ? Math.round((done / total) * 100) : 0;
  const stateStyle = {
    ok: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300",
    bad: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300",
    pending: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
    opt: "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
  };
  const stateIcon = { ok: "✓", bad: "!", pending: "○", opt: "·" };

  return (
    <>
      {(isOpen || propIsOpen) && (
        <div className="dialog-overlay">
          <div className="dialog-blog max-h-[90vh] md:max-h-[92vh] lg:!w-[min(1180px,95vw)] lg:!max-w-none">
            <div className="dialog-header-blog flex items-center justify-between">
              <h2 className="dialog-title flex-1 text-center">{isEdit ? "Editar Blog" : "Añadir Nuevo Blog"}</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-white hover:text-red-400 transition-all duration-300 hover:cursor-pointer text-3xl md:text-4xl ml-2"
                aria-label="Cerrar"
              >
                <IoMdCloseCircle />
              </button>
            </div>

            <div className="dialog-body-blog scroll-smooth">
              {/* Navegación por secciones con estado */}
              <nav
                aria-label="Secciones del formulario"
                className="sticky top-1 z-10 mb-4 flex gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md shadow-sm p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {groups.map((g) => {
                  const bad = g.keys.filter((k) => errors[k]).length;
                  const state = !g.keys.length ? "opt" : bad === 0 ? "ok" : submitted ? "bad" : "pending";
                  return (
                    <button
                      key={g.id}
                      id={`chip-${g.id}`}
                      type="button"
                      onClick={() => goTo(g.id)}
                      className={`shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 ${stateStyle[state]} ${activeId === g.id ? "ring-2 ring-teal-400/70 shadow-sm" : ""}`}
                    >
                      {stateIcon[state]} {g.label}
                      {(state === "bad" || state === "pending") && ` (${bad})`}
                    </button>
                  );
                })}
              </nav>

              <form
                encType="multipart/form-data"
                onSubmit={handleSubmit}
                onFocus={(e) => {
                  const w = (e.target as HTMLElement).closest('[id^="field-"]');
                  if (w) touchBefore(w.id.replace("field-", ""));
                }}
                noValidate
                className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
              >
                {/* --- INFORMACIÓN GENERAL --- */}
                <Section id="sec-general" title="Información general">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <TextField
                      id="titulo"
                      label="Título del blog"
                      required
                      value={formData.titulo}
                      max={LENGTHS.titulo}
                      error={err("titulo")}
                      onBlur={() => touch("titulo")}
                      onChange={onTitleChange}
                    />
                    <TextField
                      id="link"
                      label="Link permanente"
                      required
                      value={formData.link}
                      max={LENGTHS.link}
                      hint="Se genera desde el título; puedes editarlo"
                      error={err("link")}
                      onBlur={() => touch("link")}
                      onChange={onLinkChange}
                    />
                    <TextField
                      id="created_at"
                      type="date"
                      label="Fecha de creación"
                      required
                      value={formData.created_at}
                      error={err("created_at")}
                      onBlur={() => touch("created_at")}
                      onChange={(v) => set({ created_at: v })}
                    />
                    <Field id="producto_id" label="Relacionar con producto" required error={err("producto_id")}>
                      <select
                        id="producto_id"
                        value={String(formData.producto_id)}
                        aria-invalid={!!err("producto_id")}
                        onChange={(e) => {
                          set({ producto_id: e.target.value });
                          touch("producto_id");
                        }}
                        onBlur={() => touch("producto_id")}
                      >
                        <option value="">Selecciona un producto</option>
                        {productos.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                {/* --- SEO --- */}
                <Section id="sec-seo" title="Optimización SEO" desc="Opcional, pero recomendado para posicionar el blog.">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <TextField
                      id="meta_titulo"
                      label="Meta título"
                      value={formData.etiqueta.meta_titulo}
                      max={LENGTHS.metaTitulo}
                      softMax={60}
                      softHint="Google suele cortar el título pasados ~60 caracteres"
                      hint="Ideal: hasta ~60 caracteres"
                      onChange={(v) => setEtiqueta({ meta_titulo: v })}
                    />
                    <TextField
                      id="meta_descripcion"
                      label="Meta descripción"
                      value={formData.etiqueta.meta_descripcion}
                      max={LENGTHS.metaDescripcion}
                      softMax={160}
                      softHint="Google suele cortar la descripción pasados ~160 caracteres"
                      hint="Ideal: hasta ~160 caracteres"
                      onChange={(v) => setEtiqueta({ meta_descripcion: v })}
                    />
                  </div>
                </Section>

                {/* --- MINIATURA --- */}
                <Section id="sec-miniatura" title="Miniatura" desc="Imagen que se muestra en el listado de blogs.">
                  <ImageUploader
                    id="miniatura"
                    label="Miniatura del blog"
                    required={!isEdit}
                    kind="miniatura"
                    value={formData.miniatura}
                    recs={["Formatos: WEBP o GIF", "Tamaño ideal: 960x540 px", "Máximo: 2 MB"]}
                    error={err("miniatura")}
                    onPick={(f) => {
                      set({ miniatura: f });
                      setEliminarMiniatura(false);
                      touch("miniatura");
                    }}
                    onRemove={() => {
                      set({ miniatura: null, miniatura_nombre: "", miniatura_alt: "", miniatura_tittle: "" });
                      setEliminarMiniatura(true);
                      touch("miniatura");
                    }}
                  />
                  <ImageMeta
                    ids={{ nombre: "miniatura_nombre", alt: "miniatura_alt", tittle: "miniatura_tittle" }}
                    values={{
                      nombre: formData.miniatura_nombre,
                      alt: formData.miniatura_alt,
                      tittle: formData.miniatura_tittle,
                    }}
                    max={LENGTHS.imagenMeta}
                    err={err}
                    touch={touch}
                    onChange={(k, v) => set({ [`miniatura_${k}`]: v } as Partial<BlogPOST>)}
                  />
                </Section>

                {/* --- IMAGEN PRINCIPAL --- */}
                <Section id="sec-hero" title="Imagen principal" desc="Contenido del blog · imagen de portada dentro del artículo.">
                  <ImageUploader
                    id="hero_image"
                    label="Imagen principal del blog"
                    required={!isEdit}
                    kind="miniatura"
                    value={formData.hero_image}
                    recs={["Formatos: WEBP o GIF", "Tamaño ideal: 960x540 px", "Máximo: 2 MB"]}
                    error={err("hero_image")}
                    onPick={(f) => {
                      set({ hero_image: f });
                      setEliminarHeroImage(false);
                      touch("hero_image");
                    }}
                    onRemove={() => {
                      set({ hero_image: null, hero_image_nombre: "", hero_image_alt: "", hero_image_tittle: "" });
                      setEliminarHeroImage(true);
                      touch("hero_image");
                    }}
                  />
                  <ImageMeta
                    ids={{ nombre: "hero_image_nombre", alt: "hero_image_alt", tittle: "hero_image_tittle" }}
                    values={{
                      nombre: formData.hero_image_nombre,
                      alt: formData.hero_image_alt,
                      tittle: formData.hero_image_tittle,
                    }}
                    max={LENGTHS.imagenMeta}
                    err={err}
                    touch={touch}
                    onChange={(k, v) => set({ [`hero_image_${k}`]: v } as Partial<BlogPOST>)}
                  />
                </Section>

                {/* --- TEXTOS INTRODUCTORIOS --- */}
                <Section id="sec-textos" title="Textos introductorios" className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      id="subtitulo1"
                      label="Párrafo corto"
                      required
                      rows={3}
                      value={formData.subtitulo1}
                      max={LENGTHS.parrafo}
                      error={err("subtitulo1")}
                      onBlur={() => touch("subtitulo1")}
                      onChange={(v) => set({ subtitulo1: v })}
                    />
                    <TextField
                      id="subtitulo2"
                      label="Descripción"
                      required
                      rows={4}
                      value={formData.subtitulo2}
                      max={LENGTHS.descripcion}
                      error={err("subtitulo2")}
                      onBlur={() => touch("subtitulo2")}
                      onChange={(v) => set({ subtitulo2: v })}
                    />
                  </div>
                </Section>

                {/* --- SECCIONES (imagen + párrafo) --- */}
                {formData.imagenes.map((s, i) => (
                  <Section
                    key={i}
                    id={`sec-s${i}`}
                    title={`Sección ${i + 1}`}
                    desc="Imagen, datos SEO de la imagen y párrafo de esta sección."
                  >
                    <ImageUploader
                      id={`img_${i}`}
                      label="Imagen de la sección"
                      required
                      kind="webpOnly"
                      value={s.imagen ?? (s.url || null)}
                      recs={["Formatos: WEBP", "Tamaño ideal: 1200x800 px", "Máximo: 2 MB"]}
                      error={err(`img_${i}`)}
                      onPick={(f) => {
                        setSection(i, { imagen: f });
                        touch(`img_${i}`);
                      }}
                      onRemove={() => {
                        setSection(i, { id: undefined, imagen: null, url: "", img_alt: "", img_nombre: "", img_tittle: "" });
                        touch(`img_${i}`);
                      }}
                    />
                    <ImageMeta
                      ids={{ nombre: `nom_${i}`, alt: `alt_${i}`, tittle: `tit_${i}` }}
                      values={{ nombre: s.img_nombre, alt: s.img_alt, tittle: s.img_tittle }}
                      max={LENGTHS.titulo}
                      requiredAltTitle={SECTION_IMG_META_REQUIRED}
                      err={err}
                      touch={touch}
                      onChange={(k, v) => setSection(i, { [META_KEY[k]]: v })}
                    />

                    <div id={`field-par_${i}`} className="flex flex-col gap-2 mt-4 scroll-mt-24">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Párrafo de la sección<span className="text-red-500 ml-0.5">*</span>
                        </span>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => handleInsertLinkClick(i)}
                            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-2 py-1 rounded transition-colors font-medium"
                          >
                            Insertar Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProductLinkClick(i)}
                            className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 px-2 py-1 rounded transition-colors font-medium"
                          >
                            Link Producto
                          </button>
                        </div>
                      </div>
                      <div className={`rounded-2xl transition-shadow ${err(`par_${i}`) ? "ring-2 ring-red-400" : "ring-1 ring-gray-200 dark:ring-gray-700"}`}>
                        <RichTextEditor
                          ref={(el: RichTextEditorHandle | null) => {
                            editorRefs.current[i] = el;
                          }}
                          value={s.parrafo}
                          onChange={(html: string) => {
                            setSection(i, { parrafo: html });
                            touch(`par_${i}`);
                          }}
                        />
                      </div>
                      {err(`par_${i}`) && (
                        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                          {err(`par_${i}`)}
                        </p>
                      )}
                    </div>
                  </Section>
                ))}

                {/* --- MULTIMEDIA --- */}
                <Section id="sec-video" title="Multimedia">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    <TextField
                      id="video_titulo"
                      label="Título del video para YouTube"
                      required
                      value={formData.video_titulo}
                      max={LENGTHS.videoTitulo}
                      error={err("video_titulo")}
                      onBlur={() => touch("video_titulo")}
                      onChange={(v) => set({ video_titulo: v })}
                    />
                    <TextField
                      id="video_url"
                      label="URL del video"
                      required
                      value={formData.video_url}
                      max={LENGTHS.videoUrl}
                      placeholder="https://youtube.com/..."
                      error={err("video_url")}
                      onBlur={() => touch("video_url")}
                      onChange={(v) => set({ video_url: v })}
                    />
                  </div>
                </Section>

                {/* --- CONFIGURACIÓN DEL BOTÓN --- */}
                <Section
                  id="sec-boton"
                  title="Configuración del botón"
                  desc="Personaliza el texto y colores del botón de vista previa."
                >
                  <TextField
                    id="popup_button_text"
                    label="Texto del botón"
                    value={formData.etiqueta.popup_button_text}
                    max={LENGTHS.popupButtonText}
                    placeholder="Ver Producto"
                    onChange={(v) => setEtiqueta({ popup_button_text: v })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {(
                      [
                        ["popup_button_color", "Color del botón", "fondo"],
                        ["popup_text_color", "Color del texto", "texto"],
                      ] as const
                    ).map(([key, label, sub]) => (
                      <div
                        key={key}
                        className="p-4 rounded-xl bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 shadow-sm"
                      >
                        <span className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">{label}</span>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-600 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0">
                            <input
                              type="color"
                              aria-label={label}
                              value={formData.etiqueta[key]}
                              onChange={(e) => setEtiqueta({ [key]: e.target.value })}
                              className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-gray-500 dark:text-gray-400">Seleccionar</span>
                            <span className="text-gray-400">
                              {sub} · {formData.etiqueta[key]}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      style={{
                        backgroundColor: formData.etiqueta.popup_button_color,
                        color: formData.etiqueta.popup_text_color,
                      }}
                      className="px-6 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105"
                    >
                      {formData.etiqueta.popup_button_text || "ver producto"}
                    </button>
                  </div>
                </Section>

                {/* --- BARRA DE PROGRESO + ACCIONES (fija abajo) --- */}
                <div className="lg:col-span-2 sticky bottom-1 z-10 rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {done}/{total} campos obligatorios completos
                          {errorKeys.length > 0 && (
                            <b className="ml-1 font-semibold text-amber-600 dark:text-amber-400">· faltan {errorKeys.length}</b>
                          )}
                        </span>
                        {!isEdit && draftSaved && <span className="text-gray-400">Borrador guardado</span>}
                      </div>
                      <div
                        className="h-2 mt-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="neutral-btn w-full sm:w-auto !text-base !px-6 !py-2 !bg-amber-100 !text-amber-900 !border-amber-300 hover:!bg-amber-200 hover:!text-amber-950 dark:!bg-gray-700 dark:!text-gray-100 dark:!border-gray-500 dark:hover:!bg-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="admin-act-btn w-full sm:w-auto !text-base !px-6 !py-2 disabled:opacity-60 disabled:hover:cursor-not-allowed"
                      >
                        {isSaving ? "Guardando..." : "Guardar Blog"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <InsertLinkModal
        isOpen={isModalOpen}
        selectedText={selectedText}
        link={link}
        setLink={setLink}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleAddLink}
      />

      <ProductLinkModal
        isOpen={isProductLinkModalOpen}
        selectedText={selectedText}
        products={productos}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        onClose={() => setIsProductLinkModalOpen(false)}
        onConfirm={handleAddProduct}
      />
    </>
  );
};

export default AddBlogModal;