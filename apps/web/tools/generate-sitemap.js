#!/usr/bin/env node
/**
 * Genera public/sitemap.xml en el build.
 *
 * Las páginas estáticas salen de una lista acá; las de producto se piden a la API, así
 * que el sitemap sigue al catálogo sin mantenimiento manual. Si la API no responde, se
 * genera igual con las estáticas: un sitemap incompleto es mucho mejor que un build roto.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const SITE_URL = process.env.SITE_URL || 'https://nutrablue.cl';
const API_URL = process.env.SITEMAP_API_URL || 'https://api.nutrablue.cl';

// Solo lo indexable. Checkout, carrito, cuenta, login, registro y confirmación de pedido
// quedan fuera a propósito: son privadas o irrelevantes para búsqueda, y coinciden con
// lo que bloquea robots.txt.
const RUTAS_PUBLICAS = [
	{ url: '/', priority: '1.0', changefreq: 'weekly' },
	{ url: '/shop', priority: '0.9', changefreq: 'daily' },
	{ url: '/historia', priority: '0.6', changefreq: 'monthly' },
	{ url: '/impacto', priority: '0.6', changefreq: 'monthly' },
	{ url: '/contacto', priority: '0.5', changefreq: 'monthly' },
	{ url: '/faqs', priority: '0.7', changefreq: 'monthly' },
	{ url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
	{ url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
];

async function obtenerProductos() {
	try {
		const controlador = new AbortController();
		const tiempo = setTimeout(() => controlador.abort(), 10000);
		const res = await fetch(`${API_URL}/products`, { signal: controlador.signal });
		clearTimeout(tiempo);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const productos = await res.json();
		return Array.isArray(productos) ? productos : [];
	} catch (e) {
		console.warn(`[sitemap] No se pudieron obtener los productos (${e.message}). Se genera solo con las páginas estáticas.`);
		return [];
	}
}

const escapar = (s) =>
	String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function construirXml(entradas) {
	const cuerpo = entradas
		.map(
			({ url, priority, changefreq, lastmod }) => `	<url>
		<loc>${escapar(SITE_URL + url)}</loc>
		<lastmod>${lastmod}</lastmod>
		<changefreq>${changefreq}</changefreq>
		<priority>${priority}</priority>
	</url>`
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cuerpo}
</urlset>
`;
}

async function main() {
	const hoy = new Date().toISOString().split('T')[0];
	const productos = await obtenerProductos();

	const entradas = [
		...RUTAS_PUBLICAS.map((r) => ({ ...r, lastmod: hoy })),
		...productos
			// Los ocultos son de prueba: no van al sitemap.
			.filter((p) => p && p.id && !p.is_hidden)
			.map((p) => ({
				url: `/product/${p.id}`,
				priority: '0.8',
				changefreq: 'weekly',
				lastmod: hoy,
			})),
	];

	const salida = path.join(process.cwd(), 'public', 'sitemap.xml');
	fs.writeFileSync(salida, construirXml(entradas), 'utf8');
	console.log(`[sitemap] ${entradas.length} URLs (${productos.length} productos) -> public/sitemap.xml`);
}

const esModuloPrincipal =
	process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (esModuloPrincipal) {
	main();
}
