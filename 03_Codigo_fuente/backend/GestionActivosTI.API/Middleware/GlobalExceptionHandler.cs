using System.Net;
using Microsoft.AspNetCore.Diagnostics;

namespace GestionActivosTI.API.Middleware;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Excepción no controlada en {Path}", httpContext.Request.Path);

        httpContext.Response.ContentType = "application/json";
        httpContext.Response.StatusCode  = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            message = "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
            detail  = env.IsDevelopment() ? exception.Message : null
        };

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);
        return true;
    }
}
