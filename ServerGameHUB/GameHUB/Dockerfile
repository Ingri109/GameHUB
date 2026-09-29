# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first to leverage Docker layer caching
COPY ["GameHUB.sln", "./"]
COPY ["GameHUB/GameHUB.csproj", "GameHUB/"]
RUN dotnet restore "GameHUB.sln"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/GameHUB"
RUN dotnet build "GameHUB.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "GameHUB.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# The standard port for ASP.NET Core in .NET 8/9/10+
EXPOSE 8080

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GameHUB.dll"]
