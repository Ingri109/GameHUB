using GameHUB.Models;

namespace GameHUB.Repositories;

public interface ISessionRepository
{
    Task<Session> CreateAsync(Session session);
    Task<Session?> GetByIdAsync(Guid id);
    Task AddParticipantAsync(SessionParticipant participant);
    Task<bool> IsUserInSessionAsync(Guid sessionId, Guid userId);
    Task<SessionParticipant?> GetParticipantAsync(Guid sessionId, Guid userId);
    Task UpdateParticipantAsync(SessionParticipant participant);
    Task RemoveParticipantAsync(SessionParticipant participant); // Для очищення
}