dotnet tool install --global dotnet-ef || true
dotnet ef migrations add UpdateScheduleBlocksTimeSpan -p GameHUB
