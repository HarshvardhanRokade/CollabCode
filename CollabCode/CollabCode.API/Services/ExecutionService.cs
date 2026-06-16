using System.Text;
using System.Text.Json;
using CollabCode.API.DTOs;

namespace CollabCode.API.Services;

public class ExecutionService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    private static readonly Dictionary<string, int> _languageIds = new()
    {
        { "javascript", 93 },
        { "python",     71 },
        { "java",       62 },
        { "csharp",     51 },
        { "cpp",        54 },
        { "typescript", 94 },
        { "go",         60 },
        { "rust",       73 },
    };

    public ExecutionService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public async Task<ExecutionResponseDto> ExecuteAsync(ExecutionRequestDto dto)
    {
        try
        {
            var baseUrl = _config["Judge0:BaseUrl"]!;

            if (!_languageIds.TryGetValue(dto.Language.ToLower(), out var languageId))
                languageId = 93;

            var submitRequest = new
            {
                source_code = Convert.ToBase64String(Encoding.UTF8.GetBytes(dto.Code)),
                language_id = languageId,
                stdin = Convert.ToBase64String(Encoding.UTF8.GetBytes(dto.Input)),
                encode_stdin = true,
                encoded = true
            };

            // Submit code
            var submitMsg = new HttpRequestMessage(HttpMethod.Post,
                $"{baseUrl}/submissions?base64_encoded=true&wait=false");
            submitMsg.Content = new StringContent(
                JsonSerializer.Serialize(submitRequest),
                Encoding.UTF8,
                "application/json"
            );

            var submitResponse = await _http.SendAsync(submitMsg);
            var submitBody = await submitResponse.Content.ReadAsStringAsync();

            var submitResult = JsonSerializer.Deserialize<JsonElement>(submitBody);
            if (!submitResult.TryGetProperty("token", out var tokenElement))
            {
                return new ExecutionResponseDto
                {
                    Error = $"Submission failed: {submitBody}",
                    Status = "Error"
                };
            }

            var token = tokenElement.GetString()!;

            // Poll for result — max 10 attempts x 1 second = 10 seconds
            JsonElement result = default;
            for (int i = 0; i < 10; i++)
            {
                await Task.Delay(1000);

                var getMsg = new HttpRequestMessage(HttpMethod.Get,
                    $"{baseUrl}/submissions/{token}?base64_encoded=true");

                var getResponse = await _http.SendAsync(getMsg);
                var getBody = await getResponse.Content.ReadAsStringAsync();
                result = JsonSerializer.Deserialize<JsonElement>(getBody);

                if (result.TryGetProperty("status", out var statusEl))
                {
                    var statusId = statusEl.GetProperty("id").GetInt32();
                    if (statusId > 2) break;
                }
            }

            return ParseResult(result);
        }
        catch (TaskCanceledException)
        {
            // HttpClient timeout fired
            return new ExecutionResponseDto
            {
                Error = "Code execution timed out. Judge0 took too long to respond.",
                Status = "Timeout"
            };
        }
        catch (HttpRequestException ex)
        {
            // Network error — Judge0 is down
            return new ExecutionResponseDto
            {
                Error = $"Could not reach execution service: {ex.Message}",
                Status = "Unavailable"
            };
        }
        catch (Exception ex)
        {
            return new ExecutionResponseDto
            {
                Error = $"Unexpected error: {ex.Message}",
                Status = "Error"
            };
        }
    }

    private ExecutionResponseDto ParseResult(JsonElement result)
    {
        var response = new ExecutionResponseDto();

        if (result.TryGetProperty("status", out var status))
            response.Status = status.GetProperty("description").GetString() ?? "Unknown";

        if (result.TryGetProperty("stdout", out var stdout) &&
            stdout.ValueKind != JsonValueKind.Null)
            response.Output = Encoding.UTF8.GetString(
                Convert.FromBase64String(stdout.GetString()!));

        if (result.TryGetProperty("stderr", out var stderr) &&
            stderr.ValueKind != JsonValueKind.Null)
            response.Error += Encoding.UTF8.GetString(
                Convert.FromBase64String(stderr.GetString()!));

        if (result.TryGetProperty("compile_output", out var compile) &&
            compile.ValueKind != JsonValueKind.Null)
            response.Error += Encoding.UTF8.GetString(
                Convert.FromBase64String(compile.GetString()!));

        if (result.TryGetProperty("time", out var time) &&
    time.ValueKind != JsonValueKind.Null)
        {
            if (double.TryParse(time.GetString(), out var execTime))
                response.ExecutionTime = execTime;
        }

        if (result.TryGetProperty("memory", out var memory) &&
            memory.ValueKind != JsonValueKind.Null)
            response.MemoryUsed = memory.GetInt32();

        return response;
    }
}