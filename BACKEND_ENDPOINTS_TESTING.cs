/**
 * ENDPOINTS DEL BACKEND PARA SISTEMA DE TESTING
 *
 * Agrega estos endpoints a tu controller de Mobile en el backend
 * Por ejemplo: MobileController.cs o TestDataController.cs
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FultraTrack.API.Controllers
{
    [ApiController]
    [Route("api/mobile/test")]
    public class TestDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestDataController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Crear cliente de prueba
        /// POST /api/mobile/test/clientes
        /// </summary>
        [HttpPost("clientes")]
        public async Task<IActionResult> CreateTestCliente([FromBody] TestClienteDto dto)
        {
            try
            {
                // Validar datos
                if (string.IsNullOrEmpty(dto.Nombre) || string.IsNullOrEmpty(dto.RFC))
                {
                    return BadRequest("Nombre y RFC son requeridos");
                }

                // Crear cliente
                var cliente = new Cliente
                {
                    Nombre = dto.Nombre,
                    RFC = dto.RFC,
                    Telefono = dto.Telefono,
                    Email = dto.Email,
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow,
                    EsTestData = true, // Flag para identificar datos de prueba
                };

                await _context.Clientes.AddAsync(cliente);
                await _context.SaveChangesAsync();

                // Crear dirección
                var direccion = new Direccion
                {
                    ClienteId = cliente.Id,
                    Calle = dto.Direccion.Calle,
                    Numero = dto.Direccion.Numero,
                    Colonia = dto.Direccion.Colonia,
                    Ciudad = dto.Direccion.Ciudad,
                    Estado = dto.Direccion.Estado,
                    CodigoPostal = dto.Direccion.CodigoPostal,
                    Latitud = dto.Direccion.Coordenadas.Latitud,
                    Longitud = dto.Direccion.Coordenadas.Longitud,
                };

                await _context.Direcciones.AddAsync(direccion);
                await _context.SaveChangesAsync();

                return Ok(new { clienteId = cliente.Id, mensaje = "Cliente creado" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creando cliente: {ex.Message}");
            }
        }

        /// <summary>
        /// Crear entrega de prueba
        /// POST /api/mobile/test/entregas
        /// </summary>
        [HttpPost("entregas")]
        public async Task<IActionResult> CreateTestEntrega([FromBody] TestEntregaDto dto)
        {
            try
            {
                // Validar datos
                if (string.IsNullOrEmpty(dto.OrdenVenta) || string.IsNullOrEmpty(dto.Folio))
                {
                    return BadRequest("OrdenVenta y Folio son requeridos");
                }

                // Buscar o crear cliente
                var cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.RFC == dto.Cliente.RFC);

                if (cliente == null)
                {
                    cliente = new Cliente
                    {
                        Nombre = dto.Cliente.Nombre,
                        RFC = dto.Cliente.RFC,
                        Telefono = dto.Cliente.Telefono,
                        Email = dto.Cliente.Email,
                        Activo = true,
                        FechaCreacion = DateTime.UtcNow,
                        EsTestData = true,
                    };
                    await _context.Clientes.AddAsync(cliente);
                    await _context.SaveChangesAsync();
                }

                // Crear dirección de entrega
                var direccion = new Direccion
                {
                    ClienteId = cliente.Id,
                    Calle = dto.DireccionEntrega.Calle,
                    Numero = dto.DireccionEntrega.Numero,
                    Colonia = dto.DireccionEntrega.Colonia,
                    Ciudad = dto.DireccionEntrega.Ciudad,
                    Estado = dto.DireccionEntrega.Estado,
                    CodigoPostal = dto.DireccionEntrega.CodigoPostal,
                    Latitud = dto.DireccionEntrega.Coordenadas.Latitud,
                    Longitud = dto.DireccionEntrega.Coordenadas.Longitud,
                };
                await _context.Direcciones.AddAsync(direccion);
                await _context.SaveChangesAsync();

                // Crear entrega
                var entrega = new Entrega
                {
                    OrdenVenta = dto.OrdenVenta,
                    Folio = dto.Folio,
                    Fecha = DateTime.Parse(dto.Fecha),
                    TipoEntrega = dto.TipoEntrega,
                    Estado = dto.Estado,
                    ClienteId = cliente.Id,
                    DireccionEntregaId = direccion.Id,
                    Prioridad = dto.Prioridad,
                    HorarioEntregaInicio = TimeSpan.Parse(dto.HorarioEntregaInicio),
                    HorarioEntregaFin = TimeSpan.Parse(dto.HorarioEntregaFin),
                    Observaciones = dto.Observaciones,
                    FechaCreacion = DateTime.UtcNow,
                    EsTestData = true,
                };

                await _context.Entregas.AddAsync(entrega);
                await _context.SaveChangesAsync();

                // Crear productos
                foreach (var productoDto in dto.Productos)
                {
                    // Buscar o crear producto
                    var producto = await _context.Productos
                        .FirstOrDefaultAsync(p => p.SKU == productoDto.SKU);

                    if (producto == null)
                    {
                        producto = new Producto
                        {
                            SKU = productoDto.SKU,
                            Nombre = productoDto.Nombre,
                            Descripcion = productoDto.Descripcion,
                            Unidad = productoDto.Unidad,
                            Peso = productoDto.Peso,
                            Activo = true,
                        };
                        await _context.Productos.AddAsync(producto);
                        await _context.SaveChangesAsync();
                    }

                    // Agregar producto a la entrega
                    var entregaProducto = new EntregaProducto
                    {
                        EntregaId = entrega.Id,
                        ProductoId = producto.Id,
                        Cantidad = productoDto.Cantidad,
                        CantidadEntregada = 0,
                    };

                    await _context.EntregasProductos.AddAsync(entregaProducto);
                }

                await _context.SaveChangesAsync();

                return Ok(new { entregaId = entrega.Id, mensaje = "Entrega creada" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creando entrega: {ex.Message}");
            }
        }

        /// <summary>
        /// Crear ruta GPS de prueba
        /// POST /api/mobile/test/rutas-gps
        /// </summary>
        [HttpPost("rutas-gps")]
        public async Task<IActionResult> CreateTestRutaGPS([FromBody] TestRutaGPSDto dto)
        {
            try
            {
                // Crear ruta
                var ruta = new RutaGPS
                {
                    DistanciaTotal = dto.DistanciaTotal,
                    DuracionEstimada = dto.DuracionEstimada,
                    FechaCreacion = DateTime.UtcNow,
                    EsTestData = true,
                };

                await _context.RutasGPS.AddAsync(ruta);
                await _context.SaveChangesAsync();

                // Crear puntos GPS
                foreach (var puntoDto in dto.Puntos)
                {
                    var punto = new PuntoGPS
                    {
                        RutaGPSId = ruta.Id,
                        Latitud = puntoDto.Latitud,
                        Longitud = puntoDto.Longitud,
                        Timestamp = DateTime.Parse(puntoDto.Timestamp),
                        Velocidad = puntoDto.Velocidad,
                    };

                    await _context.PuntosGPS.AddAsync(punto);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    rutaId = ruta.Id,
                    puntosCreados = dto.Puntos.Count,
                    mensaje = "Ruta GPS creada"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error creando ruta GPS: {ex.Message}");
            }
        }

        /// <summary>
        /// Limpiar todos los datos de prueba
        /// DELETE /api/mobile/test/all
        /// </summary>
        [HttpDelete("all")]
        public async Task<IActionResult> ClearTestData()
        {
            try
            {
                // Contar antes de eliminar
                var clientesCount = await _context.Clientes.CountAsync(c => c.EsTestData);
                var entregasCount = await _context.Entregas.CountAsync(e => e.EsTestData);
                var rutasCount = await _context.RutasGPS.CountAsync(r => r.EsTestData);

                // Eliminar entregas de prueba (cascade eliminará productos relacionados)
                var entregas = await _context.Entregas
                    .Where(e => e.EsTestData || e.OrdenVenta.StartsWith("OV-2025"))
                    .ToListAsync();

                _context.Entregas.RemoveRange(entregas);

                // Eliminar clientes de prueba
                var clientes = await _context.Clientes
                    .Where(c => c.EsTestData)
                    .ToListAsync();

                _context.Clientes.RemoveRange(clientes);

                // Eliminar rutas GPS de prueba
                var rutas = await _context.RutasGPS
                    .Where(r => r.EsTestData)
                    .ToListAsync();

                _context.RutasGPS.RemoveRange(rutas);

                // Guardar cambios
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Datos de prueba eliminados",
                    clientesEliminados = clientesCount,
                    entregasEliminadas = entregasCount,
                    rutasEliminadas = rutasCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error limpiando datos: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtener estadísticas de datos de prueba
        /// GET /api/mobile/test/stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetTestDataStats()
        {
            try
            {
                var stats = new
                {
                    clientes = await _context.Clientes.CountAsync(c => c.EsTestData),
                    entregas = await _context.Entregas.CountAsync(e => e.EsTestData),
                    rutasGPS = await _context.RutasGPS.CountAsync(r => r.EsTestData),
                    productos = await _context.Productos
                        .Where(p => p.SKU.StartsWith("PROD-"))
                        .CountAsync(),
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error obteniendo estadísticas: {ex.Message}");
            }
        }
    }

    // ===== DTOs =====

    public class TestClienteDto
    {
        public string Nombre { get; set; }
        public string RFC { get; set; }
        public string Telefono { get; set; }
        public string Email { get; set; }
        public TestDireccionDto Direccion { get; set; }
    }

    public class TestDireccionDto
    {
        public string Calle { get; set; }
        public string Numero { get; set; }
        public string Colonia { get; set; }
        public string Ciudad { get; set; }
        public string Estado { get; set; }
        public string CodigoPostal { get; set; }
        public TestCoordenadasDto Coordenadas { get; set; }
    }

    public class TestCoordenadasDto
    {
        public double Latitud { get; set; }
        public double Longitud { get; set; }
    }

    public class TestEntregaDto
    {
        public string OrdenVenta { get; set; }
        public string Folio { get; set; }
        public string Fecha { get; set; }
        public string TipoEntrega { get; set; }
        public string Estado { get; set; }
        public TestClienteDto Cliente { get; set; }
        public TestDireccionDto DireccionEntrega { get; set; }
        public List<TestProductoDto> Productos { get; set; }
        public int Prioridad { get; set; }
        public string HorarioEntregaInicio { get; set; }
        public string HorarioEntregaFin { get; set; }
        public string Observaciones { get; set; }
    }

    public class TestProductoDto
    {
        public string SKU { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public int Cantidad { get; set; }
        public string Unidad { get; set; }
        public double Peso { get; set; }
    }

    public class TestRutaGPSDto
    {
        public List<TestPuntoGPSDto> Puntos { get; set; }
        public double DistanciaTotal { get; set; }
        public int DuracionEstimada { get; set; }
    }

    public class TestPuntoGPSDto
    {
        public double Latitud { get; set; }
        public double Longitud { get; set; }
        public string Timestamp { get; set; }
        public double Velocidad { get; set; }
    }
}

/**
 * MIGRACIONES NECESARIAS
 *
 * Agrega estos campos a tus modelos existentes:
 */

/*
// En Cliente.cs
public bool EsTestData { get; set; } = false;

// En Entrega.cs
public bool EsTestData { get; set; } = false;

// En RutaGPS.cs (o como se llame en tu proyecto)
public bool EsTestData { get; set; } = false;

// Luego ejecuta:
// dotnet ef migrations add AddTestDataFlags
// dotnet ef database update
*/
