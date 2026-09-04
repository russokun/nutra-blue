"""
Validacion y normalizacion de RUT chileno.

El digito verificador se calcula por modulo 11. Sirve para atajar el error de tipeo, que
es el caso real: alguien escribe su RUT apurado en el celular, se equivoca en un digito y
la factura sale a nombre de otra empresa o directamente no se puede emitir.

Lo que NO hace, y conviene tener claro: un RUT puede pasar el modulo 11 y no existir en el
SII, o existir y no corresponder a la empresa que dice el formulario. Esto valida la
FORMA, no la identidad.
"""
import re

_LIMPIEZA = re.compile(r"[^0-9kK]")


def _digito_verificador(cuerpo: str) -> str:
    """Calcula el digito que le corresponde a un cuerpo de RUT, por modulo 11."""
    suma = 0
    factor = 2
    for digito in reversed(cuerpo):
        suma += int(digito) * factor
        # Los factores van 2,3,4,5,6,7 y vuelven a empezar.
        factor = 2 if factor == 7 else factor + 1

    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def normalizar_rut(valor: str) -> str:
    """
    Deja el RUT en la forma en que se guarda: sin puntos, en mayuscula y con guion.

    "76.123.456-7", "761234567" y "76123456-K" entran igual y salen como "76123456-7" /
    "76123456-K". Guardar siempre igual evita que el mismo RUT quede escrito de tres
    formas distintas segun como lo tipeo cada cliente.
    """
    limpio = _LIMPIEZA.sub("", valor or "").upper()
    if len(limpio) < 2:
        return limpio
    return f"{limpio[:-1]}-{limpio[-1]}"


def rut_es_valido(valor: str) -> bool:
    """True si el RUT esta bien formado y su digito verificador cuadra."""
    limpio = _LIMPIEZA.sub("", valor or "").upper()

    # Menos de 7 digitos de cuerpo no es un RUT chileno vigente; mas de 8 tampoco.
    if not 8 <= len(limpio) <= 9:
        return False

    cuerpo, verificador = limpio[:-1], limpio[-1]
    if not cuerpo.isdigit():
        return False

    return _digito_verificador(cuerpo) == verificador


def formatear_rut(valor: str) -> str:
    """Con puntos y guion, para mostrar: "76.123.456-7". Solo para lectura."""
    limpio = _LIMPIEZA.sub("", valor or "").upper()
    if len(limpio) < 2:
        return valor or ""

    cuerpo, verificador = limpio[:-1], limpio[-1]
    con_puntos = ""
    for i, digito in enumerate(reversed(cuerpo)):
        if i and i % 3 == 0:
            con_puntos = "." + con_puntos
        con_puntos = digito + con_puntos

    return f"{con_puntos}-{verificador}"
