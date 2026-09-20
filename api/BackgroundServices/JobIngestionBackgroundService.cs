using InternLinkApi.Services.IngestionService;

namespace InternLinkApi.BackgroundServices;

/// <summary>
/// Long-running background service that triggers the external job ingestion pipeline
/// on a recurring schedule. The first run is delayed to avoid competing with startup
/// migrations; subsequent runs fire every <see cref="SyncInterval"/>.
///
/// Lifecycle notes:
/// • Uses IServiceScopeFactory to resolve Scoped services (IJobRepository, etc.) from
///   a Singleton-hosted BackgroundService — the standard pattern for hosted services.
/// • Cancellation is respected at every await point so the host can shut down cleanly.
/// • All exceptions are caught and logged; a failure does NOT crash the host.
/// </summary>
public class JobIngestionBackgroundService : BackgroundService
{
    /// <summary>How often to poll external job boards for new listings.</summary>
    private static readonly TimeSpan SyncInterval = TimeSpan.FromHours(12);

    /// <summary>Grace period before the first run, giving the API time to fully warm up.</summary>
    private static readonly TimeSpan InitialDelay = TimeSpan.FromSeconds(45);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<JobIngestionBackgroundService> _logger;

    public JobIngestionBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<JobIngestionBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "JobIngestionBackgroundService started. First sync in {Delay}.",
            InitialDelay);

        // Initial delay — let the web host finish startup before hitting external APIs.
        try
        {
            await Task.Delay(InitialDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return; // Shutdown before the first sync. Nothing to clean up.
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            await RunSyncSafeAsync(stoppingToken);

            try
            {
                await Task.Delay(SyncInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break; // Graceful shutdown requested while waiting.
            }
        }

        _logger.LogInformation("JobIngestionBackgroundService stopping.");
    }

    private async Task RunSyncSafeAsync(CancellationToken ct)
    {
        _logger.LogInformation("JobIngestionBackgroundService: starting sync run at {Timestamp}", DateTimeOffset.UtcNow);

        try
        {
            // Create a fresh DI scope for each run so Scoped services (EF DbContext, repos)
            // are properly disposed after the sync completes.
            using var scope = _scopeFactory.CreateScope();
            var ingestionService = scope.ServiceProvider
                .GetRequiredService<IExternalJobIngestionService>();

            var result = await ingestionService.SyncAllSourcesAsync(ct);

            _logger.LogInformation(
                "JobIngestionBackgroundService: sync completed — ingested={Ingested}, skipped={Skipped}, failed={Failed}",
                result.Ingested, result.Skipped, result.Failed);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            _logger.LogInformation("JobIngestionBackgroundService: sync cancelled (shutdown).");
        }
        catch (Exception ex)
        {
            // Log and continue — a transient API failure must not bring down the service.
            _logger.LogError(ex,
                "JobIngestionBackgroundService: unhandled exception during sync. Will retry in {Interval}.",
                SyncInterval);
        }
    }
}
