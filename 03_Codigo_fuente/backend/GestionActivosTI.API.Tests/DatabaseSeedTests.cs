using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Xunit;

namespace GestionActivosTI.API.Tests;

public class DatabaseSeedTests
{
    private static string GetSqlFilePath([CallerFilePath] string sourceFilePath = "")
    {
        var testProjectDir = Path.GetDirectoryName(sourceFilePath)!;
        return Path.GetFullPath(Path.Combine(testProjectDir, "..", "..", "database", "01_database.sql"));
    }

    [Fact]
    public void HashesSembradosParaUsuarios_CoincidenConLaPasswordDocumentada()
    {
        var sqlPath = GetSqlFilePath();
        Assert.True(File.Exists(sqlPath), $"No se encontró el script SQL en {sqlPath}");

        var sql = File.ReadAllText(sqlPath);

        var insertBlock = Regex.Match(sql, @"INSERT INTO Usuarios[\s\S]*?GO", RegexOptions.IgnoreCase).Value;
        var hashes = Regex.Matches(insertBlock, @"'(\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53})'")
            .Select(m => m.Groups[1].Value)
            .ToList();

        Assert.NotEmpty(hashes);
        Assert.All(hashes, hash => Assert.True(BCrypt.Net.BCrypt.Verify("Admin@2024", hash),
            $"El hash '{hash}' del script SQL no corresponde a la contraseña documentada 'Admin@2024'"));
    }
}
