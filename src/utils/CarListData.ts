export type CarTier = "SWIFT_X" | "SWIFT_COMFORT" | "SWIFT_XL";

export interface CarData {
    id: number;
    tier: CarTier;
    name: string;
    seat: number;
    desc: string;
    baseFare: number;
    amountPerKm: number;
}

export const carListData: CarData[] = [
    {
        id: 1,
        tier: "SWIFT_X",
        name: "Swift X",
        seat: 4,
        desc: "Affordable rides",
        baseFare: 500,
        amountPerKm: 200,
    },
    {
        id: 2,
        tier: "SWIFT_COMFORT",
        name: "Swift Comfort",
        seat: 4,
        desc: "Extra legroom",
        baseFare: 700,
        amountPerKm: 300,
    },
    {
        id: 3,
        tier: "SWIFT_XL",
        name: "Swift XL",
        seat: 6,
        desc: "Groups up to 6",
        baseFare: 900,
        amountPerKm: 400,
    },
];

export const getCar = (tier: string) => carListData.find((c) => c.tier === tier);

export const calculateFare = (car: CarData, distanceMeters: number) =>
    Math.round(car.baseFare + car.amountPerKm * (distanceMeters / 1000));

export const formatNaira = (amount: number) =>
    `₦${Math.round(amount).toLocaleString()}`;
