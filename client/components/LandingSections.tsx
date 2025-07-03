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
      anchors={["hero", "splitcards", "footer"]}
      scrollOverflow={true}
      render={() => {
        return (
          <ReactFullpage.Wrapper>
            {/* Hero Section */}
            <div className="section h-screen w-screen p-0 m-0">
              <HeroSlider />
            </div>

            {/* Split Cards Section */}
            <div className="section h-screen w-screen bg-brand-cream flex items-stretch justify-center">
              <SplitCardsSection />
            </div>

            {/* Footer Section */}
            <div className="section h-screen w-screen p-0 m-0">
                <Footer />
            </div>

          </ReactFullpage.Wrapper>
        );
      }}
    />
  );
}
