import cluster from 'cluster';
import os from 'os';
import app from './app';

const PORT = process.env.PORT || 3000;

// Verificar cuántos núcleos físicos tiene el procesador de tu computadora
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🚀 Servidor Principal (Primary) corriendo en PID: ${process.pid}`);
  console.log(`🛠️ Detectados ${numCPUs} núcleos. Creando sub-procesos trabajadores (Workers)...`);


  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Si un sub-proceso muere por un fallo imprevisto, levantar otro de inmediato para evitar caídas
  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} se detuvo. Reiniciando servicio...`);
    cluster.fork();
  });

} else {
  // Los sub-procesos comparten el mismo puerto de red de forma balanceada y ultra rápida
  app.listen(PORT, () => {
    console.log(`🟢 Worker activo en PID: ${process.pid} escuchando en el puerto ${PORT}`);
  });
}