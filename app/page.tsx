import { StravaClient } from "@/lib/strava";
import { Activity, Lock, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const stravaClient = new StravaClient();
  const authUrl = stravaClient.getAuthUrl();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Full Screen Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        {/* 
          Using high-res 4K image (w=3840) with DPR=2 for Retina displays
          q=90 for higher quality, auto=format for WebP on supported browsers
        */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=3840&q=90&auto=format&fit=crop&dpr=2')",
            imageRendering: "auto",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        />
      </div>

      {/* Main Content Container */}
      <main className="relative z-20 w-full max-w-[500px] animate-in fade-in zoom-in duration-700">
        {/* Central Onboarding Card */}
        <div className="backdrop-blur-lg bg-white/95 dark:bg-[#23150f]/90 rounded-3xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center">
          {/* App Icon / Brand Logo */}
          <div className="mb-8 p-4 bg-[#fc4e03] rounded-full shadow-lg shadow-[#fc4e03]/30">
            <Activity className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>

          {/* Welcome Text */}
          <div className="space-y-3 mb-10">
            <h1 className="text-[#181310] dark:text-white text-3xl font-extrabold leading-tight tracking-tight">
              Your Runs, Reimagined
            </h1>
            <p className="text-[#8d6c5e] dark:text-gray-400 text-lg font-normal leading-relaxed">
              Create beautiful, shareable cards from your Strava activities in seconds.
            </p>
          </div>

          {/* Primary Action */}
          <div className="w-full space-y-4">
            <a
              href={authUrl}
              className="group flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full h-14 px-8 bg-[#fc4e03] text-white text-lg font-bold leading-normal transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#fc4e03]/20 hover:shadow-xl hover:shadow-[#fc4e03]/30"
            >
              <span className="truncate">Connect with Strava</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Secondary Context */}
            <div className="flex justify-center">
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full text-[#8d6c5e] dark:text-gray-400 text-sm font-medium">
                <Lock className="w-4 h-4" />
                <span className="truncate">Secure &amp; Private Connection</span>
              </div>
            </div>
          </div>

          {/* Trust Statement */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 w-full">
            <p className="text-[#8d6c5e] dark:text-gray-500 text-sm font-normal leading-relaxed max-w-xs mx-auto">
              We only access your activity data to generate your beautiful stats. Your data remains yours.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-8 flex flex-col gap-4 text-center">
          <div className="flex items-center justify-center gap-6">
            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Privacy Policy
            </Link>
            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
            <Link href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-white/60 text-xs font-normal">
            © 2024 RunStat. Built for the community.
          </p>
        </footer>
      </main>

      {/* Visual Polish: Decorative elements */}
      <div className="fixed top-10 left-10 z-20 hidden lg:block">
        <div className="flex items-center gap-2 text-white/90">
          <div className="w-8 h-8 bg-[#fc4e03] rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tighter text-xl">RunStat</span>
        </div>
      </div>
    </div>
  );
}
