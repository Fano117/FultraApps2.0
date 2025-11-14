/**
 * ENDPOINTS ADICIONALES PARA TRACKING GPS Y GEOCERCAS
 *
 * Agrega estos endpoints adicionales a tu backend para el sistema de tracking
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FultraTrack.API.Controllers
{
    [ApiController]
    [Route("api/mobile")]
    public partial class MobileController : ControllerBase
    {
        /// <summary>
        /// Recibir ubicación del chofer en tiempo real
        /// POST /api/mobile/chofer/ubicacion
        /// </summary>
        [HttpPost("chofer/ubicacion")]
        public async Task<IActionResult> RegistrarUbicacion([FromBody] UbicacionDto dto)
        {
            try
            {
                // Obtener chofer del token o header X-Dev-User
                var choferId = ObtenerChoferIdActual();

                var ubicacion = new UbicacionChofer
                {
                    ChoferId = choferId,
                    Latitud = dto.Latitud,
                    Longitud = dto.Longitud,
                    Velocidad = dto.Velocidad,
                    Precision = dto.Precision,
                    FechaHora = DateTime.UtcNow,
                    EnRuta = dto.EnRuta,
                };

                await _context.UbicacionesChofer.AddAsync(ubicacion);
                await _context.SaveChangesAsync();

                // Verificar si está cerca de alguna entrega asignada
                var entregasCercanas = await VerificarProximidadEntregas(choferId, dto.Latitud, dto.Longitud);

                return Ok(new
                {
                    mensaje = "Ubicación registrada",
                    entregasCercanas = entregasCercanas
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error registrando ubicación: {ex.Message}");
            }
        }

        /// <summary>
        /// Completar una entrega
        /// POST /api/mobile/entregas/{id}/completar
        /// </summary>
        [HttpPost("entregas/{id}/completar")]
        public async Task<IActionResult> CompletarEntrega(int id, [FromBody] CompletarEntregaDto dto)
        {
            try
            {
                var entrega = await _context.Entregas.FindAsync(id);

                if (entrega == null)
                {
                    return NotFound("Entrega no encontrada");
                }

                // Verificar que el chofer esté cerca del punto de entrega (geocerca de 50m)
                var distancia = CalcularDistancia(
                    dto.UbicacionCompletado.Latitud,
                    dto.UbicacionCompletado.Longitud,
                    entrega.Direccion.Latitud,
                    entrega.Direccion.Longitud
                );

                if (distancia > 50) // 50 metros
                {
                    return BadRequest(new
                    {
                        error = "Fuera de rango",
                        mensaje = $"Debes estar a menos de 50m del punto de entrega. Distancia actual: {distancia:F0}m",
                        distancia = distancia
                    });
                }

                // Actualizar entrega
                entrega.Estado = "COMPLETADO";
                entrega.FechaCompletado = DateTime.Parse(dto.FechaCompletado);
                entrega.LatitudCompletado = dto.UbicacionCompletado.Latitud;
                entrega.LongitudCompletado = dto.UbicacionCompletado.Longitud;
                entrega.Observaciones = dto.Observaciones;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Entrega completada exitosamente",
                    entregaId = entrega.Id,
                    folio = entrega.Folio,
                    distanciaAlPunto = distancia
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error completando entrega: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtener ubicación actual del chofer
        /// GET /api/mobile/chofer/ubicacion/actual
        /// </summary>
        [HttpGet("chofer/ubicacion/actual")]
        public async Task<IActionResult> ObtenerUbicacionActual()
        {
            try
            {
                var choferId = ObtenerChoferIdActual();

                var ubicacion = await _context.UbicacionesChofer
                    .Where(u => u.ChoferId == choferId)
                    .OrderByDescending(u => u.FechaHora)
                    .FirstOrDefaultAsync();

                if (ubicacion == null)
                {
                    return NotFound("No hay ubicación registrada");
                }

                return Ok(new
                {
                    latitud = ubicacion.Latitud,
                    longitud = ubicacion.Longitud,
                    velocidad = ubicacion.Velocidad,
                    precision = ubicacion.Precision,
                    fechaHora = ubicacion.FechaHora,
                    enRuta = ubicacion.EnRuta
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error obteniendo ubicación: {ex.Message}");
            }
        }

        /// <summary>
        /// Verificar si el chofer puede completar una entrega (está dentro de la geocerca)
        /// GET /api/mobile/entregas/{id}/puede-completar
        /// </summary>
        [HttpGet("entregas/{id}/puede-completar")]
        public async Task<IActionResult> PuedeCompletarEntrega(int id)
        {
            try
            {
                var choferId = ObtenerChoferIdActual();

                var entrega = await _context.Entregas
                    .Include(e => e.Direccion)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (entrega == null)
                {
                    return NotFound("Entrega no encontrada");
                }

                // Obtener última ubicación del chofer
                var ubicacion = await _context.UbicacionesChofer
                    .Where(u => u.ChoferId == choferId)
                    .OrderByDescending(u => u.FechaHora)
                    .FirstOrDefaultAsync();

                if (ubicacion == null)
                {
                    return Ok(new
                    {
                        puedeCompletar = false,
                        razon = "No hay ubicación registrada",
                        distancia = 0
                    });
                }

                // Calcular distancia
                var distancia = CalcularDistancia(
                    ubicacion.Latitud,
                    ubicacion.Longitud,
                    entrega.Direccion.Latitud,
                    entrega.Direccion.Longitud
                );

                var puedeCompletar = distancia <= 50; // 50 metros

                return Ok(new
                {
                    puedeCompletar = puedeCompletar,
                    distancia = distancia,
                    radio = 50,
                    ubicacionChofer = new
                    {
                        latitud = ubicacion.Latitud,
                        longitud = ubicacion.Longitud
                    },
                    puntoEntrega = new
                    {
                        latitud = entrega.Direccion.Latitud,
                        longitud = entrega.Direccion.Longitud
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error verificando proximidad: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtener historial de ubicaciones del chofer (para visualizar ruta)
        /// GET /api/mobile/chofer/ubicaciones/historial
        /// </summary>
        [HttpGet("chofer/ubicaciones/historial")]
        public async Task<IActionResult> ObtenerHistorialUbicaciones([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            try
            {
                var choferId = ObtenerChoferIdActual();

                var query = _context.UbicacionesChofer
                    .Where(u => u.ChoferId == choferId);

                if (desde.HasValue)
                {
                    query = query.Where(u => u.FechaHora >= desde.Value);
                }

                if (hasta.HasValue)
                {
                    query = query.Where(u => u.FechaHora <= hasta.Value);
                }

                var ubicaciones = await query
                    .OrderBy(u => u.FechaHora)
                    .Select(u => new
                    {
                        latitud = u.Latitud,
                        longitud = u.Longitud,
                        velocidad = u.Velocidad,
                        fechaHora = u.FechaHora
                    })
                    .ToListAsync();

                return Ok(ubicaciones);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error obteniendo historial: {ex.Message}");
            }
        }

        // ==================== MÉTODOS AUXILIARES ====================

        /// <summary>
        /// Calcular distancia entre dos puntos GPS (fórmula de Haversine)
        /// Retorna la distancia en metros
        /// </summary>
        private double CalcularDistancia(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000; // Radio de la Tierra en metros
            var lat1Rad = lat1 * Math.PI / 180;
            var lat2Rad = lat2 * Math.PI / 180;
            var deltaLat = (lat2 - lat1) * Math.PI / 180;
            var deltaLon = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
                    Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                    Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distancia = R * c;

            return distancia;
        }

        /// <summary>
        /// Verificar entregas cercanas (dentro de 100m)
        /// </summary>
        private async Task<object[]> VerificarProximidadEntregas(int choferId, double latitud, double longitud)
        {
            var entregas = await _context.Entregas
                .Include(e => e.Direccion)
                .Where(e => e.ChoferId == choferId && e.Estado != "COMPLETADO")
                .ToListAsync();

            var entregasCercanas = entregas
                .Select(e => new
                {
                    entregaId = e.Id,
                    folio = e.Folio,
                    distancia = CalcularDistancia(latitud, longitud, e.Direccion.Latitud, e.Direccion.Longitud),
                    puedeCompletar = CalcularDistancia(latitud, longitud, e.Direccion.Latitud, e.Direccion.Longitud) <= 50
                })
                .Where(e => e.distancia <= 100) // Solo entregas a menos de 100m
                .OrderBy(e => e.distancia)
                .ToArray();

            return entregasCercanas;
        }

        /// <summary>
        /// Obtener ID del chofer actual desde el token o header
        /// </summary>
        private int ObtenerChoferIdActual()
        {
            // En modo desarrollo, usar el header X-Dev-User
            if (Request.Headers.TryGetValue("X-Dev-User", out var devUser))
            {
                // Buscar chofer por username
                var chofer = _context.Choferes
                    .FirstOrDefault(c => c.Username == devUser.ToString());

                if (chofer != null)
                {
                    return chofer.Id;
                }
            }

            // En producción, obtener del token JWT
            var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("chofer_id");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var choferId))
            {
                return choferId;
            }

            // Por defecto, usar chofer 1 (solo para desarrollo)
            return 1;
        }
    }

    // ==================== DTOs ====================

    public class UbicacionDto
    {
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public double Velocidad { get; set; }
        public double Precision { get; set; }
        public bool EnRuta { get; set; }
    }

    public class CompletarEntregaDto
    {
        public string Estado { get; set; }
        public string FechaCompletado { get; set; }
        public UbicacionCompletadoDto UbicacionCompletado { get; set; }
        public string Observaciones { get; set; }
    }

    public class UbicacionCompletadoDto
    {
        public double Latitud { get; set; }
        public double Longitud { get; set; }
    }

    // ==================== MODELOS (Agregar a tu DbContext) ====================

    public class UbicacionChofer
    {
        public int Id { get; set; }
        public int ChoferId { get; set; }
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public double Velocidad { get; set; }
        public double Precision { get; set; }
        public DateTime FechaHora { get; set; }
        public bool EnRuta { get; set; }

        // Navegación
        public virtual Chofer Chofer { get; set; }
    }

    // Agregar a entidad Entrega:
    // public DateTime? FechaCompletado { get; set; }
    // public double? LatitudCompletado { get; set; }
    // public double? LongitudCompletado { get; set; }
}

/**
 * MIGRACIÓN DE BASE DE DATOS
 *
 * Ejecuta estos comandos en la terminal del backend:
 *
 * dotnet ef migrations add AddTrackingSystem
 * dotnet ef database update
 *
 * O ejecuta este SQL manualmente:
 */

/*
-- Crear tabla de ubicaciones de chofer
CREATE TABLE UbicacionesChofer (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ChoferId INT NOT NULL,
    Latitud FLOAT NOT NULL,
    Longitud FLOAT NOT NULL,
    Velocidad FLOAT NOT NULL DEFAULT 0,
    Precision FLOAT NOT NULL DEFAULT 0,
    FechaHora DATETIME NOT NULL DEFAULT GETUTCDATE(),
    EnRuta BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (ChoferId) REFERENCES Choferes(Id)
);

-- Agregar campos a tabla Entregas
ALTER TABLE Entregas ADD FechaCompletado DATETIME NULL;
ALTER TABLE Entregas ADD LatitudCompletado FLOAT NULL;
ALTER TABLE Entregas ADD LongitudCompletado FLOAT NULL;

-- Índices para mejor performance
CREATE INDEX IX_UbicacionesChofer_ChoferId_FechaHora
ON UbicacionesChofer(ChoferId, FechaHora DESC);

CREATE INDEX IX_Entregas_Estado
ON Entregas(Estado);
*/
