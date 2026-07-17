using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoresController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StoreDto>>> GetStores()
    {
        var stores = await context.Stores
            .AsNoTracking()
            .OrderBy(store => store.Name)
            .ToListAsync();

        return Ok(stores.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<StoreDto>> CreateStore(LookupRequest request)
    {
        var name = request.Name.Trim();
        var existingStore = await context.Stores
            .FirstOrDefaultAsync(store => store.Name.ToLower() == name.ToLower());

        if (existingStore is not null)
        {
            return Ok(ToDto(existingStore));
        }

        var possibleDuplicate = LookupDuplicateDetector.FindNearDuplicate(
            name,
            await context.Stores.AsNoTracking().Select(store => store.Name).ToListAsync()
        );
        if (possibleDuplicate is not null)
        {
            return Conflict($"Possible duplicate: {possibleDuplicate}.");
        }

        var store = new Store { Name = name };
        context.Stores.Add(store);
        await context.SaveChangesAsync();

        return Ok(ToDto(store));
    }

    private static StoreDto ToDto(Store store) => new(store.StoreId, store.Name);
}
