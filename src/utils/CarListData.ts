export interface CarData {
    id: number;
    name: string;
    seat: number;
    desc: string;
    baseFare: number;
    amountPerKm: number; 
    image: string;
}

export const carListData: CarData[] = [
    {
        id: 1,
        name: "Swift X",
        seat: 4,
        desc: "Affordable rides",
        baseFare: 500,
        amountPerKm: 200,
        image: '/uber.png'
    },
    {
        id: 2,
        name: "Swift Comfort",
        seat: 4,
        desc: "Extra legroom",
        baseFare: 700,
        amountPerKm: 300,
        image: '/uber.png'
    },
    {
        id: 3,
        name: "Swift XL",
        seat: 6,
        desc: "Groups up to 6",
        baseFare: 900,
        amountPerKm: 400,
        image: '/uber.png'
    },
]