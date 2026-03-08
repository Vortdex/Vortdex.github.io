import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SwapWidget from "@/components/SwapWidget";
import BridgeSection from "@/components/BridgeSection";
import LimitOrderPanel from "@/components/LimitOrderPanel";
import ProtocolCards from "@/components/ProtocolCards";
import LiquiditySection from "@/components/LiquiditySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Global cyber grid underlay */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0" />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <SwapWidget />
        <BridgeSection />
        <LimitOrderPanel />
        <ProtocolCards />
        <LiquiditySection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
