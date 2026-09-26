import Image from "next/image";
import logoImage from "@/assets/images/logo.svg";

const footerLinks = [
    { href: "#", label: "Contact" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms & Conditions" },
];

export default function Footer() {
    return (
        <section className="py-24">
            <div className="container">
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-6">
                    <div>
                        <Image src={logoImage} alt="Swift logo" />
                    </div>
                    <div>
                        <nav className="flex gap-6">
                            {footerLinks.map((link) => {
                                return (
                                    <a
                                        className="text-white/50 text-sm"
                                        href={link.href}
                                        key={link.label}
                                    >
                                        {link.label}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </section>
    );
}
