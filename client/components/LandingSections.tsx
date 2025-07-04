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
          {/* Hero Section - Full height */}
          <div className="section h-screen w-screen p-0 m-0 relative">
            <HeroSlider />
          </div>

          {/* Features Section - Full height */}
          <div className="section h-screen w-screen bg-apple-mesh flex items-center justify-center p-0 m-0">
            <div className="w-full h-full flex items-center justify-center">
              <SplitCardsSection />
            </div>
          </div>

          {/* Footer Section - Half height, same background */}
          <div className="section bg-apple-mesh" style={{ height: '50vh' }}>
            <div className="w-full h-full flex items-center justify-center">
              <Footer />
            </div>
          </div>

        </ReactFullpage.Wrapper>
      )}
    />
  );
}