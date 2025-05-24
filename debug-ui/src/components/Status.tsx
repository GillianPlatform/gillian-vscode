import { ReactFlow } from "@gillianplatform/sedap-react";
import { VscError, VscPass, VscRunCoverage, VscRunErrors } from "react-icons/vsc";
import styled from "styled-components";
const { Panel } = ReactFlow;

export type StatusProps = {
  status: [boolean, boolean] | undefined;
};

const ContentWrap = styled.div<{ $color: string }>`
  border-radius: 0 0 0 0.5em;
  background-color: var(--background);
  padding: 0.5em;
  color: var(--${(props) => props.$color});
  font-style: italic;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
`;

function Status({ status }: StatusProps) {
  if (!status) return undefined;
  const [isFinished, hasErrors] = status;
  const content = (() => {
    if (isFinished) {
      if (hasErrors) {
        return (
          <ContentWrap $color="error">
            <VscError />
            <span>Analysis complete, errors found.</span>
          </ContentWrap>
        );
      } else {
        return (
          <ContentWrap $color="success">
            <VscPass />
            <span>Analysis successful!</span>
          </ContentWrap>
        );
      }
    } else {
      if (hasErrors) {
        return (
          <ContentWrap $color="warning">
            <VscRunErrors />
            <span>Analysis incomplete, errors found...</span>
          </ContentWrap>
        );
      } else {
        return (
          <ContentWrap $color="hint">
            <VscRunCoverage />
            <span>Analysis incomplete...</span>
          </ContentWrap>
        );
      }
    }
  })();
  return (
    <Panel style={{ margin: 0 }} position="top-right">
      {content}
    </Panel>
  );
}

export default Status;
