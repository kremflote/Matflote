// MATFLOTE: Design-time EF Core factory used by migration commands when the web app is not running.
// Note: It duplicates the SQLite connection setup lightly so CLI migration tooling can work without booting Program.cs.

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
