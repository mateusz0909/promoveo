import { Container } from "@/components";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {

    // For static export, we'll link to the main React app's auth routes
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

    return (
        <header className="px-4 h-14 sticky top-0 inset-x-0 w-full bg-background/40 backdrop-blur-lg border-b border-border z-50">
            <Container reverse>
                <div className="flex items-center justify-between h-full mx-auto md:max-w-screen-xl">
                    <div className="flex items-start">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/icons/logo_icon_white.png"
                                alt="Lemmi Studio"
                                width={32}
                                height={32}
                                priority
                                unoptimized
                                className="h-8 w-8"
                            />
                            <span className="text-xl font-bold">Lemmi Studio</span>
                        </Link>
                    </div>
                    <nav className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <ul className="flex items-center justify-center gap-8">
                            <Link href="#features" className="hover:text-foreground/80 text-sm">Features</Link>
                            <Link href="#how-it-works" className="hover:text-foreground/80 text-sm">How It Works</Link>
                            <Link href="#pricing" className="hover:text-foreground/80 text-sm">Pricing</Link>
                            <Link href="#testimonials" className="hover:text-foreground/80 text-sm">Testimonials</Link>
                        </ul>
                    </nav>
                    <div className="flex items-center gap-4">
                        <a href={`${APP_URL}/login`} className={buttonVariants({ size: "sm", variant: "ghost" })}>
                            Sign In
                        </a>
                        <a href={`${APP_URL}/signup`} className={buttonVariants({ size: "sm", className: "hidden md:flex" })}>
                            Start Free
                        </a>
                    </div>
                </div>
            </Container>
        </header>
    )
};

export default Navbar
