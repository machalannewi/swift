import { handle, HttpError, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCar } from "@/utils/CarListData";
import { readJson, requireString } from "@/lib/validate";

// Turns the signed-in account into a driver awaiting approval.
export const POST = handle(async (req: Request) => {
    const user = await requireUser();
    if (user.role === "ADMIN") throw new HttpError(403, "Admins can't register as drivers");
    if (user.driverProfile) throw new HttpError(409, "You have already applied");

    const rideCount = await prisma.ride.count({ where: { riderId: user.id } });
    if (rideCount > 0) {
        throw new HttpError(
            409,
            "This account has rider history. Please sign up for a separate driver account.",
        );
    }

    const body = await readJson(req);
    const car = getCar(requireString(body.carTier, "Vehicle type", 40));
    if (!car) throw new HttpError(400, "Choose a vehicle type");

    const plateNumber = requireString(body.plateNumber, "Plate number", 20).toUpperCase();
    const plateTaken = await prisma.driverProfile.findUnique({ where: { plateNumber } });
    if (plateTaken) throw new HttpError(409, "That plate number is already registered");

    await prisma.$transaction([
        prisma.driverProfile.create({
            data: {
                userId: user.id,
                carTier: car.tier,
                vehicleMake: requireString(body.vehicleMake, "Vehicle make", 40),
                vehicleModel: requireString(body.vehicleModel, "Vehicle model", 40),
                vehicleColor: requireString(body.vehicleColor, "Vehicle color", 20),
                plateNumber,
                licenseNumber: requireString(body.licenseNumber, "Licence number", 40),
                phone: requireString(body.phone, "Phone number", 20),
            },
        }),
        prisma.user.update({ where: { id: user.id }, data: { role: "DRIVER" } }),
    ]);

    return Response.json({ ok: true }, { status: 201 });
});
