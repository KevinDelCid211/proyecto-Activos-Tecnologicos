# Sistema de Gestión de Activos Tecnológicos

Plataforma web para la administración de los activos de tecnología de información
de una organización. Centraliza el inventario, registra quién es responsable de
cada recurso, conserva el historial de todas las operaciones ejecutadas sobre
ellos, resguarda su documentación técnica y emite cuatro informes de control.

Desarrollado por **Kevin Humberto Del Cid Morales** como proyecto de graduación
de la carrera de Ingeniería en Sistemas de Información y Ciencias de la
Computación, Universidad Mariano Gálvez de Guatemala.

---

## Antes de poner el sistema en producción

Dos puntos deben resolverse antes de que el sistema reciba información real.

> **Cambiar la contraseña del usuario administrador.** La base de datos se crea
> con un usuario administrador cuya contraseña está escrita en
> `02_Base_de_datos/01_database.sql` y, por lo tanto, la conoce cualquiera que
> lea ese archivo. Debe cambiarse en el primer ingreso.

> **Definir la clave de firma de sesiones.** El parámetro
> `JwtSettings:SecretKey` se entrega sin valor, con un texto que indica que debe
> definirse. Mientras no se reemplace por una clave propia de al menos 32
> caracteres, el sistema no debe exponerse fuera de la red interna: esa clave es
> la que impide que se falsifiquen sesiones.

---

## Qué contiene este repositorio

| Carpeta | Contenido |
|---|---|
| `00_Contenido_de_la_entrega.pdf` | Resumen de la entrega y secuencia de instalación. Conviene abrirlo primero. |
| `01_Manuales/` | Manual de Usuario, para quien opera el sistema. Manual Técnico, para el área de tecnología. |
| `02_Base_de_datos/` | Los tres archivos de comando que crean la base de datos, numerados en su orden de ejecución. |
| `03_Codigo_fuente/` | Código fuente del servidor y del cliente web, más `publicar.bat`. |
| `04_Cartas/` | Carta de entrega y recepción del proyecto. |

## Tecnologías

| Capa | Tecnología |
|---|---|
| Presentación | Angular 17 con Angular Material |
| Lógica de negocio | ASP.NET Core sobre .NET 8, con Entity Framework Core 8 |
| Datos | Microsoft SQL Server 2019 |
| Autenticación | JWT, con cifrado de contraseñas mediante BCrypt |

## Requisitos del entorno

- Microsoft SQL Server 2019 o superior, con SQL Server Management Studio 19 o superior
- SDK de .NET 8.0
- Node.js 18
- Angular CLI 17

## Instalación

1. **Crear la base de datos.** Ejecutar los archivos de `02_Base_de_datos/` en el
   orden numerado. El primero crea el esquema y los datos base; el segundo agrega
   las columnas de costo y moneda; el tercero crea la tabla de auditoría, las
   vistas, los procedimientos almacenados, las funciones y los disparadores.

2. **Configurar.** En
   `03_Codigo_fuente/backend/GestionActivosTI.API/appsettings.json`, reemplazar
   los valores marcados:

   | Parámetro | Qué indicar |
   |---|---|
   | `ConnectionStrings:DefaultConnection` | Nombre del servidor de SQL Server |
   | `JwtSettings:SecretKey` | Clave propia de al menos 32 caracteres |
   | `Cors:AllowedOrigins` | Dirección desde la cual se publicará el sitio |

3. **Publicar.** Ejecutar `03_Codigo_fuente/publicar.bat`. Compila el servidor y
   el cliente y deja el resultado en `publicado/`.

4. **Verificar.** Ingresar con el usuario administrador, registrar un activo de
   prueba y emitir un informe.

El Manual Técnico desarrolla cada paso en detalle, junto con las rutinas de
mantenimiento preventivo y el diagnóstico de las fallas más frecuentes.

## Pruebas

El sistema cuenta con 73 pruebas automatizadas construidas con xUnit, que se
ejecutan contra el proveedor en memoria de Entity Framework Core. Para correr la
batería completa, desde `03_Codigo_fuente/backend`:

```
dotnet test
```
