using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        // Counselors have no self-registration path, so ensure the test account exists even on already-seeded DBs.
        await EnsureCounselorUserAsync(userManager, roleManager);

        // Idempotency guard: if companies already exist, refresh seed job deadlines if expired and return.
        if (await db.Companies.AnyAsync())
        {
            var utcNow = DateTimeOffset.UtcNow;
            var expiredJobs = await db.Jobs.Where(j => j.DeadLine < utcNow && j.IsApproved && !j.IsClosed).ToListAsync();
            if (expiredJobs.Count != 0)
            {
                foreach (var j in expiredJobs)
                {
                    j.DeadLine = utcNow.AddDays(30);
                }
                await db.SaveChangesAsync();
                Console.WriteLine($"INFO: Refreshed deadlines for {expiredJobs.Count} seeded jobs.");
            }
            Console.WriteLine("INFO: Database already seeded — skipping initial setup.");
            return;
        }

        // ── Roles ──────────────────────────────────────────────────────────
        var roleNames = new[] { "Student", "Company", "Admin", "Counselor" };
        var createdRoles = new List<Role>();

        foreach (var name in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(name))
            {
                var role = new Role { Name = name, NormalizedName = name.ToUpperInvariant() };
                await roleManager.CreateAsync(role);
                createdRoles.Add(role);
                Console.WriteLine($"INFO: Seeded role '{name}'.");
            }
            else
            {
                var existing = await roleManager.FindByNameAsync(name);
                if (existing is not null) createdRoles.Add(existing);
            }
        }

        var adminRole = createdRoles.First(r => r.Name == "Admin");
        var companyRole = createdRoles.First(r => r.Name == "Company");
        var studentRole = createdRoles.First(r => r.Name == "Student");

        // ── Admin user ─────────────────────────────────────────────────────
        const string adminEmail = "admin@internlink.test";
        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                CreatedAt = DateTimeOffset.UtcNow,
                IsActive = true,
                RoleId = adminRole.Id
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123");
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to create admin user: {errors}");
            }
            await userManager.AddToRoleAsync(adminUser, "Admin");
            Console.WriteLine($"INFO: Seeded admin user '{adminEmail}'.");
        }

        // ── Skills ─────────────────────────────────────────────────────────
        var skills = new List<Skill>
        {
            // Backend
            new() { SkillName = "C#", DomainClassification = DomainClassification.Backend },
            new() { SkillName = "ASP.NET Core", DomainClassification = DomainClassification.Backend },
            new() { SkillName = "SQL", DomainClassification = DomainClassification.Backend },
            new() { SkillName = "Docker", DomainClassification = DomainClassification.Backend },
            new() { SkillName = "Entity Framework Core", DomainClassification = DomainClassification.Backend },
            new() { SkillName = "REST API Design", DomainClassification = DomainClassification.Backend },
            // Frontend
            new() { SkillName = "React", DomainClassification = DomainClassification.Frontend },
            new() { SkillName = "TypeScript", DomainClassification = DomainClassification.Frontend },
            new() { SkillName = "Tailwind CSS", DomainClassification = DomainClassification.Frontend },
            new() { SkillName = "Next.js", DomainClassification = DomainClassification.Frontend },
            // DevOps
            new() { SkillName = "CI/CD", DomainClassification = DomainClassification.DevOps },
            new() { SkillName = "AWS", DomainClassification = DomainClassification.DevOps },
            new() { SkillName = "Kubernetes", DomainClassification = DomainClassification.DevOps },
            new() { SkillName = "PostgreSQL", DomainClassification = DomainClassification.DevOps },
            // SoftSkills
            new() { SkillName = "Communication", DomainClassification = DomainClassification.SoftSkills },
            new() { SkillName = "Teamwork", DomainClassification = DomainClassification.SoftSkills },
            new() { SkillName = "Problem Solving", DomainClassification = DomainClassification.SoftSkills },
        };

        foreach (var skill in skills)
        {
            var exists = await db.Skills.AnyAsync(s => s.SkillName == skill.SkillName);
            if (!exists)
            {
                db.Skills.Add(skill);
            }
        }
        await db.SaveChangesAsync();
        Console.WriteLine($"INFO: Seeded {skills.Count} skills.");

        // Reload skills from DB to get their IDs
        var skillDict = await db.Skills.ToDictionaryAsync(s => s.SkillName);

        // ── Companies with linked users ────────────────────────────────────
        var companyData = new[]
        {
            new { Name = "TechNest Solutions", Sector = "Software Development", Website = "https://technest.example.com" },
            new { Name = "DataForge Inc.", Sector = "Data Engineering & Analytics", Website = "https://dataforge.example.com" },
            new { Name = "CloudPeak Systems", Sector = "Cloud Infrastructure", Website = "https://cloudpeak.example.com" },
        };

        var companies = new List<Company>();
        foreach (var cd in companyData)
        {
            var user = new User
            {
                UserName = $"hr@{cd.Name.Replace(" ", "").ToLowerInvariant()}.test",
                Email = $"hr@{cd.Name.Replace(" ", "").ToLowerInvariant()}.test",
                EmailConfirmed = true,
                CreatedAt = DateTimeOffset.UtcNow,
                IsActive = true,
                RoleId = companyRole.Id
            };
            var createResult = await userManager.CreateAsync(user, "Company@123");
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                Console.Error.WriteLine($"WARN: Failed to create user for {cd.Name}: {errors}");
                continue;
            }
            await userManager.AddToRoleAsync(user, "Company");

            var company = new Company
            {
                UserId = user.Id,
                CompanyName = cd.Name,
                CorporateWebsite = cd.Website,
                IndustrySector = cd.Sector,
                VerificationStatus = VerificationStatus.Verified
            };
            db.Companies.Add(company);
            companies.Add(company);
        }
        await db.SaveChangesAsync();
        Console.WriteLine($"INFO: Seeded {companies.Count} companies.");

        // ── Jobs with JobSkills ────────────────────────────────────────────
        var jobData = new[]
        {
            new
            {
                CompanyIndex = 0,
                Title = "Backend Software Engineering Intern",
                Description = "Design and implement RESTful APIs using ASP.NET Core. Collaborate with the frontend team to integrate user-facing features, write unit and integration tests, and participate in code reviews. You'll work on real production services that serve thousands of users.",
                Criteria = "Currently pursuing BSc in CSE or equivalent. Familiarity with C#, SQL, and Git. Bonus: experience with Docker or cloud platforms.",
                Skills = new Dictionary<string, int>
                {
                    ["C#"] = 5,
                    ["ASP.NET Core"] = 5,
                    ["SQL"] = 4,
                    ["Docker"] = 3,
                    ["REST API Design"] = 4,
                    ["Teamwork"] = 2,
                }
            },
            new
            {
                CompanyIndex = 1,
                Title = "Data Engineering Intern",
                Description = "Build and maintain ETL pipelines, write complex SQL queries for analytics, and help design our data warehouse schema. You'll work alongside senior engineers to process and model terabytes of event data.",
                Criteria = "Pursuing a degree in CSE, MIS, or a quantitative field. Strong SQL skills, basic Python, and familiarity with database design concepts.",
                Skills = new Dictionary<string, int>
                {
                    ["SQL"] = 5,
                    ["PostgreSQL"] = 4,
                    ["Communication"] = 2,
                    ["Problem Solving"] = 3,
                }
            },
            new
            {
                CompanyIndex = 0,
                Title = "Full-Stack Web Development Intern",
                Description = "Develop end-to-end features across our Next.js frontend and .NET backend. You'll own small features from database schema design through UI implementation, gaining exposure to the full stack in a production environment.",
                Criteria = "CSE or related major. Experience with React or TypeScript, basic understanding of REST APIs, and enthusiasm for learning both frontend and backend technologies.",
                Skills = new Dictionary<string, int>
                {
                    ["React"] = 4,
                    ["TypeScript"] = 4,
                    ["Tailwind CSS"] = 3,
                    ["C#"] = 3,
                    ["ASP.NET Core"] = 3,
                    ["Communication"] = 2,
                }
            },
            new
            {
                CompanyIndex = 2,
                Title = "DevOps & Cloud Engineering Intern",
                Description = "Assist in managing our Kubernetes clusters, improve CI/CD pipelines, and automate infrastructure provisioning with Terraform. This role offers deep exposure to cloud-native tooling and production operations.",
                Criteria = "Pursuing CSE or related field. Familiarity with Linux CLI, scripting (Bash/Python), and basic networking concepts. AWS or Kubernetes exposure is a strong plus.",
                Skills = new Dictionary<string, int>
                {
                    ["Docker"] = 4,
                    ["CI/CD"] = 4,
                    ["AWS"] = 3,
                    ["Kubernetes"] = 3,
                    ["Teamwork"] = 2,
                }
            },
            new
            {
                CompanyIndex = 1,
                Title = "Frontend Engineering Intern (React)",
                Description = "Build responsive, accessible user interfaces using React and TypeScript. Work closely with our design team to implement pixel-perfect UI components and contribute to our internal component library.",
                Criteria = "CSE or equivalent. Solid understanding of JavaScript/TypeScript, experience with React hooks and component patterns, and a good eye for UI/UX details.",
                Skills = new Dictionary<string, int>
                {
                    ["React"] = 5,
                    ["TypeScript"] = 5,
                    ["Tailwind CSS"] = 4,
                    ["Next.js"] = 3,
                    ["Communication"] = 2,
                    ["Teamwork"] = 2,
                }
            },
        };

        var now = DateTimeOffset.UtcNow;
        foreach (var jd in jobData)
        {
            var job = new Job
            {
                CompanyId = companies[jd.CompanyIndex].Id,
                Title = jd.Title,
                CoreDescription = jd.Description,
                SelectionCriteria = jd.Criteria,
                LocationType = jd.CompanyIndex switch
                {
                    0 => LocationType.Hybrid,
                    1 => LocationType.Remote,
                    _ => LocationType.OnSite,
                },
                DeadLine = now.AddDays(30),
                IsApproved = true,
                IsClosed = false,
            };
            db.Jobs.Add(job);
            await db.SaveChangesAsync();

            foreach (var (skillName, weight) in jd.Skills)
            {
                if (skillDict.TryGetValue(skillName, out var skill))
                {
                    db.JobSkills.Add(new JobSkill
                    {
                        JobId = job.Id,
                        SkillId = skill.Id,
                        RequiredImportanceWeight = weight,
                    });
                }
            }
        }
        await db.SaveChangesAsync();
        Console.WriteLine($"INFO: Seeded {jobData.Length} jobs with JobSkills.");

        // ── Student with StudentSkills ─────────────────────────────────────
        const string studentEmail = "student@internlink.test";
        if (await userManager.FindByEmailAsync(studentEmail) is null)
        {
            var studentUser = new User
            {
                UserName = studentEmail,
                Email = studentEmail,
                EmailConfirmed = true,
                CreatedAt = DateTimeOffset.UtcNow,
                IsActive = true,
                RoleId = studentRole.Id
            };
            var createResult = await userManager.CreateAsync(studentUser, "Student@123");
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to create student user: {errors}");
            }
            await userManager.AddToRoleAsync(studentUser, "Student");

            var student = new Student
            {
                UserId = studentUser.Id,
                FirstName = "Faria",
                LastName = "Hossain",
                CGPA = 3.75m,
                InstitutionalId = "AUST-2023-047",
                Department = "Computer Science & Engineering",
                Biography = "Passionate full-stack developer with experience in building web applications using ASP.NET Core and React. Interested in backend architecture and cloud-native technologies.",
                Interests = "Open source, AI/ML, competitive programming",
            };
            db.Students.Add(student);
            await db.SaveChangesAsync();

            // Overlapping with Backend Engineering Intern (job 0) — C#, ASP.NET Core, SQL, Docker
            // and Frontend Intern (job 4) — React, TypeScript; but NOT Tailwind CSS or Next.js
            var studentSkillMappings = new Dictionary<string, int>
            {
                ["C#"] = 4,
                ["ASP.NET Core"] = 4,
                ["SQL"] = 3,
                ["React"] = 3,
                ["TypeScript"] = 2,
                ["Communication"] = 3,
                ["Teamwork"] = 4,
            };

            foreach (var (skillName, proficiency) in studentSkillMappings)
            {
                if (skillDict.TryGetValue(skillName, out var skill))
                {
                    db.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = student.Id,
                        SkillId = skill.Id,
                        ProficiencyLevel = proficiency,
                    });
                }
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"INFO: Seeded student '{studentEmail}' with {studentSkillMappings.Count} skills.");
        }

        Console.WriteLine("INFO: Database seeding complete.");
    }

    private static async Task EnsureCounselorUserAsync(UserManager<User> userManager, RoleManager<Role> roleManager)
    {
        var counselorRole = await roleManager.FindByNameAsync("Counselor");
        if (counselorRole is null)
        {
            counselorRole = new Role { Name = "Counselor", NormalizedName = "COUNSELOR" };
            await roleManager.CreateAsync(counselorRole);
            Console.WriteLine("INFO: Seeded role 'Counselor'.");
        }

        const string counselorEmail = "counselor@internlink.test";
        if (await userManager.FindByEmailAsync(counselorEmail) is not null) return;

        var counselorUser = new User
        {
            UserName = counselorEmail,
            Email = counselorEmail,
            EmailConfirmed = true,
            CreatedAt = DateTimeOffset.UtcNow,
            IsActive = true,
            RoleId = counselorRole.Id
        };
        var result = await userManager.CreateAsync(counselorUser, "Counselor@123");
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create counselor user: {errors}");
        }
        await userManager.AddToRoleAsync(counselorUser, "Counselor");
        Console.WriteLine($"INFO: Seeded counselor user '{counselorEmail}'.");
    }
}
