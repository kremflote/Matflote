using System.ComponentModel.DataAnnotations;

namespace DinnerPlanner.Api.Models;

public class Brand
{
    [Key]
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
}
