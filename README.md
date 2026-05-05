# Album Panini 2026

App movil Android para gestionar el album Panini FIFA World Cup 2026.

## Que hace

- Registra estampas por codigo, por ejemplo `ARG 4`.
- Muestra el estado de cada estampa: `Te falta`, `Ya la tienes` o `Es repetida`.
- Guarda la coleccion localmente en el telefono.
- Incluye una base inicial de 980 espacios del album.
- Tiene pantalla de gestion con progreso, faltantes, repetidas y busqueda.

## Probar en Android

Instala dependencias:

```powershell
npm install
```

Inicia Expo:

```powershell
npm run start -- --lan
```

Abre Expo Go en el celular y escanea el QR de la terminal.

## Estado actual

Esta primera version permite tomar foto y confirmar el codigo manualmente. El siguiente paso es conectar OCR para leer automaticamente el codigo del reverso de la estampa.
