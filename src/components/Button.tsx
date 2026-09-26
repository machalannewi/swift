import { ButtonHTMLAttributes } from "react";
import { cva } from "class-variance-authority";

const classes = cva(
    "border h-12 rounded-full px-6 font-medium inline-flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 disabled:pointer-events-none",
    {
        variants: {
            variant: {
                primary:
                    "bg-lime-400 text-neutral-950 border-lime-400 hover:bg-lime-300 hover:border-lime-300",
                secondary:
                    "border-white text-white bg-transparent hover:bg-white/10",
            },
            size: {
                sm: "h-10",
            },
        },
    }
);

export default function Button(
    props: {
        variant: "primary" | "secondary";
        size?: "sm";
    } & ButtonHTMLAttributes<HTMLButtonElement>
) {
    const { variant, size, className, ...otherProps } = props;
    return (
        <button
            className={classes({
                variant,
                size,
                className,
            })}
            {...otherProps}
        ></button>
    );
}
