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
      anchors={["hero", "splitcards", "footer"]}
      render={() => (
        <ReactFullpage.Wrapper>
          {/* Hero */}
          <div className="section h-screen w-screen p-0 m-0">
            <HeroSlider />
          </div>

          {/* Cards */}
          <div className="section h-screen w-screen bg-brand-cream flex items-stretch justify-center">
            <SplitCardsSection />
          </div>

          {/* Footer - scrollable small section */}
          <div className="section fp-auto-height bg-[#FDF8F3]">
            <Footer />
          </div>

        </ReactFullpage.Wrapper>
      )}
    />
  );
}
