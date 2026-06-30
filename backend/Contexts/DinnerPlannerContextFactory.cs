using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DinnerPlanner.Api.Contexts;

public class DinnerPlannerContextFactory : IDesignTimeDbContextFactory<DinnerPlannerContext>
{
    public DinnerPlannerContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DinnerPlannerContext>();
        optionsBuilder.UseSqlite("Data Source=dinnerplanner.dev.db");

        return new DinnerPlannerContext(optionsBuilder.Options);
    }
}
