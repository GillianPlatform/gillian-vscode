import { ReactFlow } from "@gillianplatform/sedap-react";
const { ControlButton: RFControlButton } = ReactFlow;

export type ControlButtonProps = {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
};

export default function ControlButton({ active, onClick, children, title }: ControlButtonProps) {
  return (
    <RFControlButton
      className={active ? "" : "secondary"}
      onClick={() => {
        onClick();
      }}
      title={title}
    >
      {children}
    </RFControlButton>
  );
}
