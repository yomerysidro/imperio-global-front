# Diagnóstico de reorganización MLM

## Causas corregidas

El modal leía `red_total` desde búsqueda de cuentas. El contrato real del detalle devuelve `descendants_count` y `descendant_count` junto a un objeto `user`; por eso los datos válidos no llegaban a pantalla. La línea vertical también contenía nombres y UUID fijos y dependía de la búsqueda general.

El botón ya tenía un bloqueo independiente del conteo: `networkMoveBackendCertified=false` y `networkMoveConfirmationEnabled=false` en desarrollo y producción. Estas banderas se conservaron. La ausencia de conteo no participa en la autorización.

## Contrato real utilizado

Verificado en `../imperio-global-back/routes/api.php`, `NetworkGenealogyController`, `NetworkTargetLineController` y `NetworkBranchMoveController`:

| Operación | Ruta |
| --- | --- |
| Detalle del socio y nuevo patrocinador | `GET /api/v1/admin/network/genealogy/{uuid}` |
| Línea configurada | `GET /api/v1/admin/network/target-line` |
| Raíz configurada | `GET /api/v1/admin/network/root` |
| Árbol administrativo paginado | `GET /api/v1/admin/network/genealogy?perPage=100&page=N` |
| Guardar únicamente selección visual | `PUT /api/v1/admin/network/target-line` con `user_codes` |
| Movimiento real | `POST /api/v1/admin/network/moves/confirm` |

El cuerpo de confirmación contiene exclusivamente `userCode` y `newSponsorCode`. No hay llamadas a preview ni tokens de prevalidación.

La estructura de detalle observada en el controlador es:

```text
{
  user: { uuid, name, registered_at, active, package_name },
  sponsor: { uuid, name } | null,
  level,
  direct_children_total,
  descendant_count,
  descendants_count,
  direct_children: { data, page, per_page, total, last_page },
  route_ascending: [{ uuid, name, level, sponsor_code }],
  integrity_warnings
}
```

Es una descripción del contrato fuente, no una respuesta autenticada capturada. El mapper también admite `{ data: detalle }`.

## Normalización y seguridad

Ambos alias se normalizan en `descendantsCount`. Acepta enteros seguros no negativos o cadenas numéricas válidas. Conserva cero; ausencia o valores inválidos quedan en `null`. Dos conteos válidos diferentes generan un error explícito de contrato. Los conteos de búsqueda no se mezclan con el detalle. El total incluyendo al socio raíz es el conteo entregado por Laravel más uno; no se cuentan nodos de la interfaz.

La búsqueda solo identifica candidatos. El detalle verifica el UUID y aporta el patrocinador real, nivel, hijos, descendientes, estado, pack y ruta ascendente. Las lecturas fallidas presentan errores y permiten repetir la consulta. Se ignoran respuestas de selecciones anteriores.

La confirmación requiere administrador, detalles verificados de ambas cuentas, UUID diferentes, ninguna lectura o confirmación pendiente y ambas banderas activadas tras certificación externa. Hay una confirmación explícita que conserva los UUID revisados y rechaza cambios de selección antes de aprobar. Laravel valida permisos reales, ciclos, elegibilidad y la transacción completa.

HTTP 423 muestra «El movimiento real todavía está deshabilitado en Laravel» y bloquea nuevos envíos en ese modal. Solo `status: "confirmed"` genera éxito. Después se consulta nuevamente el detalle y la línea, se invalida el patrocinador seleccionado y se emite `confirmed` para refrescar las páginas contenedoras. El árbol administrativo recarga todas sus páginas desde genealogía, sin inferir parentescos de compras o puntos.

## Línea dinámica

Las tarjetas se generan desde `positions` del servidor y se completan con los detalles administrativos. El editor permite añadir, quitar y reordenar UUID separados por líneas, espacios o comas. Laravel valida existencia, duplicados y primera posición igual a su raíz configurada. Guardar la selección visual no mueve socios. No hay nombres ni UUID del entorno codificados en el flujo de ejecución; los ejemplos locales existen exclusivamente en pruebas.

## Respuesta recibida y límite de verificación

La petición de lectura sin credenciales a `http://127.0.0.1:8000/api/v1/admin/network/genealogy/1234` respondió **HTTP 401**. JSON realmente recibido:

```json
{"message":"Unauthenticated."}
```

No se dispone de una sesión administrativa autenticada en esta ejecución. Por tanto, el conteo real de Florencio y que Julia tenga a Alberto como patrocinador permanecen pendientes de comprobar contra datos vivos. La identificación y patrocinio se comprueban mediante respuestas interceptadas en pruebas, sin presentarlas como evidencia de MySQL.

No se ejecutaron movimientos, escrituras de configuración en Laravel ni comandos sobre MySQL. No se activaron banderas de certificación.

## Archivos de implementación

- Modal: `tools-users-sponsor-modal.component.ts`, `.html`, `.scss` y `.spec.ts`.
- Servicios: `api.service.ts`, `http.service.ts` y sus pruebas.
- Modelos: `user.interface.ts`, `network-genealogy.ts` y `.spec.ts`.
- Árbol: `tree-users-page.component.ts`, `.html` y `.spec.ts`.
- Errores anteriores de Karma corregidos: `app.component.spec.ts` esperaba una propiedad y plantilla antiguas; `carousel-images.component.ts` importaba un tipo de una dependencia ausente y ahora utiliza inferencia de tipos. No se añadió una dependencia de carrusel.

Se conservaron los cambios que ya existían en el workspace y las eliminaciones de recursos ajenas a esta tarea.

## Resultado de verificación

- `npm.cmd run build`: correcto. Permanecen avisos CommonJS anteriores de `aos`, `@lyracom/embedded-form-glue` y `buffer`.
- Karma con ChromeHeadless: **42 pruebas correctas**, seleccionadas de normalización, API, HTTP, modal, árbol y shell de aplicación. No se ejecutó toda la batería histórica del repositorio.
- Incluye ambos alias, igualdad y discrepancia, cero, datos anidados, valores inválidos, identidad y patrocinador por UUID, selección local Florencio/Julia mediante fixtures, banderas, HTTP 423, ruta/body definitivos, confirmación explícita, rechazo de respuestas pendientes, respuestas tardías y refresco de todas las páginas.
- Chrome no inició dentro del aislamiento de Windows por errores de acceso/GPU; la ejecución autorizada fuera del aislamiento completó las 42 pruebas.
- Las pruebas HTTP usan `HttpTestingController` y las pruebas de componentes usan dobles de `ApiService`. Ninguna prueba envía movimientos reales a Laravel ni modifica MySQL.

Reproducción:

```powershell
npm.cmd run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/shared/services/models/network-genealogy.spec.ts --include=src/app/shared/services/api.service.spec.ts --include=src/app/shared/services/http.service.spec.ts --include=src/app/app.component.spec.ts --include=src/app/pages/admin/administrator/tree-users/tree-users-page/tree-users-page.component.spec.ts --include=src/app/pages/admin/administrator/tools/tools-users-page/tools-users-sponsor-modal/tools-users-sponsor-modal.component.spec.ts
```

Se usa `npm.cmd` porque PowerShell bloquea `npm.ps1` mediante su política de ejecución.
