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
        # Solo lo que va bajo "Descripción del Tipo de Producto", separado de la
        # introducción y del resto de la descripción. Es lo que se usa para deducir el
        # tipo (Polvo, Gotas, Aceite...): mezclarlo con la intro haría que una frase
        # suelta de marketing decidiera el tipo del producto.
        "type_description": "",
        "origin": "",
        "cross_selling": "",
        "product_profile": "",
        "ingredients": "",
        "usage": "",
        "precautions": "",
        "extracted_benefits": []
    }

    # Recorrer párrafos y clasificar el texto por palabras clave
    current_key = None
    intro_captured = False
    in_type_section = False

    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
            
        lower_text = text.lower()
        is_short_line = len(text) < 80
        
        # Detectar cabeceras o secciones y cambiar el foco (solo en líneas cortas/títulos)
        if is_short_line and any(h in lower_text for h in ["descripción del tipo de producto", "descripcion del tipo de producto", "descripción del producto", "descripcion del producto"]):
            current_key = "description"
            # Solo la variante "del tipo de producto" alimenta type_description.
            in_type_section = any(h in lower_text for h in ["tipo de producto"])
            if ":" in text:
                resto = text.split(":", 1)[1].strip()
                sections[current_key] += resto + "\n"
                if in_type_section:
                    sections["type_description"] += resto + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["recomendaciones con otros productos", "cross-selling", "cross selling", "venta cruzada"]):
            current_key = "cross_selling"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["perfil del producto", "perfil producto"]):
            current_key = "product_profile"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["zona de producción", "zona de produccion", "lugar de producción", "lugar de produccion", "origen"]):
            current_key = "origin"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["ingrediente", "composición", "composicion", "fórmula", "formula"]):
            current_key = "ingredients"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["modo de uso", "forma de uso", "modo de empleo", "instrucciones", "cómo tomar", "como tomar", "dosis"]):
            current_key = "usage"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["precauciones", "advertencias", "contraindicaciones", "cuidado"]):
            current_key = "precautions"
            if ":" in text:
                sections[current_key] += text.split(":", 1)[1].strip() + "\n"
            continue
        elif is_short_line and any(h in lower_text for h in ["beneficios para el cliente", "beneficios"]):
            current_key = "benefits"
            continue
        elif is_short_line and any(h in lower_text for h in ["estructura de costos", "costos y márgenes", "costos y margenes", "márgenes", "margenes", "estrategia de venta", "contacto de proveedor", "referencias"]):
            current_key = "ignored_metadata"
            continue
            
        # Detectar viñetas de beneficios únicamente si estamos en la sección de beneficios
        if current_key == "benefits":
            # Dividir por saltos de línea suaves (\n o \r) que puedan venir en un único párrafo
            sub_lines = re.split(r"[\n\r\u000b]+", text)
            for line in sub_lines:
                # Las fichas usan tanto viñetas como parrafos corridos: se toma cada
                # linea como un beneficio y solo se limpia el caracter de viñeta inicial.
                clean_benefit = re.sub(r"^[^a-zA-Z0-9\s]{1,3}\s*", "", line.strip()).strip()
                if clean_benefit:
                    sections["extracted_benefits"].append(clean_benefit)
            continue

        # Acumular la introduccion (todo lo que va antes del primer encabezado) como Descripción.
        # El primer parrafo suele ser el nombre del producto: se descarta.
        if current_key is None:
            if not intro_captured and len(text) <= 60:
                continue
            if "ficha comercial:" in lower_text or lower_text.startswith("ficha"):
                continue
            sections["description"] += text + "\n"
            intro_captured = True
            continue

        # Acumular texto en la sección actual (excluyendo metadatos ignorados y beneficios individuales en viñetas)
        if current_key and current_key != "ignored_metadata" and current_key != "benefits":
            sections[current_key] += text + "\n"
            # Cualquier otro encabezado cambia current_key, así que sólo se llega acá con
            # in_type_section activo estando realmente dentro de esa sección.
            if current_key == "description" and in_type_section:
                sections["type_description"] += text + "\n"
        
    # Limpiar espacios en blanco al inicio/final de cada sección
    cleaned_sections = {k: v.strip() if isinstance(v, str) else v for k, v in sections.items()}
    return cleaned_sections
