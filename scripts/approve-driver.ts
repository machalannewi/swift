// Approves (or rejects/suspends) a driver until the admin panel exists.
// Usage: npm run approve-driver -- <email> [APPROVED|REJECTED|SUSPENDED]
import "dotenv/config";
import { PrismaClient, DriverStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
    const [email, statusArg = "APPROVED"] = process.argv.slice(2);
    if (!email) {
        const pending = await prisma.driverProfile.findMany({
            where: { status: "PENDING" },
            include: { user: { select: { email: true, name: true } } },
        });
        console.log("Usage: npm run approve-driver -- <email> [APPROVED|REJECTED|SUSPENDED]\n");
        console.log(pending.length ? "Pending drivers:" : "No pending drivers.");
        for (const d of pending) {
            console.log(`  ${d.user.email}  ${d.user.name ?? ""}  ${d.vehicleMake} ${d.vehicleModel} (${d.plateNumber})`);
        }
        return;
    }

    const status = statusArg.toUpperCase() as DriverStatus;
    if (!Object.values(DriverStatus).includes(status)) {
        throw new Error(`Unknown status ${statusArg}`);
    }

    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { driverProfile: true },
    });
    if (!user?.driverProfile) throw new Error(`No driver application found for ${email}`);

    await prisma.driverProfile.update({
        where: { userId: user.id },
        data: { status, ...(status === "APPROVED" ? {} : { isOnline: false }) },
    });
    console.log(`${email} is now ${status}`);
}

main()
    .catch((err) => {
        console.error(err.message ?? err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
