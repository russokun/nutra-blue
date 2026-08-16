import net from 'node:net';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// El puerto de siempre es el 3000. Si está tomado —es común tener otro proyecto
// levantado— la tienda se corre sola en vez de fallar.
//
// El salto NO puede ser al siguiente número: el 3001 es la API y el 3002 el panel, y el
// proxy de más abajo apunta al 3001 de forma fija. Si la tienda se quedara con ese
// puerto, la API no podría levantar y la tienda terminaría haciéndose proxy a sí misma.
// Por eso los candidatos saltan al 3010 en adelante.
const PUERTO_HABITUAL = 3000;
const CANDIDATOS = [PUERTO_HABITUAL, 3010, 3011, 3012, 3013, 3014];

// Se comprueba intentando CONECTAR, no enlazar. Enlazar da falsos negativos: el servidor
// corre con `--host ::` (IPv6) y en Windows un enlace de prueba a 0.0.0.0 igual tiene
// éxito, así que el puerto parecía libre estando tomado.
const respondeAlguien = (puerto, host) =>
	new Promise((resolve) => {
		const socket = net.createConnection({ port: puerto, host });
		const cerrar = (ocupado) => {
			socket.destroy();
			resolve(ocupado);
		};
		socket.setTimeout(400);
		socket.once('connect', () => cerrar(true));
		socket.once('timeout', () => cerrar(false));
		socket.once('error', () => cerrar(false));
	});

const estaLibre = async (puerto) => {
	const [ipv4, ipv6] = await Promise.all([
		respondeAlguien(puerto, '127.0.0.1'),
		respondeAlguien(puerto, '::1'),
	]);
	return !ipv4 && !ipv6;
};

const elegirPuerto = async () => {
	// PORT gana siempre: es como lo fijan las herramientas que necesitan elegirlo.
	if (process.env.PORT) return Number(process.env.PORT);
	for (const puerto of CANDIDATOS) {
		if (await estaLibre(puerto)) return puerto;
	}
	return PUERTO_HABITUAL;
};

export default defineConfig(async () => ({
	plugins: [react()],
	server: {
		port: await elegirPuerto(),
		strictPort: false,
		cors: true,
		proxy: {
			'/hcgi/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/hcgi\/api/, '')
			}
		},
		fs: {
			strict: true,
			allow: [
				path.resolve(__dirname),
				path.join(path.resolve(__dirname, '../..'), 'node_modules'),
			],
		},
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
}));
