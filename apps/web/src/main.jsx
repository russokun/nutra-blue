import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from '@/App';
import { sincronizarDesdeUrl } from '@/lib/testMode';
import '@/index.css';

// Antes de renderizar: el catálogo consulta el modo prueba mientras se monta, y los
// efectos de los hijos corren antes que los del padre. Si esto viviera en un useEffect
// de App, la primera carga con `?prueba=1` pediría el catálogo sin los ocultos.
sincronizarDesdeUrl();

ReactDOM.createRoot(document.getElementById('root')).render(
	<MotionConfig reducedMotion="user">
		<App />
	</MotionConfig>
);