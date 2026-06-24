import {
  DEFAULT_REACT_FLOW_PROPS,
  NodePrev,
  TraceView,
  TraceViewProps,
} from "@gillianplatform/sedap-react";
import IconButton from "./IconButton";
import Badge from "./Badge";
import styled from "styled-components";
import { CurrentSteps, Nodes } from "@gillianplatform/sedap-vscode-ui";
import Controls from "./Controls";
import ControlButton from "./ControlButton";
import { VscMap } from "react-icons/vsc";
import Status from "./Status";

const Wrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;
const MapWrap = styled.div`
  flex-grow: 4;
`;

export type MapViewProps = {
  root: string;
  nodes: Nodes;
  selectedNodes: CurrentSteps;
  onNodeSelected: (id: string) => void;
  onNextStepSelected: (prev: NodePrev) => void;
  onZoomNode: (id: string, name: string) => void;
  minimapVisible: boolean;
  toggleMinimap: () => void;
  status: [boolean, boolean] | undefined;
};

function MapView({
  root,
  nodes,
  selectedNodes,
  onNodeSelected,
  onNextStepSelected,
  onZoomNode,
  minimapVisible,
  toggleMinimap,
  status,
}: MapViewProps) {
  const traceViewProps: TraceViewProps = {
    root,
    nodes,
    selectedNodes,
    onNodeSelected,
    onNextStepSelected,
    onZoomNode,
    showMinimap: minimapVisible,
    componentOverrides: {
      button: IconButton,
      badge: Badge,
    },
    reactFlowProps: {
      id: root,
      ...DEFAULT_REACT_FLOW_PROPS,
    },
    nodeTooltips: true,
  };

  return (
    <Wrap>
      <MapWrap>
        <TraceView {...traceViewProps}>
          <Status status={status} />
          <Controls>
            <ControlButton active={!minimapVisible} onClick={toggleMinimap} title="Toggle minimap">
              <VscMap />
            </ControlButton>
          </Controls>
        </TraceView>
      </MapWrap>
    </Wrap>
  );
}

export default MapView;
