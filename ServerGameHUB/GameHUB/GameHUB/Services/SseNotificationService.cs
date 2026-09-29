using System;
using System.Collections.Concurrent;
using System.Threading.Channels;
using System.Threading.Tasks;

namespace GameHUB.Services;

public class SseNotificationService
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<string>>> _clients = new();

    public Guid AddClient(Guid userId, Channel<string> channel)
    {
        var connectionId = Guid.NewGuid();
        var userConnections = _clients.GetOrAdd(userId, _ => new ConcurrentDictionary<Guid, Channel<string>>());
        userConnections.TryAdd(connectionId, channel);
        return connectionId;
    }

    public void RemoveClient(Guid userId, Guid connectionId)
    {
        if (_clients.TryGetValue(userId, out var userConnections))
        {
            userConnections.TryRemove(connectionId, out _);
            if (userConnections.IsEmpty)
            {
                _clients.TryRemove(userId, out _);
            }
        }
    }

    public async Task SendNotificationAsync(Guid userId, string data)
    {
        if (_clients.TryGetValue(userId, out var userConnections))
        {
            foreach (var channel in userConnections.Values)
            {
                await channel.Writer.WriteAsync(data);
            }
        }
    }
}
