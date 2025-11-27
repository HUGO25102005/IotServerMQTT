import { db } from "./src/infra/db";

/**
 * Script de diagnóstico para verificar la estructura de Firestore
 * y encontrar dónde están los datos de telemetría
 */
async function diagnoseFirestore() {
    console.log("🔍 Iniciando diagnóstico de Firestore...\n");

    try {
        // 1. Verificar colección "stations"
        console.log("1️⃣  Buscando documentos en 'stations'...");
        const stationsSnapshot = await db.collection("stations").get();
        console.log(`   ✅ Encontrados ${stationsSnapshot.size} documentos en 'stations'`);

        if (stationsSnapshot.empty) {
            console.log("   ⚠️  La colección 'stations' está vacía!");
            console.log("\n💡 Posibles causas:");
            console.log("   - Los mensajes MQTT no se están guardando");
            console.log("   - Firebase credentials incorrectas");
            console.log("   - El servidor MQTT no está procesando mensajes\n");
            return;
        }

        // Listar todos los stations
        console.log("\n   📋 Documentos encontrados:");
        for (const stationDoc of stationsSnapshot.docs) {
            console.log(`      - Station ID: ${stationDoc.id}`);
        }

        // 2. Para cada station, buscar controllers
        console.log("\n2️⃣  Buscando 'controllers' en cada station...");
        for (const stationDoc of stationsSnapshot.docs) {
            const stationId = stationDoc.id;
            const controllersSnapshot = await stationDoc.ref.collection("controllers").get();

            console.log(`   Station '${stationId}': ${controllersSnapshot.size} controllers`);

            if (controllersSnapshot.empty) {
                console.log(`      ⚠️  No se encontraron controllers en station '${stationId}'`);

                // Verificar si hay otras subcolecciones
                const collections = await stationDoc.ref.listCollections();
                if (collections.length > 0) {
                    console.log(`      📁 Subcolecciones disponibles en '${stationId}':`);
                    collections.forEach((col: any) => console.log(`         - ${col.id}`));
                }
            } else {
                // Listar controllers
                for (const controllerDoc of controllersSnapshot.docs) {
                    console.log(`      - Controller ID: ${controllerDoc.id}`);

                    // 3. Buscar locks en cada controller
                    const locksSnapshot = await controllerDoc.ref.collection("locks").get();
                    console.log(`         Locks: ${locksSnapshot.size}`);

                    if (locksSnapshot.empty) {
                        console.log(`         ⚠️  No se encontraron locks`);

                        // Verificar subcolecciones del controller
                        const ctrlCollections = await controllerDoc.ref.listCollections();
                        if (ctrlCollections.length > 0) {
                            console.log(`         📁 Subcolecciones en controller '${controllerDoc.id}':`);
                            ctrlCollections.forEach((col: any) => console.log(`            - ${col.id}`));
                        }
                    } else {
                        // Listar locks
                        for (const lockDoc of locksSnapshot.docs) {
                            const lockData = lockDoc.data();
                            console.log(`         - Lock ID: ${lockDoc.id}`);
                            console.log(`            State: ${lockData.last_state || 'N/A'}`);
                            console.log(`            Battery: ${lockData.last_battery || 'N/A'}`);
                            console.log(`            RSSI: ${lockData.last_rssi || 'N/A'}`);

                            // Verificar subcolecciones del lock (telemetry, events, etc)
                            const lockCollections = await lockDoc.ref.listCollections();
                            if (lockCollections.length > 0) {
                                console.log(`            📁 Subcolecciones:`);
                                for (const col of lockCollections) {
                                    const snapshot = await col.limit(1).get();
                                    console.log(`               - ${col.id} (${snapshot.size > 0 ? 'tiene datos' : 'vacío'})`);
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. Buscar usando collectionGroup (alternativa)
        console.log("\n3️⃣  Buscando locks usando collectionGroup...");
        const allLocksSnapshot = await db.collectionGroup("locks").limit(10).get();
        console.log(`   ✅ Encontrados ${allLocksSnapshot.size} locks en total usando collectionGroup`);

        if (!allLocksSnapshot.empty) {
            console.log("\n   📋 Primeros locks encontrados:");
            allLocksSnapshot.docs.forEach((doc: any) => {
                console.log(`      - Path: ${doc.ref.path}`);
            });
        }

        console.log("\n✅ Diagnóstico completado");

    } catch (error: any) {
        console.error("\n❌ Error durante el diagnóstico:");
        console.error(error.message);

        if (error.code === 'permission-denied') {
            console.log("\n💡 Parece ser un problema de permisos de Firestore");
            console.log("   Verifica tus reglas de seguridad en Firebase Console");
        } else if (error.code === 'not-found') {
            console.log("\n💡 La base de datos no existe o las credenciales son incorrectas");
        }
    }
}

// Ejecutar el diagnóstico
diagnoseFirestore()
    .then(() => {
        console.log("\n🎯 Diagnóstico finalizado");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Error fatal:", error);
        process.exit(1);
    });
