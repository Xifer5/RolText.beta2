const fs = require('fs');
const path = require('path');

// Configuración
const directorioBase = './';
const archivoSalida = 'prompt_para_ia.txt';
const extensionesPermitidas = ['.js', '.html', '.css'];
const carpetasIgnoradas = ['node_modules', '.git', 'dist', 'build'];

// Plantilla inicial
let contenidoFinal = `# CONTEXTO DEL PROYECTO
Descripción: [Explica brevemente tu proyecto]
Problema/Objetivo: [¿Qué quieres que haga la IA?]

---

# CÓDIGO FUENTE\n\n`;

function explorarDirectorio(dir) {
    const archivos = fs.readdirSync(dir);

    archivos.forEach(archivo => {
        const rutaCompleta = path.join(dir, archivo);
        const stat = fs.statSync(rutaCompleta);

        if (stat.isDirectory()) {
            if (!carpetasIgnoradas.includes(archivo)) {
                explorarDirectorio(rutaCompleta);
            }
        } else {
            const ext = path.extname(rutaCompleta);
            if (extensionesPermitidas.includes(ext)) {
                const contenido = fs.readFileSync(rutaCompleta, 'utf-8');
                // Determinar la etiqueta de markdown
                const lenguaje = ext === '.js' ? 'javascript' : ext.substring(1);
                
                // Formatear la ruta para que sea limpia (ej: js/app.js)
                const rutaRelativa = path.relative('./', rutaCompleta).replace(/\\/g, '/');

                contenidoFinal += `### Archivo: ${rutaRelativa} ###\n`;
                contenidoFinal += `\`\`\`${lenguaje}\n${contenido}\n\`\`\`\n\n`;
            }
        }
    });
}

explorarDirectorio(directorioBase);
fs.writeFileSync(archivoSalida, contenidoFinal);
console.log(`✅ ¡Éxito! Archivos consolidados en: ${archivoSalida}`);