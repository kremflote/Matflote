using DinnerPlanner.Api.Models;

namespace DinnerPlanner.Api.Services;

public static class NutritionReferenceDefaults
{
    public const string SourceUrl = "https://www.helsedirektoratet.no/rapporter/referanseverdier-for-energi-og-naeringsstoffer/anbefalinger-om-energi-og-naeringsstoffer-ved-planlegging-av-kosthold";

    public static IReadOnlyCollection<NutritionReferenceProfileDefinition> Profiles { get; } =
    [
        Create("child-1-3", "Child 1-3", "Child", 1, 3, 300m, 120m, 1.5m, 25m, 10m, 7m),
        Create("child-4-6", "Child 4-6", "Child", 4, 6, 350m, 140m, 1.7m, 35m, 10m, 8m),
        Create("child-7-10", "Child 7-10", "Child", 7, 10, 450m, 200m, 2.5m, 55m, 10m, 9m),
        Create("female-11-14", "Female 11-14", "Female", 11, 14, 650m, 280m, 3.5m, 75m, 10m, 10m),
        Create("female-15-17", "Female 15-17", "Female", 15, 17, 650m, 310m, 4m, 90m, 10m, 11m),
        Create("female-18-24", "Female 18-24", "Female", 18, 24, 700m, 330m, 4m, 95m, 10m, 10m),
        Create("female-25-50", "Female 25-50", "Female", 25, 50, 700m, 330m, 4m, 95m, 10m, 10m),
        Create("female-51-70", "Female 51-70", "Female", 51, 70, 700m, 330m, 4m, 95m, 10m, 9m),
        Create("female-70-plus", "Female 70+", "Female", 70, null, 650m, 330m, 4m, 95m, 20m, 9m),
        Create("pregnant-trimester-1", "Pregnant, trimester 1", "Pregnancy", 18, null, 750m, 600m, 4.5m, 105m, 10m, 10m),
        Create("pregnant-trimester-2", "Pregnant, trimester 2", "Pregnancy", 18, null, 750m, 600m, 4.5m, 105m, 10m, 11m),
        Create("pregnant-trimester-3", "Pregnant, trimester 3", "Pregnancy", 18, null, 750m, 600m, 4.5m, 105m, 10m, 12m),
        Create("lactating", "Lactating", "Lactating", 18, null, 1400m, 490m, 5.5m, 155m, 10m, 11m),
        Create("male-11-14", "Male 11-14", "Male", 11, 14, 700m, 260m, 3m, 80m, 10m, 11m),
        Create("male-15-17", "Male 15-17", "Male", 15, 17, 750m, 320m, 4m, 105m, 10m, 12m),
        Create("male-18-24", "Male 18-24", "Male", 18, 24, 800m, 330m, 4m, 110m, 10m, 11m),
        Create("male-25-50", "Male 25-50", "Male", 25, 50, 800m, 330m, 4m, 110m, 10m, 11m),
        Create("male-51-70", "Male 51-70", "Male", 51, 70, 800m, 330m, 4m, 110m, 10m, 11m),
        Create("male-70-plus", "Male 70+", "Male", 70, null, 750m, 330m, 4m, 110m, 20m, 11m)
    ];

    private static NutritionReferenceProfileDefinition Create(
        string profileId,
        string label,
        string gender,
        int minAge,
        int? maxAge,
        decimal vitaminA,
        decimal vitaminB9,
        decimal vitaminB12,
        decimal vitaminC,
        decimal vitaminD,
        decimal vitaminE
    ) => new(
        profileId,
        label,
        gender,
        minAge,
        maxAge,
        [
            new("vitaminA", "Vitamin A", vitaminA, "ug", NutritionReferenceValueType.RecommendedIntake),
            new("vitaminB9", "Vitamin B9", vitaminB9, "ug", NutritionReferenceValueType.RecommendedIntake),
            new("vitaminB12", "Vitamin B12", vitaminB12, "ug", NutritionReferenceValueType.AdequateIntake),
            new("vitaminC", "Vitamin C", vitaminC, "mg", NutritionReferenceValueType.RecommendedIntake),
            new("vitaminD", "Vitamin D", vitaminD, "ug", NutritionReferenceValueType.RecommendedIntake),
            new("vitaminE", "Vitamin E", vitaminE, "mg", NutritionReferenceValueType.AdequateIntake)
        ]
    );
}

public record NutritionReferenceProfileDefinition(
    string ProfileId,
    string Label,
    string Gender,
    int MinAge,
    int? MaxAge,
    IReadOnlyCollection<NutritionReferenceValueDefinition> Values
);

public record NutritionReferenceValueDefinition(
    string NutrientKey,
    string Label,
    decimal DailyAmount,
    string Unit,
    NutritionReferenceValueType ValueType
);
