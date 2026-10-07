// Interface´s para Configuracion Admin
export interface ContactInfo {
    correo: string;
    telefono: string;
    telefonoOpcional: string | null;
    direccion: string;
}

export interface RedExtra {
    id: string;
    tipo: String;
    nombre: string;
    url: string;
}

export interface RedesSociales {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
    otras: RedExtra[];
}

export interface RedApi {
    id: number;
    tipo: string;
    nombre: string;
    url: string;
    orden: number;
}

export interface HorarioDia {
    dia_grupo: string;
    abierto: boolean;
    hora_inicio: string;
    hora_fin: string;
}

export interface HorarioData {
    dias: HorarioDia[];
}