using DinnerPlanner.Api.Contexts;
using DinnerPlanner.Api.Dtos;
using DinnerPlanner.Api.Models;
using DinnerPlanner.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DinnerPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BrandsController(DinnerPlannerContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BrandDto>>> GetBrands()
    {
        var brands = await context.Brands
            .AsNoTracking()
            .OrderBy(brand => brand.Name)
            .ToListAsync();

        return Ok(brands.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<BrandDto>> CreateBrand(LookupRequest request)
    {
        var name = request.Name.Trim();
        var existingBrands = await context.Brands
            .AsNoTracking()
            .ToListAsync();
        var existingBrandName = LookupDuplicateDetector.FindNormalizedDuplicate(
            name,
            existingBrands.Select(brand => brand.Name)
        );
        var existingBrand = existingBrandName is null
            ? null
            : existingBrands.First(brand => brand.Name == existingBrandName);

        if (existingBrand is not null)
        {
            return Ok(ToDto(existingBrand));
        }

        var brand = new Brand { Name = name };
        context.Brands.Add(brand);
        await context.SaveChangesAsync();

        return Ok(ToDto(brand));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBrand(int id)
    {
        var brand = await context.Brands.FindAsync(id);
        if (brand is null)
        {
            return NotFound();
        }

        context.Brands.Remove(brand);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static BrandDto ToDto(Brand brand) => new(brand.BrandId, brand.Name);
}
