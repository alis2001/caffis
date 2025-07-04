"use client";

import React from "react";
import ReactFullpage from "@fullpage/react-fullpage";
import SplitCardsSection from "@/components/SplitCardsSection";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";

export default function LandingSections() {
  return (
    <ReactFullpage
      licenseKey={"gplv3-license"}
      scrollingSpeed={900}
      navigation
      scrollOverflow={true}
      anchors={["hero", "features", "footer"]}
      navigationTooltips={["Home", "Features", "Contact"]}
      render={() => (
        <ReactFullpage.Wrapper>
          {/* Hero Section */}
          <div className="section h-screen w-screen p-0 m-0 relative">
            <HeroSlider />
          </div>

          {/* Features Section */}
          <div className="section h-screen w-screen bg-apple-mesh flex items-center justify-center p-0 m-0">
            <div className="w-full h-full flex items-center justify-center">
              <SplitCardsSection />
            </div>
          </div>

          {/* Footer Section */}
          <div className="section fp-auto-height bg-apple-mesh min-h-screen">
            <Footer />
          </div>

        </ReactFullpage.Wrapper>
      )}
    />
  );
}