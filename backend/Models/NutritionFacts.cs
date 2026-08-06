// MATFLOTE: EF Core entity/model for NutritionFacts data stored by MATFLOTE.
// Note: Navigation properties are initialized to empty collections so controllers can safely add related rows without null checks.

namespace DinnerPlanner.Api.Models;

public class NutritionFacts
{
    public int? Calories { get; set; }
    public decimal? CarbohydrateGrams { get; set; }
    public decimal? ProteinGrams { get; set; }
    public decimal? FatGrams { get; set; }
    public decimal? SaltGrams { get; set; }
    public decimal? DietaryFiberGrams { get; set; }
    public decimal? SaturatedFatGrams { get; set; }
    public decimal? TransFatGrams { get; set; }
    public decimal? MonounsaturatedFatGrams { get; set; }
    public decimal? PolyunsaturatedFatGrams { get; set; }
    public decimal? Omega3Grams { get; set; }
    public decimal? Omega6Grams { get; set; }
    public decimal? CholesterolMilligrams { get; set; }
    public decimal? VitaminAMicrograms { get; set; }
    public decimal? VitaminB9Micrograms { get; set; }
    public decimal? VitaminB12Micrograms { get; set; }
    public decimal? VitaminCMilligrams { get; set; }
    public decimal? VitaminDMicrograms { get; set; }
    public decimal? VitaminEMilligrams { get; set; }
    // Kept for old local data compatibility. MATFLOTE no longer surfaces these until source coverage is reliable.
    public decimal? VitaminKMicrograms { get; set; }
    public decimal? CholineMilligrams { get; set; }
    public List<Vitamin> Vitamins { get; set; } = [];
}
