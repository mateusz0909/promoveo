"use client";

import { Container, Icons, Wrapper } from "@/components";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Particles } from "@/components/ui/particles";
import { Ripple } from "@/components/ui/ripple";
import { NeonGradientCard } from "@/components/ui/neon-gradient-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Input } from "@/components/ui/input";
import { Marquee } from "@/components/ui/marquee";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";
import SectionBadge from "@/components/ui/section-badge";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { WordRotate } from "@/components/ui/word-rotate";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import { MagicDemo } from "@/components/magic-demo";
import { Highlighter } from "@/components/ui/highlighter";
import { pricingCards, reviews } from "@/constants";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight, UserIcon, Zap, Image as ImageIcon, FileText, Globe, Upload, Wand2, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ShinyButton } from "@/components/ui/shiny-button";
import { ShineBorder } from "@/components/ui/shine-border";

const HomePage = () => {

    const firstRow = reviews.slice(0, reviews.length / 2);
    const secondRow = reviews.slice(reviews.length / 2);

    return (
        <section className="w-full relative flex items-center justify-center flex-col px-4 md:px-0 py-8">

            {/* Section 1: The Hero - The Magic Box */}
            <Wrapper className="relative overflow-hidden">
                <InteractiveGridPattern
                    className={cn(
                        "absolute inset-0 w-screen left-1/2 -translate-x-1/2",
                        "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
                    )}
                    width={40}
                    height={40}
                    squares={[60, 40]}
                    squaresClassName="fill-primary/10 hover:fill-primary/30 transition-colors duration-500"
                />

                <Container>
                    <div className="flex flex-col items-center justify-center py-20 h-full relative z-10">
                        <button className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200">
                            <span>
                                <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
                            </span>
                            <span className="backdrop absolute inset-[1px] rounded-full bg-neutral-950 transition-colors duration-200 group-hover:bg-neutral-900" />
                            <span className="h-full w-full blur-md absolute bottom-0 inset-x-0 bg-gradient-to-tr from-primary/40"></span>
                            <span className="z-10 py-0.5 text-sm text-neutral-100 flex items-center justify-center gap-1.5">
                                <Image src="/icons/sparkles-dark.svg" alt="✨" width={24} height={24} className="w-4 h-4" />
                                AI-Powered App Launch Kit
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        </button>

                        <div className="flex flex-col items-center mt-8 max-w-4xl w-11/12 md:w-full">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl md:!leading-tight font-bold text-center">
                                <span className="text-foreground">
                                    Go from
                                        Screenshot
                                    
                                    to
                                </span>
                                <WordRotate
                                    className="inline-block text-primary font-bold"
                                    words={["App Store-Ready", "Polished Mockups", "Perfect Copy", "Your Launch"]}
                                    duration={2500}
                                />
                            </h1>
                            <h2 className="text-lg md:text-xl text-foreground/80 mt-6 text-center max-w-2xl px-4 py-3 rounded-lg bg-background/50  border border-border/40 shadow-lg">
                                You built the app.{" "}
                                <Highlighter action="underline" strokeWidth={2} animationDuration={2000} iterations={2} color="#3668F2">
                                    Lemmi handle the launch kit.
                                </Highlighter>{" "}
                                Upload a screenshot and see the magic.
                            </h2>
                        </div>

                        <div className="relative flex flex-col items-center py-10 md:py-16 w-full max-w-6xl">
                            <div className="absolute top-1/2 left-1/2 -z-10 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 rounded-full blur-[120px]"></div>
                            
                            {/* Interactive Magic Demo */}
                            <MagicDemo />
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 2: The Pain You Know Too Well (Agitation) */}
            <Wrapper className="flex flex-col items-center justify-center py-16 md:py-24 relative overflow-hidden">
                {/* Background particles for ambiance */}
                <Particles
                    className="absolute inset-0"
                    quantity={30}
                    ease={80}
                    color="#6366f1"
                    refresh
                />
                
                <Container>
                    <div className="max-w-6xl mx-auto text-center relative z-10">
                        <BlurFade delay={0.1}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-sm font-medium text-foreground">The reality check</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
                                The Finish Line That Isn&apos;t.
                            </h2>
                            <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto mb-4">
                                You built the app. But marketing? That&apos;s a whole different beast.
                            </p>
                        </BlurFade>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            {/* Pain Point 1 - Figma Hell */}
                            <BlurFade delay={0.2}>
                                <div className="relative group h-full">
                                    <div className="relative p-8 h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 transition-all duration-300">
                                        <div className="relative z-10 text-center">
                                            {/* Icon */}
                                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <Highlighter action="crossed-off" strokeWidth={2} animationDuration={1000} iterations={2} isView={true} color="#3668F2">
                                            <h3 className="text-xl font-bold mb-3 text-foreground">Figma Hell</h3>
                                            </Highlighter>
                                            <p className="text-foreground/60 leading-relaxed text-sm">
                                                Spending hours framing screenshots, tweaking text, and wrestling with design tools you hate.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </BlurFade>

                            {/* Pain Point 2 - Copywriter's Block */}
                            <BlurFade delay={0.3}>
                                <div className="relative group h-full">
                                    <div className="relative p-8 h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 transition-all duration-300">
                                        <div className="relative z-10 text-center">
                                            {/* Icon */}
                                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                             <Highlighter action="crossed-off" strokeWidth={2} animationDuration={2000} iterations={2} isView={true} color="#3668F2">
                                            <h3 className="text-xl font-bold mb-3 text-foreground">Copywriter&apos;s Block</h3>
                                            </Highlighter>
                                            <p className="text-foreground/60 leading-relaxed text-sm">
                                                Staring at App Store fields with character limits, trying to sound professional without any marketing experience.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </BlurFade>

                            {/* Pain Point 3 - The Launch That Stalls */}
                            <BlurFade delay={0.4}>
                                <div className="relative group h-full">
                                    <div className="relative p-8 h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 transition-all duration-300">
                                        <div className="relative z-10 text-center">
                                            {/* Icon */}
                                            <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <Highlighter action="crossed-off" strokeWidth={2} animationDuration={3000} iterations={2} isView={true} color="#3668F2">
                                                <h3 className="text-xl font-bold mb-3 text-foreground">The Launch That Stalls</h3>
                                            </Highlighter>
                                            <p className="text-foreground/60 leading-relaxed text-sm">
                                                Your finished app gathers dust while your launch momentum bleeds out. All because of marketing chores.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </BlurFade>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 3: The "Lemmi" Way - Your 3-Step Launchpad */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative">
                <div id="features" className="absolute -top-20"></div>
                <Container>
                    <div className="max-w-4xl mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            From Upload to Launch in{" "}
                               <span className="bg-primary">Three Steps</span>
                            
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            Turn days of tedious work into a guided workflow
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="py-10 md:py-20 w-full max-w-7xl mx-auto relative">
                        {/* Central Vertical Line */}
                        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary/30 to-transparent -translate-x-1/2 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                        
                        <div className="flex flex-col gap-16 lg:gap-24">
                            {/* Step 1 - Right Side */}
                            <BlurFade delay={0.2}>
                                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0 group/step cursor-pointer">
                                    {/* Left spacer with number */}
                                    <div className="hidden lg:flex flex-1 justify-end pr-16">
                                        <div className="text-8xl lg:text-9xl font-bold text-primary/15 select-none transition-all duration-300 group-hover/step:text-primary/30 group-hover/step:scale-105">01</div>
                                    </div>
                                    
                                    {/* Dot on line */}
                                    <div className="hidden lg:block relative">
                                        <div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/50 transition-all duration-300 group-hover/step:w-5 group-hover/step:h-5 group-hover/step:shadow-primary" />
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="flex-1 w-full lg:pl-16">
                                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover/step:border-primary/50 group-hover/step:shadow-xl group-hover/step:shadow-primary/10 group-hover/step:scale-[1.02]">
                                            <CardContent className="p-8">
                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transition-colors duration-300 group-hover/step:bg-primary/20">
                                                    <Upload className="w-8 h-8 text-primary" />
                                                </div>
                                                <h3 className="text-3xl font-bold mb-4">Upload Your Build</h3>
                                                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                                                    Drag and drop up to 10 raw screenshots. We handle the rest.
                                                </p>
                                                <div className="relative w-full h-80 rounded-lg overflow-hidden">
                                                    <Image
                                                        src="/assets/Upload.png"
                                                        alt="Upload Screenshots"
                                                        fill
                                                        className="object-contain opacity-90 transition-opacity duration-300 group-hover/step:opacity-100"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </BlurFade>

                            {/* Step 2 - Left Side */}
                            <BlurFade delay={0.4}>
                                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0 group/step cursor-pointer">
                                    {/* Card */}
                                    <div className="flex-1 w-full lg:pr-16 lg:order-1">
                                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover/step:border-indigo-500/50 group-hover/step:shadow-xl group-hover/step:shadow-indigo-500/10 group-hover/step:scale-[1.02]">
                                            <CardContent className="p-8">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 transition-colors duration-300 group-hover/step:bg-indigo-500/20">
                                                    <Wand2 className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <h3 className="text-3xl font-bold mb-4">Generate & Refine</h3>
                                                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                                                    Our AI instantly creates stunning marketing images, App Store copy, and a full landing page. Tweak anything you want in our visual editor.
                                                </p>
                                                <div className="relative w-full h-80 rounded-lg overflow-hidden">
                                                    <Image
                                                        src="/assets/Refine.png"
                                                        alt="Generate and Refine"
                                                        fill
                                                        className="object-contain opacity-90 transition-opacity duration-300 group-hover/step:opacity-100"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    {/* Dot on line */}
                                    <div className="hidden lg:block relative lg:order-2">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-background shadow-lg shadow-indigo-500/50 transition-all duration-300 group-hover/step:w-5 group-hover/step:h-5 group-hover/step:shadow-indigo-500" />
                                    </div>
                                    
                                    {/* Right spacer with number */}
                                    <div className="hidden lg:flex flex-1 justify-start pl-16 lg:order-3">
                                        <div className="text-8xl lg:text-9xl font-bold text-indigo-500/15 select-none transition-all duration-300 group-hover/step:text-indigo-500/30 group-hover/step:scale-105">02</div>
                                    </div>
                                </div>
                            </BlurFade>

                            {/* Step 3 - Right Side */}
                            <BlurFade delay={0.6}>
                                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0 group/step cursor-pointer">
                                    {/* Left spacer with number */}
                                    <div className="hidden lg:flex flex-1 justify-end pr-16">
                                        <div className="text-8xl lg:text-9xl font-bold text-green-500/15 select-none transition-all duration-300 group-hover/step:text-green-500/30 group-hover/step:scale-105">03</div>
                                    </div>
                                    
                                    {/* Dot on line */}
                                    <div className="hidden lg:block relative">
                                        <div className="w-4 h-4 rounded-full bg-green-500 border-4 border-background shadow-lg shadow-green-500/50 transition-all duration-300 group-hover/step:w-5 group-hover/step:h-5 group-hover/step:shadow-green-500" />
                                    </div>
                                    
                                    {/* Card */}
                                    <div className="flex-1 w-full lg:pl-16">
                                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 group-hover/step:border-green-500/50 group-hover/step:shadow-xl group-hover/step:shadow-green-500/10 group-hover/step:scale-[1.02]">
                                            <CardContent className="p-8">
                                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 transition-colors duration-300 group-hover/step:bg-green-500/20">
                                                    <Download className="w-8 h-8 text-green-500" />
                                                </div>
                                                <h3 className="text-3xl font-bold mb-4">Export & Ship</h3>
                                                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                                                    Download a single ZIP file with all your approved, App Store-compliant assets. Your launch is ready.
                                                </p>
                                                <div className="relative w-full h-80 rounded-lg overflow-hidden">
                                                    <Image
                                                        src="/assets/Export.png"
                                                        alt="Export and Ship"
                                                        fill
                                                        className="object-contain opacity-90 transition-opacity duration-300 group-hover/step:opacity-100"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </BlurFade>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 4: See The Transformation (Visual Proof) */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative overflow-hidden">
                <div id="transformation" className="absolute -top-20"></div>
                
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
                </div>
                
                <Container className="relative z-10">
                    <div className="max-w-4xl mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            Don&apos;t Just Ship. Ship{" "}
                            <Highlighter action="highlight" isView={true} color="#8b5cf6">
                                Professionally
                            </Highlighter>
                            .
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            Watch your raw screenshots transform into App Store-ready marketing assets
                        </p>
                    </div>
                </Container>
                
                <Container className="relative z-10">
                    <div className="py-10 md:py-20 w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-7xl mx-auto items-center">
                            {/* Before - Plain Screenshot */}
                            <BlurFade delay={0.2}>
                                <div className="group flex flex-col items-center">
                                    <div className="mb-8 relative">
                                        <span className="inline-block px-6 py-3 rounded-full bg-muted text-base font-bold text-foreground uppercase tracking-wider border-2 border-border shadow-lg">
                                            Before
                                        </span>
                                    </div>
                                    
                                    <div className="relative w-full max-w-[320px] transition-transform duration-500 group-hover:scale-105">
                                        <div className="relative aspect-[9/19.5] rounded-3xl overflow-hidden shadow-2xl border border-border/30">
                                            <Image
                                                src="/assets/before.jpg"
                                                alt="Raw Screenshot - Before"
                                                fill
                                                className="object-cover grayscale-[20%] opacity-80"
                                            />
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground mt-8 text-center max-w-xs">
                                        Your plain screenshot - functional but forgettable
                                    </p>
                                </div>
                            </BlurFade>
                            
                            {/* After - App Store Ready */}
                            <BlurFade delay={0.4}>
                                <div className="group flex flex-col items-center relative">
                                    {/* Animated glow effect */}
                                    <div className="absolute inset-0 -z-10">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary/40 via-purple-500/40 to-pink-500/40 rounded-full blur-[100px] animate-pulse" />
                                    </div>
                                    
                                    <div className="mb-8 relative z-10">
                                        <div className="relative inline-block">
                                            <AnimatedShinyText className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary to-purple-500 text-base font-bold uppercase tracking-wider border-2 border-primary shadow-2xl text-white">
                                                ✨ After
                                            </AnimatedShinyText>
                                        </div>
                                    </div>
                                    
                                    <div className="relative w-full max-w-[320px] transition-all duration-500 group-hover:scale-110 group-hover:rotate-1">
                                        {/* Outer glow rings */}
                                        <div className="absolute -inset-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                                        <div className="absolute -inset-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                                        
                                        {/* Border beam effect */}
                                        <div className="relative aspect-[9/19.5] rounded-3xl overflow-hidden">
                                            <BorderBeam size={200} duration={8} colorFrom="#3b82f6" colorTo="#8b5cf6" />
                                            <Image
                                                src="/assets/after.jpg"
                                                alt="App Store Ready - After"
                                                fill
                                                className="object-cover"
                                            />
                                            
                                            {/* Shine overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                        </div>
                                        
                                        {/* Floating sparkles */}
                                        <div className="absolute -top-4 -right-4 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
                                        </div>
                                        <div className="absolute -bottom-4 -left-4 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                                            <Zap className="w-6 h-6 text-purple-400 animate-pulse" />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 text-center max-w-xs">
                                        <p className="text-sm font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                            App Store-ready with professional design, branding & copy
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mt-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">Ready to upload</span>
                                        </div>
                                    </div>
                                </div>
                            </BlurFade>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 5: More Than Just Screenshots (Features as Benefits with BentoGrid) */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative">
                <div id="features-dock" className="absolute -top-20"></div>
                <div className="hidden md:block absolute top-0 -right-1/3 w-72 h-72 bg-primary rounded-full blur-[10rem] -z-10"></div>
                <Container>
                    <div className="max-w-4xl mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            Your Complete Go-Live Kit.
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            Everything you need to launch professionally
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="py-10 md:py-20 w-full">
                        <BentoGrid className="auto-rows-[24rem]">
                            {/* Marketing Images - Large Card */}
                            <BentoCard
                                name="Become a Designer in Clicks, Not Years"
                                className="col-span-3 lg:col-span-2 lg:row-span-1"
                                background={
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                                        <div className="relative z-10 flex items-center justify-center w-full h-full p-8">
                                            <div className="grid grid-cols-2 gap-4 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                                <div className="w-24 h-40 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-2xl animate-pulse shadow-lg" />
                                                <div className="w-24 h-40 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-2xl animate-pulse delay-150 shadow-lg" />
                                                <div className="w-24 h-40 bg-gradient-to-br from-pink-500/50 to-primary/50 rounded-2xl animate-pulse delay-300 shadow-lg" />
                                                <div className="w-24 h-40 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-2xl animate-pulse delay-500 shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                                    </div>
                                }
                                Icon={ImageIcon}
                                description="Generate dozens of unique, professional marketing shots with themes, fonts, and layouts that convert. No design skills required."
                                href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/login`}
                                cta="Get Started"
                            />

                            {/* App Store Copy */}
                            <BentoCard
                                name="Write Perfect App Store Copy, Instantly"
                                className="col-span-3 lg:col-span-1 lg:row-span-1"
                                background={
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                                        <div className="relative z-10 flex flex-col items-start justify-center w-full h-full p-6 space-y-2 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                            <div className="w-3/4 h-3 bg-foreground/25 rounded animate-pulse shadow-sm" />
                                            <div className="w-full h-3 bg-foreground/25 rounded animate-pulse delay-100 shadow-sm" />
                                            <div className="w-5/6 h-3 bg-foreground/25 rounded animate-pulse delay-200 shadow-sm" />
                                            <div className="w-2/3 h-3 bg-foreground/25 rounded animate-pulse delay-300 shadow-sm" />
                                            <div className="w-full h-3 bg-foreground/25 rounded animate-pulse delay-400 shadow-sm" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                                    </div>
                                }
                                Icon={FileText}
                                description="From titles to descriptions, our AI writes compelling, compliant copy in multiple languages. Beat the character limits and get discovered."
                                href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/login`}
                                cta="Try It Now"
                            />

                            {/* Landing Page */}
                            <BentoCard
                                name="Launch a Marketing Site Before Your Coffee Gets Cold"
                                className="col-span-3 lg:col-span-1 lg:row-span-1"
                                background={
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                                        <div className="relative z-10 flex items-center justify-center w-full h-full p-6 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                            <div className="w-full max-w-[200px] aspect-[9/16] bg-gradient-to-br from-foreground/25 to-foreground/15 rounded-lg p-3 space-y-2 animate-pulse shadow-xl">
                                                <div className="w-1/2 h-2 bg-foreground/35 rounded shadow-sm" />
                                                <div className="w-full h-16 bg-foreground/25 rounded shadow-sm" />
                                                <div className="w-full h-2 bg-foreground/35 rounded shadow-sm" />
                                                <div className="w-3/4 h-2 bg-foreground/35 rounded shadow-sm" />
                                                <div className="w-full h-8 bg-foreground/25 rounded shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                                    </div>
                                }
                                Icon={Globe}
                                description="Get a complete, deploy-ready landing page with your new assets, logo, and links, bundled in a clean HTML/CSS package."
                                href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/login`}
                                cta="Create Now"
                            />

                            {/* All-in-One Package - Wide Card */}
                            <BentoCard
                                name="Everything Bundled & Ready"
                                className="col-span-3 lg:col-span-2 lg:row-span-1"
                                background={
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                                        <div className="relative z-10 flex items-center justify-center gap-4 w-full h-full p-8 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                                            <div className="w-32 h-32 border-4 border-dashed border-foreground/25 rounded-xl flex items-center justify-center animate-pulse shadow-xl">
                                                <Download className="w-12 h-12 text-amber-400/70 drop-shadow-lg" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
                                    </div>
                                }
                                Icon={Zap}
                                description="Download everything in one ZIP file. Marketing images, App Store assets, landing page code, and metadata—all organized and ready for submission."
                                href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/login`}
                                cta="Get Started"
                            />
                        </BentoGrid>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 7: Simple, Transparent Pricing */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative">
                <div id="pricing" className="absolute -top-20"></div>
                <div className="hidden md:block absolute top-0 -right-1/3 w-72 h-72 bg-blue-500 rounded-full blur-[10rem] -z-10"></div>
                <Container>
                    <div className="max-w-md mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            An Investment in Your Launch.
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            Cheaper than a freelancer. Faster than a design agency.
                        </p>
                    </div>
                </Container>
                <Container className="flex items-center justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full md:gap-8 py-10 md:py-20 flex-wrap max-w-4xl">
                        {pricingCards.map((card) => (
                            <Card
                                key={card.title}
                                className={cn("flex flex-col w-full border-neutral-700 relative",
                                    card.title === "Pro" && "border-2 border-primary"
                                )}
                            >
                                {card.title === "Pro" && <BorderBeam
                                    duration={6}
                                    size={300}
                                />  }
                                <CardHeader className="border-b border-border">
                                    <span className={cn(card.title === "Pro" && "text-primary font-semibold")}>
                                        {card.title}
                                        {card.title === "Pro" && " - Most Popular"}
                                    </span>
                                    <CardTitle className={cn(card.title !== "Pro" && "text-muted-foreground")}>
                                        {card.price}
                                    </CardTitle>
                                    <CardDescription>
                                        {card.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-3">
                                    {card.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 fill-primary text-primary" />
                                            <p>{feature}</p>
                                        </div>
                                    ))}
                                </CardContent>
                                <CardFooter className="mt-auto flex flex-col gap-2">
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/signup`}
                                        className={cn(
                                            "w-full text-center text-primary-foreground bg-primary p-2 rounded-md text-sm font-medium",
                                            card.title !== "Pro" && "!bg-foreground !text-background"
                                        )}
                                    >
                                        {card.buttonText}
                                    </a>
                                    <p className="text-xs text-muted-foreground text-center">Pays for itself with a single project</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </Container>
            </Wrapper>

            {/* Section 6: Built for Builders (Social Proof) */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative">
                <div id="testimonials" className="absolute -top-20"></div>
                <div className="hidden md:block absolute -top-1/4 -left-1/3 w-72 h-72 bg-indigo-500 rounded-full blur-[10rem] -z-10"></div>
                <Container>
                    <div className="max-w-4xl mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            Trusted by Indie Devs & Small Studios Worldwide.
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            See how Lemmi Studio helps indie developers reclaim their momentum and ship faster
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="py-10 md:py-20 w-full">
                        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden py-10">
                            <Marquee pauseOnHover className="[--duration:20s] select-none">
                                {firstRow.map((review) => (
                                    <figure
                                        key={review.name}
                                        className={cn(
                                            "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                                            "border-zinc-50/[.1] bg-background over:bg-zinc-50/[.15]",
                                        )}
                                    >
                                        <div className="flex flex-row items-center gap-2">
                                            <UserIcon className="w-6 h-6" />
                                            <div className="flex flex-col">
                                                <figcaption className="text-sm font-medium">
                                                    {review.name}
                                                </figcaption>
                                                <p className="text-xs font-medium text-muted-foreground">{review.username}</p>
                                            </div>
                                        </div>
                                        <blockquote className="mt-2 text-sm">{review.body}</blockquote>
                                    </figure>
                                ))}
                            </Marquee>
                            <Marquee reverse pauseOnHover className="[--duration:20s] select-none">
                                {secondRow.map((review) => (
                                    <figure
                                        key={review.name}
                                        className={cn(
                                            "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                                            "border-zinc-50/[.1] bg-background over:bg-zinc-50/[.15]",
                                        )}
                                    >
                                        <div className="flex flex-row items-center gap-2">
                                            <UserIcon className="w-6 h-6" />
                                            <div className="flex flex-col">
                                                <figcaption className="text-sm font-medium">
                                                    {review.name}
                                                </figcaption>
                                                <p className="text-xs font-medium text-muted-foreground">{review.username}</p>
                                            </div>
                                        </div>
                                        <blockquote className="mt-2 text-sm">{review.body}</blockquote>
                                    </figure>
                                ))}
                            </Marquee>
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background"></div>
                            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background"></div>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 8: Your Questions, Answered (Objection Handling) */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative">
                <div id="faq" className="absolute -top-20"></div>
                <Container>
                    <div className="max-w-3xl mx-auto text-start md:text-center">
                        <h2 className="text-3xl lg:text-4xl font-semibold mt-6">
                            No More Excuses.
                        </h2>
                        <p className="text-muted-foreground mt-6 text-lg">
                            Everything you need to know before you start
                        </p>
                    </div>
                </Container>
                <Container>
                    <div className="py-10 w-full max-w-3xl mx-auto">
                        <div className="space-y-4">
                            <details className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg">
                                    Do I own the assets I create?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Absolutely. 100% yours. You own all the assets you create with Lemmi Studio, with full commercial rights. Use them however you want.
                                </p>
                            </details>
                            
                            <details className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg">
                                    Is this compliant with Apple&apos;s guidelines?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Yes. We built Lemmi Studio with Apple&apos;s App Store guidelines in mind. All generated copy respects character limits and follows best practices.
                                </p>
                            </details>
                            
                            <details className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg">
                                    What if I don&apos;t have design skills?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    This tool is made for you. Zero design experience required. Our AI handles the heavy lifting, and our visual editor makes tweaks simple.
                                </p>
                            </details>
                            
                            <details className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg">
                                    What about Android / Google Play?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Coming soon! Sign up and we&apos;ll notify you as soon as Android support is available.
                                </p>
                            </details>
                            
                            <details className="group border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer font-semibold text-lg">
                                    Can I cancel anytime?
                                    <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-4 text-muted-foreground">
                                    Yes. No questions asked. Cancel your subscription at any time from your dashboard.
                                </p>
                            </details>
                        </div>
                    </div>
                </Container>
            </Wrapper>

            {/* Section 9: Don't Let Your App Die in a Folder (Final CTA) */}
            <Wrapper className="flex flex-col items-center justify-center py-12 relative overflow-hidden">
                <InteractiveGridPattern
                    className={cn(
                        "absolute inset-0 w-screen left-1/2 -translate-x-1/2",
                        "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
                    )}
                    width={40}
                    height={40}
                    squares={[60, 40]}
                    squaresClassName="fill-primary/10 hover:fill-primary/30 transition-colors duration-500"
                />
                <Container className="relative z-10">
                    <div className="flex flex-col items-center justify-center text-center py-20 max-w-4xl mx-auto">
                        {/* Heading */}
                        <BlurFade delay={0.1}>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                                Ready to Launch Faster?
                            </h2>
                        </BlurFade>
                        
                        {/* Description */}
                        <BlurFade delay={0.2}>
                            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
                                Transform your screenshots into App Store-ready marketing assets in minutes, not days.
                            </p>
                        </BlurFade>
                        
                        {/* CTA Button */}
                        <BlurFade delay={0.3}>
                            <a href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/signup`}>
                                <ShimmerButton className="shadow-2xl" >
                                    <span className="flex items-center gap-2 px-8 py-1 text-lg font-semibold whitespace-nowrap">
                                        Get Started – It&apos;s Free
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                </ShimmerButton>
                            </a>
                        </BlurFade>
                        
                        {/* Trust Indicator */}
                        <BlurFade delay={0.4}>
                            <p className="text-sm text-muted-foreground mt-6">
                                No credit card required • Setup in 2 minutes
                            </p>
                        </BlurFade>
                    </div>
                </Container>
            </Wrapper>

        </section>
    )
};

export default HomePage
