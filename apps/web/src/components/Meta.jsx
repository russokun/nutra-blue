import { useEffect } from 'react';
import { Children, isValidElement } from 'react';

/**
 * Reemplazo de react-helmet con la misma API de uso.
 *
 * Por qué existe: `react-helmet` (6.1.0) usa ciclos de vida que React 18 ya no ejecuta,
 * así que no aplicaba nada — todas las páginas quedaban con el título y la descripción
 * de index.html aunque cada una tuviera los suyos escritos. `react-helmet-async` tampoco
 * funcionó acá, ni en 2.0.5 ni en 3.0.0, ni en desarrollo ni en el build de producción,
 * ni siquiera montándolo aislado.
 *
 * Esto hace el trabajo directamente sobre el DOM: son unas pocas decenas de líneas, no
 * tiene dependencias, y se puede comprobar mirando el `<head>`.
 *
 * Acepta lo mismo que se venía usando:
 *   <Helmet script={[{ type, innerHTML }]}>
 *     <title>…</title>
 *     <meta name="description" content="…" />
 *     <link rel="canonical" href="…" />
 *   </Helmet>
 *
 * Las etiquetas que crea quedan marcadas con `data-meta="1"` y se retiran al desmontar,
 * así una página no hereda las de la anterior.
 */

const MARCA = 'data-meta';

/** Identifica una etiqueta para poder reemplazarla en vez de duplicarla. */
function selectorDe(tipo, props) {
  if (tipo === 'meta') {
    if (props.name) return `meta[name="${CSS.escape(props.name)}"]`;
    if (props.property) return `meta[property="${CSS.escape(props.property)}"]`;
  }
  if (tipo === 'link' && props.rel) return `link[rel="${CSS.escape(props.rel)}"]`;
  return null;
}

function aplicar(hijos, scripts) {
  const creadas = [];
  let tituloPrevio = null;

  Children.forEach(hijos, (hijo) => {
    if (!isValidElement(hijo)) return;
    const { type, props } = hijo;

    if (type === 'title') {
      const texto = Array.isArray(props.children) ? props.children.join('') : props.children;
      if (texto) {
        tituloPrevio = document.title;
        document.title = String(texto);
      }
      return;
    }

    if (type !== 'meta' && type !== 'link') return;

    // Si ya existe la etiqueta (por ejemplo la de index.html), se reutiliza y se
    // restaura su valor al salir de la página, en vez de dejar dos compitiendo.
    const selector = selectorDe(type, props);
    const existente = selector ? document.head.querySelector(selector) : null;

    if (existente) {
      const atributo = type === 'meta' ? 'content' : 'href';
      const valorNuevo = type === 'meta' ? props.content : props.href;
      if (valorNuevo == null) return;
      creadas.push({ elemento: existente, atributo, valorPrevio: existente.getAttribute(atributo) });
      existente.setAttribute(atributo, valorNuevo);
      return;
    }

    const el = document.createElement(type);
    Object.entries(props).forEach(([clave, valor]) => {
      if (clave !== 'children' && valor != null) el.setAttribute(clave, String(valor));
    });
    el.setAttribute(MARCA, '1');
    document.head.appendChild(el);
    creadas.push({ elemento: el, nueva: true });
  });

  (scripts || []).forEach((s) => {
    const el = document.createElement('script');
    el.type = s.type || 'application/ld+json';
    el.textContent = s.innerHTML || '';
    el.setAttribute(MARCA, '1');
    document.head.appendChild(el);
    creadas.push({ elemento: el, nueva: true });
  });

  return () => {
    creadas.forEach(({ elemento, nueva, atributo, valorPrevio }) => {
      if (nueva) {
        elemento.remove();
      } else if (valorPrevio != null) {
        elemento.setAttribute(atributo, valorPrevio);
      }
    });
    if (tituloPrevio != null) document.title = tituloPrevio;
  };
}

export const Helmet = ({ children, script }) => {
  // Se serializa el contenido para no re-aplicar en cada render: los hijos son elementos
  // nuevos cada vez, pero su contenido casi nunca cambia.
  //
  // Con `Children.map` acá React intenta validar lo devuelto como hijos y revienta con
  // "Objects are not valid as a React child": hay que usar toArray y mapear a mano.
  const huella =
    JSON.stringify(
      Children.toArray(children)
        .filter(isValidElement)
        .map((h) => [h.type, h.props])
    ) + JSON.stringify(script || []);

  useEffect(() => aplicar(children, script), [huella]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default Helmet;
