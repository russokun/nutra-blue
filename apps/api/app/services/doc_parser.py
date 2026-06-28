import io
import re
import requests
from docx import Document

def parse_google_doc(url: str) -> dict:
    """
    Descarga un Google Doc como archivo .docx y extrae la información estructurada
    de las secciones de producto (Descripción, Origen, Ingredientes, Uso, Precauciones).
    """
    # Limpiar y validar URL
    url = url.strip()
    if not url:
        return {}

    # Extraer el ID del documento
    # Formatos soportados:
    # https://docs.google.com/document/d/1abc123xyz/edit...
    # https://docs.google.com/document/d/1abc123xyz
    match = re.search(r"/document/d/([a-zA-Z0-9-_]+)", url)
    if not match:
        raise ValueError(f"URL de Google Doc no válida: {url}")
    
    doc_id = match.group(1)
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=docx"
    
    # Descargar el documento como binario
    try:
        response = requests.get(export_url, timeout=15)
        response.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"No se pudo descargar el documento desde Google: {str(e)}")
    
    # Parsear el documento docx
    try:
        doc = Document(io.BytesIO(response.content))
    except Exception as e:
        raise RuntimeError(f"Error al abrir el archivo docx: {str(e)}")
    
    # Mapeo de secciones
    sections = {
        "description": "",
        "origin": "",
        "ingredients": "",
        "usage": "",
        "precautions": ""
    }
    
    # Recorrer párrafos y clasificar el texto por palabras clave
    current_key = None  # Iniciamos en None para ignorar la introducción y el título
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
            
        lower_text = text.lower()
        
        # Detectar cabeceras o secciones y cambiar el foco
        if any(h in lower_text for h in ["descripción del tipo de producto", "descripcion del tipo de producto", "descripción del producto", "descripcion del producto"]):
            current_key = "description"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif any(h in lower_text for h in ["zona de producción", "zona de produccion", "lugar de producción", "lugar de produccion"]):
            current_key = "origin"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif any(h in lower_text for h in ["ingrediente", "composición", "composicion", "fórmula", "formula"]):
            current_key = "ingredients"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif any(h in lower_text for h in ["modo de uso", "instrucciones", "uso", "cómo tomar", "dosis"]):
            current_key = "usage"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif any(h in lower_text for h in ["precauciones", "advertencias", "contraindicaciones", "cuidado"]):
            current_key = "precautions"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
            
        # Acumular texto en la sección actual solo si ya estamos dentro de una sección válida
        if current_key:
            sections[current_key] += text + "\n"
        
    # Limpiar espacios en blanco al inicio/final de cada sección
    return {k: v.strip() for k, v in sections.items()}
