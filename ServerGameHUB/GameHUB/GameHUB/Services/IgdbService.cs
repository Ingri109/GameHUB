using IGDB;
using IGDB.Models;

namespace GameHUB.Services;

public class IgdbService
{
    private readonly IGDBClient _igdb;

    public IgdbService(IConfiguration config)
    {
        // Клієнт автоматично отримує токен від Twitch і керує ним
        _igdb = new IGDBClient(
            config["IGDB_CLIENT_ID"], 
            config["IGDB_CLIENT_SECRET"]
        );
    }

    public async Task<IEnumerable<object>> SearchGamesAsync(string query)
    {
        // Шукаємо гру за назвою, витягуємо лише потрібні нам поля: id, назву та обкладинку
        var queryStr = $"search \"{query}\"; fields id, name, cover.image_id; limit 10;";
        var games = await _igdb.QueryAsync<Game>(IGDBClient.Endpoints.Games, queryStr);

        // Мапимо результат у просту структуру для нашого фронтенду
        return games.Select(g => new 
        {
            ExternalId = g.Id,
            Title = g.Name,
            // IGDB віддає лише image_id, ми формуємо повне посилання на картинку
            CoverUrl = g.Cover?.Value?.ImageId != null 
                ? $"https://images.igdb.com/igdb/image/upload/t_cover_big/{g.Cover.Value.ImageId}.jpg" 
                : null
        });
    }
}