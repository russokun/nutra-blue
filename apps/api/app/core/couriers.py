import urllib.parse

COURIER_INFO = {
    "starken": {
        "name": "Starken",
        "url_template": "https://www.starken.cl/seguimiento?codigo={code}",
        "default_url": "https://www.starken.cl/seguimiento",
    },
    "chilexpress": {
        "name": "Chilexpress",
        "url_template": "https://www.chilexpress.cl/tracking-envio?ot={code}",
        "default_url": "https://www.chilexpress.cl/tracking-envio",
    },
    "blue_express": {
        "name": "Blue Express",
        "url_template": "https://www.bluex.cl/seguimiento/?tracking={code}",
        "default_url": "https://www.bluex.cl/seguimiento/",
    },
    "correos_chile": {
        "name": "Correos de Chile",
        "url_template": "https://www.correos.cl/seguimiento-en-linea?envio={code}",
        "default_url": "https://www.correos.cl/seguimiento-en-linea",
    },
    "pullman": {
        "name": "Pullman Cargo",
        "url_template": "https://www.pullmancargo.cl/",
        "default_url": "https://www.pullmancargo.cl/",
    },
}


def get_courier_name(courier_id: str) -> str:
    if not courier_id:
        return "Courier"
    clean = str(courier_id).strip().lower()
    return COURIER_INFO.get(clean, {}).get("name", courier_id.title())


def get_tracking_url(courier_id: str, tracking_code: str) -> str:
    if not courier_id:
        return ""
    clean = str(courier_id).strip().lower()
    info = COURIER_INFO.get(clean)
    if not info:
        return ""
    if tracking_code:
        quoted = urllib.parse.quote(str(tracking_code).strip())
        return info["url_template"].format(code=quoted)
    return info["default_url"]
