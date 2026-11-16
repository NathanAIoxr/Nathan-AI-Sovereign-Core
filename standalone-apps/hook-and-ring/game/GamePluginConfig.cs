using System;
using System.Collections.Generic;
using System.Text.Json;

// Data contract for Five Physics Chassis by Nathan Tabor.
// Target .NET 8+. Hosts are responsible for validating chassis parameter ranges.
public sealed class GamePluginConfig
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string BaseChassis { get; init; }
    public required string Art { get; init; }
    public required string Sound { get; init; }
    public string? Theme { get; init; }
    public string? Mark { get; init; }
    public required JsonElement Parameters { get; init; }
    public required BridgeReward Bridge { get; init; }

    public T ReadParameters<T>() where T : notnull
    {
        var parameters = Parameters.Deserialize<T>(JsonOptions);
        return parameters is null ? throw new JsonException($"Missing parameters for {Id}") : parameters;
    }

    public static IReadOnlyList<GamePluginConfig> ReadCatalog(string json) =>
        JsonSerializer.Deserialize<List<GamePluginConfig>>(json, JsonOptions)
        ?? throw new JsonException("Missing game catalog");

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}

public sealed record BridgeReward(int Points);
public sealed record ArcParameters(string EventId, double Angle, double Force, double? Spin = null, double[]? Target = null, double? Wind = null);
public sealed record SpinParameters(double Mass, double Gravity, double Inertia, double TargetAngle,
    double Tolerance, double Rebound, double MinimumRotation);
public sealed record TetherParameters(string Mode, double? Wind, int? Course);
public sealed record RhythmParameters(double BeatMs, double StrikePhase, double Window, int Lane, double Recoil);
public sealed record CraftParameters(int[] Path, double Tolerance, double Minimum);
