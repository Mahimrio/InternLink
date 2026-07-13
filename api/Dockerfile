# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers for better caching
COPY ["api/InternLinkApi.csproj", "api/"]
RUN dotnet restore "api/InternLinkApi.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/api"
RUN dotnet publish "InternLinkApi.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080

# Non-root user (provided by aspnet image)
USER app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "InternLinkApi.dll"]