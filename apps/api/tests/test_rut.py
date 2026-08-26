"""
Tests del RUT chileno.

Los casos con digito verificador esperado estan calculados A MANO por modulo 11, no
copiados de RUTs reales de memoria: un RUT real mal recordado convierte el test en una
trampa que falla sin que el codigo tenga nada malo.

  11111111 -> reversos 1,1,1,1,1,1,1,1 por factores 2,3,4,5,6,7,2,3 = 32
              32 % 11 = 10 ; 11 - 10 = 1  -> DV "1"
  12345678 -> 8*2+7*3+6*4+5*5+4*6+3*7+2*2+1*3 = 16+21+24+25+24+21+4+3 = 138
              138 % 11 = 6 ; 11 - 6 = 5    -> DV "5"
"""
import pytest

from app.core.rut import (
    _digito_verificador,
    formatear_rut,
    normalizar_rut,
    rut_es_valido,
)


@pytest.mark.parametrize(
    "cuerpo,esperado",
    [
        ("11111111", "1"),
        ("12345678", "5"),
    ],
)
def test_digito_verificador_calculado_a_mano(cuerpo, esperado):
    assert _digito_verificador(cuerpo) == esperado


def test_acepta_rut_valido_en_cualquier_formato():
    for escrito in ("12345678-5", "12.345.678-5", "123456785", "12345678-5 "):
        assert rut_es_valido(escrito), escrito


def test_rechaza_digito_verificador_equivocado():
    # Es el caso real: un digito mal tipeado en el celular.
    assert not rut_es_valido("12345678-4")
    assert not rut_es_valido("12345678-K")


def test_rechaza_largos_imposibles():
    assert not rut_es_valido("")
    assert not rut_es_valido("1-9")
    assert not rut_es_valido("1234567890123")


def test_rechaza_cuerpo_no_numerico():
    assert not rut_es_valido("1234K678-5")


def test_acepta_verificador_k():
    # Se construye uno cuyo DV sea K en vez de recordar alguno real.
    cuerpo = next(c for c in (str(n) for n in range(10000000, 10000100))
                  if _digito_verificador(c) == "K")
    assert rut_es_valido(f"{cuerpo}-K")
    assert rut_es_valido(f"{cuerpo}k"), "la k minuscula tiene que valer igual"


def test_normaliza_a_una_sola_forma():
    # El mismo RUT escrito de tres maneras tiene que guardarse igual, si no la misma
    # empresa queda como tres clientes distintos.
    formas = ["12.345.678-5", "123456785", "12345678-5"]
    assert len({normalizar_rut(f) for f in formas}) == 1
    assert normalizar_rut("12.345.678-k") == "12345678-K"


def test_formatea_para_mostrar():
    assert formatear_rut("123456785") == "12.345.678-5"
    assert formatear_rut("9876543-3") == "9.876.543-3"
