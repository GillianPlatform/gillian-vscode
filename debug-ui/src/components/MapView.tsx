import {
  DEFAULT_REACT_FLOW_PROPS,
  NodePrev,
  TraceView,
  TraceViewProps,
} from "@gillianplatform/sedap-react";
import IconButton from "./IconButton";
import Badge from "./Badge";
import styled from "styled-components";
import Sidebar, { Subst } from "./Sidebar";
import { CurrentSteps, Nodes } from "@gillianplatform/sedap-vscode-ui";
import MinimapControl, { MinimapControlProps } from "./MinimapControl";

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
  substs?: Subst[] | undefined;
  selectedNodes: CurrentSteps;
  onNodeSelected: (id: string) => void;
  onNextStepSelected: (prev: NodePrev) => void;
  onZoomNode: (id: string, name: string) => void;
} & MinimapControlProps;

function MapView({
  root,
  nodes,
  substs,
  selectedNodes,
  onNodeSelected,
  onNextStepSelected,
  onZoomNode,
  minimapVisible,
  toggleMinimap,
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
          <MinimapControl {...{ minimapVisible, toggleMinimap }} />
        </TraceView>
      </MapWrap>
      <Sidebar {...{ substs, selectedNodes: selectedNodes.primary || [], onNodeSelected }} />
    </Wrap>
  );
}

export default MapView;
