# ConwayGameOfLife.Api — multi-stage build (publish self-contained layout for Linux)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ConwayGameOfLife.sln ./
COPY src/ ./src/
COPY tests/ ./tests/

RUN dotnet restore src/ConwayGameOfLife.Api/ConwayGameOfLife.Api.csproj
RUN dotnet publish src/ConwayGameOfLife.Api/ConwayGameOfLife.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
# Override in docker-compose for a mounted volume path
ENV ConnectionStrings__DefaultConnection=Data Source=/data/gameoflife.db

EXPOSE 8080

ENTRYPOINT ["dotnet", "ConwayGameOfLife.Api.dll"]
