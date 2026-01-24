import { Composition, Folder } from "remotion";
import "./style.css";

// Compositions
import { HeroAnimation } from "./compositions/HeroAnimation";
import { SpeakAnimation } from "./compositions/steps/SpeakAnimation";
import { AIExtractsAnimation } from "./compositions/steps/AIExtractsAnimation";
import { PatternsAnimation } from "./compositions/steps/PatternsAnimation";

export const RemotionRoot = () => {
  return (
    <>
      {/* Main Hero Video */}
      <Composition
        id="HeroAnimation"
        component={HeroAnimation}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Step Videos */}
      <Folder name="Steps">
        <Composition
          id="SpeakAnimation"
          component={SpeakAnimation}
          durationInFrames={180}
          fps={30}
          width={480}
          height={480}
        />
        <Composition
          id="AIExtractsAnimation"
          component={AIExtractsAnimation}
          durationInFrames={180}
          fps={30}
          width={480}
          height={480}
        />
        <Composition
          id="PatternsAnimation"
          component={PatternsAnimation}
          durationInFrames={180}
          fps={30}
          width={480}
          height={480}
        />
      </Folder>
    </>
  );
};
