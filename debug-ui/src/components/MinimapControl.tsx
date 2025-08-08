import { VscMap } from "react-icons/vsc";
import { ReactFlow } from "@gillianplatform/sedap-react";
const { Controls, ControlButton } = ReactFlow;

export type MinimapControlProps = {
  minimapVisible: boolean;
  toggleMinimap: () => void;
};

export default function MinimapControl({ minimapVisible, toggleMinimap }: MinimapControlProps) {
  return (
    <Controls
      showZoom={false}
      showFitView={false}
      showInteractive={false}
      position="bottom-right"
      className="minimapControl"
    >
      <ControlButton
        className={minimapVisible ? "secondary" : ""}
        onClick={() => {
          toggleMinimap();
        }}
        title="Toggle minimap"
      >
        <VscMap />
      </ControlButton>
    </Controls>
  );
}
