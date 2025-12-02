# Instrucciones para actualizar Firestore Rules

1. Ve a la pestaña **Índices** (Indexes) en Firestore
2. Haz clic en **Crear índice** (Create Index)
3. Configura el índice:
   - Collection ID: `publicProfiles`
   - Fields to index:
     - Field: `username`, Order: Ascending
   - Query scope: Collection
4. Haz clic en **Crear** (Create)

## Notas importantes:

- Las nuevas reglas permiten que cualquier usuario autenticado pueda buscar y ver perfiles públicos
- Los usuarios solo pueden modificar su propio perfil público
- Los datos privados en la colección `users` siguen protegidos
- La configuración de privacidad permite a cada usuario controlar qué información comparte

## Verificación

Después de publicar las reglas, la funcionalidad de "Amigos" debería funcionar correctamente:

- Los usuarios pueden buscar otros usuarios por username
- Los usuarios pueden ver perfiles públicos según la configuración de privacidad
- Los perfiles se sincronizan automáticamente cuando el usuario actualiza su información
