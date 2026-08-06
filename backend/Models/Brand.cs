// MATFLOTE: EF Core entity/model for Brand data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Brand
{
    [Key]
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
}
