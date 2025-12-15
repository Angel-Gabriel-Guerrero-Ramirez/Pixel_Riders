import "./gameStyle.css";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <div className="game-root">{children}</div>;
}