using Microsoft.AspNetCore.Mvc;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class HealthController : ControllerBase
    {
        private readonly ILogger<HealthController> _logger;

        public HealthController(ILogger<HealthController> logger)
        {
            _logger = logger;
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            _logger.LogInformation("Health check endpoint chamado");
            return Ok(new { status = "ok", timestamp = DateTime.UtcNow });
        }
    }
}
