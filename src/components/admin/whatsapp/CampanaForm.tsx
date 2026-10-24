import React, { useState, useEffect } from 'react';

interface Producto {
    id: number;
    nombre: string;
}

export default function CampanaForm() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [isLoadingProductos, setIsLoadingProductos] = useState(true);
    const [isEnviando, setIsEnviando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

    const [form, setForm] = useState({
        producto_id: '',
        contenido_personalizado: '',
        imagen: null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);

    // Cargar productos
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await fetch(`${import.meta.env.PUBLIC_API_URL}/api/v1/productos`);
                const data = await response.json();
                setProductos(data);
            } catch (error) {
                console.error('Error al cargar productos:', error);
            } finally {
                setIsLoadingProductos(false);
            }
        };
        fetchProductos();
    }, []);

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setForm(prev => ({ ...prev, imagen: file }));

        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!form.producto_id) {
            setMensaje({ tipo: 'error', texto: 'Selecciona un producto.' });
            return;
        }
        if (!form.contenido_personalizado.trim()) {
            setMensaje({ tipo: 'error', texto: 'Escribe un mensaje para la campaña.' });
            return;
        }

        setIsEnviando(true);
        setMensaje(null);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setMensaje({
                    tipo: 'error',
                    texto: '❌ No se encontró el token de sesión. Inicia sesión nuevamente.',
                });
                return;
            }

            const formData = new FormData();
            formData.append('nombre', `Campaña producto ${form.producto_id}`);
            formData.append('producto_id', form.producto_id);
            formData.append('contenido_personalizado', form.contenido_personalizado);
            if (form.imagen) {
                formData.append('imagen', form.imagen);
            }

            const response = await fetch(
                `${import.meta.env.PUBLIC_API_URL}/api/v1/whatsapp/campañas/activar`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMensaje({
                    tipo: 'exito',
                    texto: `✅ Campaña activada. Se enviarán mensajes a ${data.data.total_clientes} cliente(s).`,
                });
                // Limpiar formulario
                setForm({ producto_id: '', contenido_personalizado: '', imagen: null });
                setPreview(null);
            } else {
                if (response.status === 401) {
                    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                }

                if (response.status === 403) {
                    throw new Error('No tienes permisos para activar la campaña.');
                }

                throw new Error(data.message || 'Error al activar la campaña');
            }
        } catch (error: any) {
            setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
        } finally {
            setIsEnviando(false);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                    Enviar Campaña por WhatsApp
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    El mensaje se enviará a todos los clientes asociados al producto seleccionado.
                </p>
            </div>

            {/* Mensaje de éxito o error */}
            {mensaje && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    mensaje.tipo === 'exito'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                    {mensaje.texto}
                </div>
            )}

            {/* Selector de producto */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Producto
                </label>
                <select
                    value={form.producto_id}
                    onChange={(e) => setForm(prev => ({ ...prev, producto_id: e.target.value }))}
                    disabled={isLoadingProductos || isEnviando}
                    className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50"
                >
                    <option value="">
                        {isLoadingProductos ? 'Cargando productos...' : '-- Selecciona un producto --'}
                    </option>
                    {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Mensaje personalizado */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje de la Campaña
                </label>
                <textarea
                    value={form.contenido_personalizado}
                    onChange={(e) => setForm(prev => ({ ...prev, contenido_personalizado: e.target.value }))}
                    disabled={isEnviando}
                    rows={5}
                    placeholder="Ej: Tenemos una oferta especial para ti en este producto..."
                    className="w-full px-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                    El mensaje se enviará como: <span className="font-semibold italic">"Hola [nombre del cliente], [tu mensaje]"</span>
                </p>
            </div>

            {/* Subir imagen */}
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Imagen (obligatorio)
                </label>

                <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    isEnviando
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10'
                } bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600`}>
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="h-full w-full object-contain rounded-xl p-1"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium">Haz clic para subir imagen</span>
                            <span className="text-xs mt-1">PNG, JPG, WEBP — máx. 2MB</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagenChange}
                        disabled={isEnviando}
                        className="hidden"
                    />
                </label>

                {preview && (
                    <button
                        onClick={() => { setPreview(null); setForm(prev => ({ ...prev, imagen: null })); }}
                        className="text-xs text-red-500 hover:underline mt-1 font-semibold"
                        disabled={isEnviando}
                    >
                        Quitar imagen
                    </button>
                )}
            </div>

            {/* Botón enviar */}
            <button
                onClick={handleSubmit}
                disabled={isEnviando}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isEnviando ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Enviando campaña...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.116 1.535 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.732.887.939-3.63-.235-.374A9.818 9.818 0 1112 21.818z"/>
                        </svg>
                        Activar Campaña
                    </>
                )}
            </button>
        </div>
    );
}