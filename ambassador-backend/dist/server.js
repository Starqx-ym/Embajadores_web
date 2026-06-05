"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
// Verificar cuántos núcleos físicos tiene el procesador de tu computadora
const numCPUs = os_1.default.cpus().length;
if (cluster_1.default.isPrimary) {
    console.log(`🚀 Servidor Principal (Primary) corriendo en PID: ${process.pid}`);
    console.log(`🛠️ Detectados ${numCPUs} núcleos. Creando sub-procesos trabajadores (Workers)...`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    // Si un sub-proceso muere por un fallo imprevisto, levantar otro de inmediato para evitar caídas
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`⚠️ Worker ${worker.process.pid} se detuvo. Reiniciando servicio...`);
        cluster_1.default.fork();
    });
}
else {
    // Los sub-procesos comparten el mismo puerto de red de forma balanceada y ultra rápida
    app_1.default.listen(PORT, () => {
        console.log(`🟢 Worker activo en PID: ${process.pid} escuchando en el puerto ${PORT}`);
    });
}
