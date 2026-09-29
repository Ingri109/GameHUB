using GameHUB.Data;
using GameHUB.Models;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Repositories;

public class SessionRepository : ISessionRepository
{
    private readonly AppDbContext _context;

    public SessionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Session> CreateAsync(Session session)
    {
        await _context.Sessions.AddAsync(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<Session?> GetByIdAsync(Guid id)
    {
        return await _context.Sessions
            .Include(s => s.Participants)
            .Include(s => s.Game)
            .FirstOrDefaultAsync(s => s.Id == id);
    }
    
    public async Task AddParticipantAsync(SessionParticipant participant)
    {
        await _context.SessionParticipants.AddAsync(participant);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsUserInSessionAsync(Guid sessionId, Guid userId)
    {
        return await _context.SessionParticipants
            .AnyAsync(sp => sp.SessionId == sessionId && sp.UserId == userId);
    }
    
    public async Task<SessionParticipant?> GetParticipantAsync(Guid sessionId, Guid userId)
    {
        return await _context.SessionParticipants
            .FirstOrDefaultAsync(sp => sp.SessionId == sessionId && sp.UserId == userId);
    }

    public async Task UpdateParticipantAsync(SessionParticipant participant)
    {
        _context.SessionParticipants.Update(participant);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveParticipantAsync(SessionParticipant participant)
    {
        _context.SessionParticipants.Remove(participant);
        await _context.SaveChangesAsync();
    }
}