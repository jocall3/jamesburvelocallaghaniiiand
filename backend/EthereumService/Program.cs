using EthereumService.Services;
using Microsoft.OpenApi.Models;
using Nethereum.Web3;

var builder = WebApplication.CreateBuilder(args);

// 1. Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Ethereum Transaction Analyzer API", Version = "v1" });
});

// Add CORS services to allow frontend applications to call the API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});


// 2. Configure Nethereum Web3 from configuration
// It's recommended to use an environment variable for production and appsettings for development.
var infuraUrl = builder.Configuration["INFURA_MAINNET_URL"];
if (string.IsNullOrEmpty(infuraUrl))
{
    infuraUrl = builder.Configuration.GetConnectionString("InfuraMainnet");
    if (string.IsNullOrEmpty(infuraUrl))
    {
        throw new InvalidOperationException("Infura URL is not configured. Set either the INFURA_MAINNET_URL environment variable or the 'InfuraMainnet' connection string in appsettings.json.");
    }
}

// Register IWeb3 as a singleton so the same instance is reused across the application.
// This is safe as the Web3 client is designed to be thread-safe.
builder.Services.AddSingleton<IWeb3>(new Web3(infuraUrl));

// 3. Register custom application services
// The TransactionAnalyzer service will contain the core logic for simulating and explaining transactions.
builder.Services.AddScoped<ITransactionAnalyzer, TransactionAnalyzer>();


var app = builder.Build();

// 4. Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ethereum Transaction Analyzer API V1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
    });
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();