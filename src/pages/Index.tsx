import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SwapWidget from "@/components/SwapWidget";
import LimitOrderPanel from "@/components/LimitOrderPanel";
import ProtocolCards from "@/components/ProtocolCards";
import LiquiditySection from "@/components/LiquiditySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SwapWidget />
      <LimitOrderPanel />
      <ProtocolCards />
      <LiquiditySection />
      <Footer />
    </div>
  );
};

export default Index;
