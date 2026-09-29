using GameHUB.Data;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Services;

public class ScheduleCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ScheduleCleanupService> _logger;

    public ScheduleCleanupService(IServiceProvider serviceProvider, ILogger<ScheduleCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddDays(1).AddHours(4); // 04:00 AM next day
            if (now.Hour < 4)
            {
                nextRun = now.Date.AddHours(4); // 04:00 AM today
            }

            var delay = nextRun - now;
            _logger.LogInformation("Schedule cleanup will run in {Delay}", delay);

            await Task.Delay(delay, stoppingToken);

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var currentDate = DateOnly.FromDateTime(DateTime.Today);

                int deletedRows = await dbContext.ScheduleBlocks
                    .Where(sb => sb.Date < currentDate)
                    .ExecuteDeleteAsync(stoppingToken);

                _logger.LogInformation("Cleaned up {Count} old schedule records.", deletedRows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cleaning up old schedule records.");
            }
        }
    }
}
