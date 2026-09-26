// Grants (or removes) admin access. The first admin has to be made here.
// The person must have signed in to Swift at least once.
// Usage: npm run make-admin -- <email> [--remove]
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
    const [email, flag] = process.argv.slice(2);
    if (!email) {
        const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
        console.log("Usage: npm run make-admin -- <email> [--remove]\n");
        console.log(admins.length ? "Current admins:" : "No admins yet.");
        admins.forEach((a) => console.log(`  ${a.email}`));
        return;
    }

    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { driverProfile: true },
    });
    if (!user) throw new Error(`No user with email ${email} - they need to sign in to Swift once first`);

    if (flag === "--remove") {
        if (user.role !== "ADMIN") throw new Error(`${email} is not an admin`);
        await prisma.user.update({ where: { id: user.id }, data: { role: "RIDER" } });
        console.log(`${email} is no longer an admin`);
        return;
    }

    if (user.driverProfile) {
        throw new Error(`${email} is a driver account - use a separate account for admin`);
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN", suspendedAt: null } });
    console.log(`${email} is now an admin - open /admin`);
}

main()
    .catch((err) => {
        console.error(err.message ?? err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
