import { ReactFlow } from "@gillianplatform/sedap-react";
const { Controls: RFControls } = ReactFlow;

export type ControlsProps = {
  children: React.ReactNode;
};

export default function Controls({ children }: ControlsProps) {
  return (
    <RFControls
      showZoom={false}
      showFitView={false}
      showInteractive={false}
      position="bottom-right"
      orientation="horizontal"
      className="gillianControls"
    >
      {children}
    </RFControls>
  );
}
