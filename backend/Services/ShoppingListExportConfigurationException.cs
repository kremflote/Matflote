// MATFLOTE: Typed exception for missing or invalid shopping-list export configuration.
// Note: Controllers can translate this into useful errors instead of exposing low-level HTTP or settings failures.

namespace DinnerPlanner.Api.Services;

public class ShoppingListExportConfigurationException(string message) : Exception(message);
